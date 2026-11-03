<?php

namespace App\Http\Controllers;

use App\Models\RequestDonasi;
use Illuminate\Http\Request;

class RequestDonasiController extends Controller
{
    public function index() 
    {
        // If organization is logged in, only show their requests
        if (auth('organisasi')->check()) {
            return RequestDonasi::where('ID_ORGANISASI', auth('organisasi')->user()->ID_ORGANISASI)->get();
        }
        
        // For admin/owner, show all requests
        return RequestDonasi::all();
    }

    public function store(Request $request) 
    {
        $request->validate([
            'DESKRIPSI_PERMINTAAN' => 'required|string',
        ]);

        // Get the logged in organization's ID
        $organisasiId = auth('organisasi')->user()->ID_ORGANISASI;
        
        // Create new request with organization ID and default status
        $requestDonasi = new RequestDonasi();
        $requestDonasi->ID_ORGANISASI = $organisasiId;
        $requestDonasi->ID_PEGAWAI = NULL; // Set to NULL or the ID of the employee handling this request
        $requestDonasi->DESKRIPSI_PERMINTAAN = $request->DESKRIPSI_PERMINTAAN;
        $requestDonasi->TANGGAL_PERMINTAAN = now(); // Set to current date
        $requestDonasi->STATUS = 'menunggu konfirmasi';
        $requestDonasi->save();

        return response()->json([
            'message' => 'Request donasi berhasil dibuat',
            'data' => $requestDonasi
        ], 201);
    }

    public function show($id) 
    {
        $requestDonasi = RequestDonasi::findOrFail($id);
        
        // Check if the authenticated organization owns this request
        if (auth('organisasi')->check() && 
            $requestDonasi->ID_ORGANISASI !== auth('organisasi')->user()->ID_ORGANISASI) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        return $requestDonasi;
    }

    public function update(Request $request, $id) 
    {
        $requestDonasi = RequestDonasi::findOrFail($id);
        
        // Check if the authenticated organization owns this request
        if (auth('organisasi')->check() && 
            $requestDonasi->ID_ORGANISASI !== auth('organisasi')->user()->ID_ORGANISASI) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $request->validate([
            'DESKRIPSI_PERMINTAAN' => 'nullable|string',
            'STATUS' => 'nullable|in:menunggu konfirmasi,dikonfirmasi,ditolak',
            'ID_PEGAWAI' => 'nullable|exists:pegawais,ID_PEGAWAI',
        ]);
        
        // Update fields if provided
        if ($request->has('DESKRIPSI_PERMINTAAN')) {
            $requestDonasi->DESKRIPSI_PERMINTAAN = $request->DESKRIPSI_PERMINTAAN;
            $requestDonasi->TANGGAL_PERMINTAAN = now(); // Update to current date
        }
        if ($request->has('STATUS')) {
            $requestDonasi->STATUS = $request->STATUS;
        }
        if ($request->has('ID_PEGAWAI')) {
            $requestDonasi->ID_PEGAWAI = $request->ID_PEGAWAI;
        }
        
        $requestDonasi->save();
        
        return response()->json([
            'message' => 'Request donasi berhasil diperbarui',
            'data' => $requestDonasi
        ]);
    }

    public function destroy($id) 
    {
        $requestDonasi = RequestDonasi::findOrFail($id);
        
        // Check if the authenticated organization owns this request
        if (auth('organisasi')->check() && 
            $requestDonasi->ID_ORGANISASI !== auth('organisasi')->user()->ID_ORGANISASI) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $requestDonasi->delete();
        
        return response()->json(['message' => 'Request donasi berhasil dihapus']);
    }
}