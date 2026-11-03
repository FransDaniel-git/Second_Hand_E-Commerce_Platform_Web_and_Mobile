<?php

namespace App\Http\Controllers;

use App\Models\Pembeli;
use App\Models\TransaksiPenjualan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PembeliController extends Controller
{
    public function index()
    {
        return Pembeli::all();
    }

    public function store(Request $request)
    {
        $request->validate([
            'NAMA' => 'required|string|max:50',
            'TELEPON' => 'nullable|string|max:20',
            'POIN_LOYALITAS' => 'nullable|integer',
            'EMAIL' => 'nullable|string|max:50|email|unique:pembelis,EMAIL',
            'PASSWORD' => 'nullable|string|max:50',
            'STATUS' => 'nullable|in:active,inactive',
            'FOTO_PEMBELI' => 'nullable|image|mimes:jpg,png,jpeg|max:2048',
        ]);

        $data = $request->all();

        if ($request->hasFile('FOTO_PEMBELI')) {
            $path = $request->file('FOTO_PEMBELI')->store('pembeli_photos', 'public');
            $data['FOTO_PEMBELI'] = $path;
        }

        return Pembeli::create($data);
    }

    public function show(Request $request, $id)
    {
        $pembeli = Pembeli::find($id);
        if (!$pembeli) {
            return response()->json(['message' => 'Pembeli tidak ditemukan'], 404);
        }

        // Pembeli hanya boleh membaca profilnya sendiri.
        if (auth('pembeli')->check()) {
            if ((string) auth('pembeli')->id() !== (string) $pembeli->ID_PEMBELI) {
                return response()->json(['message' => 'Anda tidak berhak mengakses data pembeli ini'], 403);
            }

            return response()->json($pembeli);
        }

        // Penitip hanya boleh membaca data pembeli yang terhubung melalui transaksi barang titipannya.
        if (auth('penitip')->check()) {
            $penitipId = auth('penitip')->id();
            $hasRelation = TransaksiPenjualan::where('ID_PEMBELI', $pembeli->ID_PEMBELI)
                ->whereHas('barangTitipan.penitipan', function ($query) use ($penitipId) {
                    $query->where('ID_PENITIP', $penitipId);
                })
                ->exists();

            if (!$hasRelation) {
                return response()->json(['message' => 'Anda tidak berhak mengakses data pembeli ini'], 403);
            }

            return response()->json($pembeli);
        }

        return response()->json(['message' => 'Tidak terautentikasi'], 401);
    }

    public function update(Request $request, $id)
{
    \Log::info("Starting profile update for ID: {$id}"); // Debug log
    $pembeli = Pembeli::findOrFail($id);

    if (!auth('pembeli')->check() || (string) auth('pembeli')->id() !== (string) $pembeli->ID_PEMBELI) {
        return response()->json(['message' => 'Anda tidak berhak mengubah data pembeli ini'], 403);
    }

    $request->validate([
        'NAMA' => 'sometimes|required|string|max:50',
        'TELEPON' => 'nullable|string|max:20',
        'EMAIL' => 'sometimes|required|string|max:50|email|unique:pembelis,EMAIL,' . $pembeli->ID_PEMBELI . ',ID_PEMBELI',
        'FOTO_PEMBELI' => 'nullable|image|mimes:jpg,png,jpeg|max:2048',
    ]);

    // Hanya field profil yang boleh diubah. Mencegah mass-assignment POIN_LOYALITAS,
    // STATUS, PASSWORD, atau ID_PEMBELI dari request klien.
    $data = $request->only(['NAMA', 'TELEPON', 'EMAIL']);
    \Log::info("Profile update fields for ID {$id}", array_keys($data)); // Debug log

    if ($request->hasFile('FOTO_PEMBELI')) {
        \Log::info("File detected: " . $request->file('FOTO_PEMBELI')->getClientOriginalName()); // Debug log
        // Delete old photo if it exists
        if ($pembeli->FOTO_PEMBELI) {
            \Log::info("Deleting old photo: " . $pembeli->FOTO_PEMBELI);
            Storage::disk('public')->delete($pembeli->FOTO_PEMBELI);
        }
        $path = $request->file('FOTO_PEMBELI')->store('pembeli_photos', 'public');
        \Log::info("New file stored at: " . $path); // Debug log
        $data['FOTO_PEMBELI'] = $path;
    } else {
        \Log::info("No file detected in request"); // Debug log
    }

    try {
        $pembeli->update($data);
        \Log::info("Profile updated successfully for ID: {$id}", $data);
    } catch (\Exception $e) {
        \Log::error("Failed to update profile: " . $e->getMessage());
        return response()->json(['message' => 'Failed to update profile: ' . $e->getMessage()], 500);
    }

    // Return the model to use the accessor for FOTO_PEMBELI
    return response()->json($pembeli);
}

public function destroy($id)
{
    $pembeli = Pembeli::findOrFail($id);
    $pembeli->update(['STATUS' => 'inactive']);
    return response()->json(['message' => 'Pembeli status updated to inactive']);
}
}