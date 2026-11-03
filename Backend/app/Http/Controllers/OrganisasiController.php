<?php

namespace App\Http\Controllers;

use App\Models\Organisasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class OrganisasiController extends Controller
{
    public function index()
    {
        return Organisasi::all();
    }

    public function search(Request $request)
    {
        $search = $request->query('search');

        if (!$search) {
            return Organisasi::all();
        }

        return Organisasi::where('NAMA', 'LIKE', "%{$search}%")
            ->orWhere('ALAMAT', 'LIKE', "%{$search}%")
            ->orWhere('TELEPON', 'LIKE', "%{$search}%")
            ->orWhere('DESKRIPSI', 'LIKE', "%{$search}%")
            ->orWhere('EMAIL', 'LIKE', "%{$search}%")
            ->orWhere('STATUS', 'LIKE', "%{$search}%")
            ->orWhere('ID_ORGANISASI', 'LIKE', "%{$search}%")
            ->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'NAMA' => 'required|string|max:250',
            'ALAMAT' => 'nullable|string',
            'TELEPON' => 'nullable|string|max:20',
            'DESKRIPSI' => 'nullable|string',
            'EMAIL' => 'required|string|max:250|email|unique:organisasis,EMAIL',
            'PASSWORD' => 'required|string|min:6|max:250',
            'STATUS' => 'nullable|in:active,inactive',
            'FOTO_ORGANISASI' => 'nullable|image|mimes:jpg,png,jpeg|max:2048',
        ]);

        $data = $request->only([
            'NAMA',
            'ALAMAT',
            'TELEPON',
            'DESKRIPSI',
            'EMAIL',
            'STATUS',
        ]);

        if ($request->hasFile('FOTO_ORGANISASI')) {
            $path = $request->file('FOTO_ORGANISASI')->store('organisasi_logos', 'public');
            $data['FOTO_ORGANISASI'] = $path;
        }

        $data['ID_ORGANISASI'] = Organisasi::generateIdOrganisasi();
        $data['PASSWORD'] = Hash::make($request->PASSWORD);
        $data['STATUS'] = $data['STATUS'] ?? 'active'; // Default to active if not provided

        $organisasi = DB::transaction(function () use ($data) {
            $organisasi = Organisasi::create($data);
            $organisasi->assignRole('organisasi');

            return $organisasi;
        });

        return response()->json($organisasi);
    }

    public function show($id)
    {
        return Organisasi::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $organisasi = Organisasi::findOrFail($id);

        $request->validate([
            'NAMA' => 'required|string|max:250',
            'ALAMAT' => 'nullable|string',
            'TELEPON' => 'nullable|string|max:20',
            'DESKRIPSI' => 'nullable|string',
            'EMAIL' => 'nullable|string|max:250|email|unique:organisasis,EMAIL,' . $organisasi->ID_ORGANISASI . ',ID_ORGANISASI',
            'PASSWORD' => 'nullable|string|min:6|max:250',
            'STATUS' => 'nullable|in:active,inactive',
            'FOTO_ORGANISASI' => 'nullable|image|mimes:jpg,png,jpeg|max:2048',
        ]);

        $data = $request->only([
            'NAMA',
            'ALAMAT',
            'TELEPON',
            'DESKRIPSI',
            'EMAIL',
            'STATUS',
        ]);

        if ($request->filled('PASSWORD')) {
            $data['PASSWORD'] = Hash::make($request->PASSWORD);
        }

        if ($request->hasFile('FOTO_ORGANISASI')) {
            if ($organisasi->FOTO_ORGANISASI) {
                Storage::disk('public')->delete($organisasi->FOTO_ORGANISASI);
            }
            $path = $request->file('FOTO_ORGANISASI')->store('organisasi_logos', 'public');
            $data['FOTO_ORGANISASI'] = $path;
        }

        $organisasi->update($data);

        if (!$organisasi->hasRole('organisasi')) {
            $organisasi->assignRole('organisasi');
        }

        return $organisasi;
    }

    public function destroy($id)
    {
        try {
            $organisasi = Organisasi::findOrFail($id);
            // Toggle the STATUS field
            $organisasi->STATUS = $organisasi->STATUS === 'active' ? 'inactive' : 'active';
            $organisasi->save();

            return response()->json([
                'message' => 'Organisasi status updated to ' . $organisasi->STATUS,
                'data' => $organisasi
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error updating organisasi status: " . $e->getMessage());
            return response()->json([
                'error' => 'Failed to update organisasi status',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}