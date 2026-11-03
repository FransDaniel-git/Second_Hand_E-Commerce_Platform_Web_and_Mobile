<?php

namespace App\Http\Controllers;

use App\Models\Pegawai;
use App\Models\Jabatan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; // Corrected import
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class PegawaiController extends Controller
{
    public function index()
    {
        // Get all employees with their job positions
        $pegawais = Pegawai::with('jabatan')->get();
        
        // Transform the data to include the JABATAN field
        $pegawaisWithJabatan = $pegawais->map(function ($pegawai) {
            $data = $pegawai->toArray();
            $data['JABATAN'] = $pegawai->jabatan ? $pegawai->jabatan->NAMA : 'Unknown Position';
            return $data;
        });
        
        return response()->json($pegawaisWithJabatan);
    }

    public function indexByRole(Request $request, $role)
{
    try {
        // Validate role parameter
        if (!in_array($role, ['hunter', 'gudang', 'kurir'])) {
            return response()->json(['message' => 'Invalid role specified'], 400);
        }

        // Check authentication
        if (!Auth::guard('pegawai')->check()) {
            return response()->json(['message' => 'Tidak terautentikasi'], 401);
        }

        $search = $request->input('search');
        $query = Pegawai::query();

        // Filter by jabatan based on role
        $query->whereHas('jabatan', function ($q) use ($role) {
            $jabatanId = match ($role) {
                'hunter' => 5,
                'gudang' => 3,
                'kurir' => 4,
                default => throw new \Exception('Invalid role'),
            };
            $q->where('ID_JABATAN', $jabatanId);
        });

        // Add search filter if provided
        if ($search) {
            $query->where('NAMA', 'LIKE', "%{$search}%");
        }

        // Select only necessary fields
        $employees = $query->select('ID_PEGAWAI', 'NAMA')->get();

        return response()->json($employees, 200);
    } catch (QueryException $e) {
        \Log::error("Database error in indexByRole: " . $e->getMessage());
        return response()->json(['message' => 'Database error: ' . $e->getMessage()], 500);
    } catch (\Exception $e) {
        \Log::error("Error in indexByRole: " . $e->getMessage() . "\nStack Trace: " . $e->getTraceAsString());
        return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
    }
}
    
    public function store(Request $request)
    {
        return DB::transaction(function () use ($request) {
            $request->validate([
                'ID_JABATAN' => 'required|integer',
                'NAMA' => 'required|string|max:50',
                'TELEPON' => 'nullable|string|max:20',
                'ALAMAT' => 'nullable|string|max:250',
                'TGL_LAHIR' => 'nullable|date',
                'EMAIL' => 'nullable|string|max:50|email',
                'PASSWORD' => 'nullable|string|max:50',
                'STATUS' => 'nullable|in:active,inactive',
            ]);

            $jabatan = Jabatan::find($request->ID_JABATAN);
            if (!$jabatan) {
                return response()->json(['error' => 'Jabatan tidak ditemukan'], 404);
            }

            if (Auth::user()->hasRole('adminbiasa')) {
                // 'adminbiasa' tidak boleh membuat 'admin' (6) atau sesama 'adminbiasa' (7)
                if ($request->ID_JABATAN == 6 || $request->ID_JABATAN == 7) {
                    return response()->json(['error' => 'Anda tidak memiliki hak untuk membuat role Admin atau Admin Biasa.'], 403);
                }
            }

            $data = $request->all();
            $data['ID_PEGAWAI'] = Pegawai::generateIdPegawai();
            if ($request->filled('PASSWORD')) {
                $data['PASSWORD'] = bcrypt($request->PASSWORD);
            }

            $pegawai = Pegawai::create($data);

            try {
                $pegawai->assignRoleByJabatan();
            } catch (\Exception $e) {
                return response()->json(['error' => 'Role assignment failed: ' . $e->getMessage()], 500);
            }

            $pegawai->load('jabatan');
            $response = $pegawai->toArray();
            $response['JABATAN'] = $pegawai->jabatan ? $pegawai->jabatan->NAMA : 'Unknown Position';

            return response()->json($response, 201);
        });
    }

    public function show($id)
    {
        $pegawai = Pegawai::with('jabatan')->findOrFail($id);
        $data = $pegawai->toArray();
        $data['JABATAN'] = $pegawai->jabatan ? $pegawai->jabatan->NAMA : 'Unknown Position';
        
        return response()->json($data);
    }

    public function update(Request $request, $id)
    {
        $pegawai = Pegawai::findOrFail($id);
        $userYangMengedit = Auth::user();

        // ▼▼▼ HANYA TAMBAHKAN BLOK INI ▼▼▼
        // Mencegah 'adminbiasa' mengedit 'admin'
        if ($pegawai->hasRole('admin') && !Auth::user()->hasRole('admin')) {
            return response()->json(['error' => 'Anda tidak memiliki hak untuk mengedit Super Admin.'], 403);
        }
        if ($userYangMengedit->hasRole('adminbiasa') && $pegawai->hasRole('adminbiasa')) {
            return response()->json(['error' => 'Anda tidak dapat mengedit sesama Admin Biasa.'], 403);
        }
        // ▲▲▲ SELESAI ▲▲▲
        
        $data = $request->all();
        
        // If password is provided, encrypt it
        if ($request->filled('PASSWORD')) {
            $data['PASSWORD'] = bcrypt($request->PASSWORD);
        } else {
            // If no password provided, remove it from the data to avoid overwriting
            unset($data['PASSWORD']);
        }
        
        $pegawai->update($data);
        
        // Reassign role if job position changed
        if ($request->has('ID_JABATAN') && $pegawai->wasChanged('ID_JABATAN')) {
            try {
                $pegawai->assignRoleByJabatan();
            } catch (\Exception $e) {
                return response()->json(['error' => 'Role assignment failed: ' . $e->getMessage()], 500);
            }
        }
        
        // Reload the jabatan relationship
        $pegawai->load('jabatan');
        $response = $pegawai->toArray();
        $response['JABATAN'] = $pegawai->jabatan ? $pegawai->jabatan->NAMA : 'Unknown Position';
        
        return response()->json($response);
    }

    public function destroy($id)
    {
        $pegawai = Pegawai::findOrFail($id);
        $userYangMenghapus = Auth::user();

        // ▼▼▼ HANYA TAMBAHKAN BLOK INI ▼▼▼
        if (Auth::user()->ID_PEGAWAI === $pegawai->ID_PEGAWAI) {
            return response()->json(['error' => 'Anda tidak bisa menonaktifkan akun Anda sendiri.'], 403);
        }
        if ($pegawai->hasRole('admin')) {
            return response()->json(['error' => 'Super Admin tidak bisa dinonaktifkan.'], 403);
        }
        if ($userYangMenghapus->hasRole('adminbiasa') && $pegawai->hasRole('adminbiasa')) {
            return response()->json(['error' => 'Anda tidak dapat menonaktifkan sesama Admin Biasa.'], 403);
        }
        // ▲▲▲ SELESAI ▲▲▲

        $pegawai->update(['STATUS' => 'inactive']);
        return response()->json(['message' => 'Pegawai status updated to inactive']);
    }
}