<?php

namespace App\Http\Controllers;
//test2
use App\Models\Alamat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class AlamatController extends Controller
{
    public function index(Request $request)
    {
        try {
            $idPembeli = Auth::guard('pembeli')->id();
            $search = $request->input('search');

            $query = Alamat::where('ID_PEMBELI', $idPembeli);

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('JALAN', 'LIKE', "%{$search}%")
                      ->orWhere('KECAMATAN', 'LIKE', "%{$search}%")
                      ->orWhere('KELURAHAN', 'LIKE', "%{$search}%")
                      ->orWhere('KOTA', 'LIKE', "%{$search}%")
                      ->orWhere('KODE_POS', 'LIKE', "%{$search}%");
                });
            }

            $addresses = $query->get();

            return response()->json($addresses, 200);
        } catch (\Exception $e) {
            Log::error("Failed to fetch addresses: " . $e->getMessage());
            return response()->json(['message' => 'Gagal memuat alamat.'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'JALAN' => 'required|string|max:50',
                'KECAMATAN' => 'required|string|max:50',
                'KELURAHAN' => 'required|string|max:50',
                'KOTA' => 'required|string|max:50',
                'KODE_POS' => 'required|string|regex:/^\d{5}$/',
                'ALAMAT_UTAMA' => 'nullable|boolean',
            ]);

            $idPembeli = Auth::guard('pembeli')->id();

            // Check if this is the first address
            $isFirstAddress = Alamat::where('ID_PEMBELI', $idPembeli)->count() === 0;

            // If the new address is set as primary or it's the first address
            if ($request->input('ALAMAT_UTAMA') || $isFirstAddress) {
                Alamat::where('ID_PEMBELI', $idPembeli)
                    ->where('ALAMAT_UTAMA', true)
                    ->update(['ALAMAT_UTAMA' => false]);
            }

            $alamat = Alamat::create([
                'ID_PEMBELI' => $idPembeli,
                'JALAN' => $request->input('JALAN'),
                'KECAMATAN' => $request->input('KECAMATAN'),
                'KELURAHAN' => $request->input('KELURAHAN'),
                'KOTA' => $request->input('KOTA'),
                'KODE_POS' => $request->input('KODE_POS'),
                'ALAMAT_UTAMA' => $isFirstAddress ? true : $request->input('ALAMAT_UTAMA', false),
            ]);

            return response()->json(['message' => 'Alamat berhasil ditambahkan.', 'data' => $alamat], 201);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Validasi gagal.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error("Failed to create address: " . $e->getMessage());
            return response()->json(['message' => 'Gagal menambahkan alamat.'], 500);
        }
    }

    public function show($id)
    {
        try {
            $alamat = Alamat::where('ID_PEMBELI', Auth::guard('pembeli')->id())
                ->findOrFail($id);
            return response()->json($alamat, 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Alamat tidak ditemukan.'], 404);
        } catch (\Exception $e) {
            Log::error("Failed to fetch address: " . $e->getMessage());
            return response()->json(['message' => 'Gagal memuat alamat.'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $alamat = Alamat::where('ID_PEMBELI', Auth::guard('pembeli')->id())
                ->findOrFail($id);

            $request->validate([
                'JALAN' => 'required|string|max:50',
                'KECAMATAN' => 'required|string|max:50',
                'KELURAHAN' => 'required|string|max:50',
                'KOTA' => 'required|string|max:50',
                'KODE_POS' => 'required|string|regex:/^\d{5}$/',
                'ALAMAT_UTAMA' => 'nullable|boolean',
            ]);

            // If the updated address is set as primary, update existing primary address
            if ($request->input('ALAMAT_UTAMA')) {
                Alamat::where('ID_PEMBELI', $alamat->ID_PEMBELI)
                    ->where('ALAMAT_UTAMA', true)
                    ->update(['ALAMAT_UTAMA' => false]);
            }

            $alamat->update([
                'JALAN' => $request->input('JALAN'),
                'KECAMATAN' => $request->input('KECAMATAN'),
                'KELURAHAN' => $request->input('KELURAHAN'),
                'KOTA' => $request->input('KOTA'),
                'KODE_POS' => $request->input('KODE_POS'),
                'ALAMAT_UTAMA' => $request->input('ALAMAT_UTAMA', false),
            ]);

            return response()->json(['message' => 'Alamat berhasil diperbarui.', 'data' => $alamat], 200);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Validasi gagal.', 'errors' => $e->errors()], 422);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Alamat tidak ditemukan.'], 404);
        } catch (\Exception $e) {
            Log::error("Failed to update address: " . $e->getMessage());
            return response()->json(['message' => 'Gagal memperbarui alamat.'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $alamat = Alamat::where('ID_PEMBELI', Auth::guard('pembeli')->id())
                ->findOrFail($id);
            $idPembeli = $alamat->ID_PEMBELI;

            // Check if this is the last address
            $addressCount = Alamat::where('ID_PEMBELI', $idPembeli)->count();
            if ($addressCount <= 1) {
                return response()->json(
                    ['message' => 'Tidak dapat menghapus alamat terakhir. Minimal harus ada satu alamat.'],
                    422
                );
            }

            // Delete the address
            $alamat->delete();

            // If the deleted address was primary, set another as primary
            if ($alamat->ALAMAT_UTAMA) {
                $newPrimaryAddress = Alamat::where('ID_PEMBELI', $idPembeli)->first();
                if ($newPrimaryAddress) {
                    $newPrimaryAddress->ALAMAT_UTAMA = true;
                    $newPrimaryAddress->save();
                }
            }

            return response()->json(['message' => 'Alamat berhasil dihapus.'], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Alamat tidak ditemukan.'], 404);
        } catch (\Exception $e) {
            Log::error("Failed to delete address: " . $e->getMessage());
            return response()->json(['message' => 'Gagal menghapus alamat.'], 500);
        }
    }
}