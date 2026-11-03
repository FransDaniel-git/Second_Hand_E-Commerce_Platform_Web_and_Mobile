<?php

namespace App\Http\Controllers;

use App\Models\BarangTitipan;
use App\Models\Komisi;
use App\Models\Penitip;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

class PenitipController extends Controller
{
    public function index()
    {
        return Penitip::all();
    }

    public function store(Request $request)
    {
        // Log the incoming request for debugging
        Log::info("Penitip store request received", [
            'request_data' => $request->all(),
            'has_file' => $request->hasFile('FOTO_KTP')
        ]);
        
        // Validate the request
        $request->validate([
            'NAMA' => 'required|string|max:50',
            'ALAMAT' => 'nullable|string|max:250',
            'TELEPON' => 'nullable|string|max:20',
            'NO_KTP' => 'required|string|max:20|unique:penitips,NO_KTP', // Ensure NO_KTP is unique
            'EMAIL' => 'nullable|string|email|max:50',
            'PASSWORD' => 'required|string|max:50',
            'FOTO_KTP' => 'nullable|file|mimes:jpeg,png,jpg,gif|max:2048',
        ], [
            'NO_KTP.unique' => 'Nomor KTP sudah terdaftar. Silakan gunakan nomor KTP lain.',
        ]);

        try {
            // Generate ID_PENITIP
            $penitip = new Penitip();
            $penitip->ID_PENITIP = Penitip::generateIdPenitip();
            $penitip->ID_PEGAWAI = auth()->user()->ID_PEGAWAI;
            $penitip->SALDO = 0;
            $penitip->POIN_LOYALITAS = 0;
            $penitip->RATING = 0;
            $penitip->BADGE = 0;
            $penitip->JLH_PENJUALAN = 0;
            $penitip->STATUS = 'active';

            $penitip->NAMA = $request->NAMA;
            $penitip->ALAMAT = $request->ALAMAT ?? '';
            $penitip->TELEPON = $request->TELEPON ?? '';
            $penitip->NO_KTP = $request->NO_KTP;
            $penitip->EMAIL = $request->EMAIL ?? '';
            $penitip->PASSWORD = bcrypt($request->PASSWORD);

            if ($request->hasFile('FOTO_KTP')) {
                $file = $request->file('FOTO_KTP');
                $path = $file->store('ktp_photos', 'public');
                $penitip->FOTO_KTP = $path;
                Log::info("File uploaded successfully: " . $path);
            }

            // Create the penitip
            $penitip->save();

            // Assign the role to the penitip
            $penitip->assignRole('penitip');

            return response()->json([
                'message' => 'Create penitip berhasil!',
                'data' => $penitip
            ], 201);
            
        } catch (\Exception $e) {
            Log::error("Error creating penitip: " . $e->getMessage());
            return response()->json([
                'error' => 'Failed to create penitip',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        return Penitip::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        Log::info("Penitip update request received for ID: " . $id, [
            'request_data' => $request->all(),
            'has_file' => $request->hasFile('FOTO_KTP')
        ]);
        
        $penitip = Penitip::findOrFail($id);
        
        $request->validate([
            'NAMA' => 'required|string|max:50',
            'ALAMAT' => 'nullable|string|max:250',
            'TELEPON' => 'nullable|string|max:20',
            'NO_KTP' => 'required|string|max:20|unique:penitips,NO_KTP,' . $penitip->ID_PENITIP . ',ID_PENITIP', // Exclude current penitip
            'EMAIL' => 'nullable|string|email|max:50',
            'FOTO_KTP' => 'nullable|file|mimes:jpeg,png,jpg,gif|max:2048',
        ], [
            'NO_KTP.unique' => 'Nomor KTP sudah terdaftar. Silakan gunakan nomor KTP lain.',
        ]);

        try {
            if ($request->hasFile('FOTO_KTP')) {
                if ($penitip->FOTO_KTP) {
                    Storage::disk('public')->delete($penitip->FOTO_KTP);
                }
                $file = $request->file('FOTO_KTP');
                $path = $file->store('ktp_photos', 'public');
                $penitip->FOTO_KTP = $path;
                Log::info("Updated file uploaded successfully: " . $path);
            }

            $penitip->NAMA = $request->NAMA;
            $penitip->ALAMAT = $request->ALAMAT ?? $penitip->ALAMAT;
            $penitip->TELEPON = $request->TELEPON ?? $penitip->TELEPON;
            $penitip->NO_KTP = $request->NO_KTP;
            $penitip->EMAIL = $request->EMAIL ?? $penitip->EMAIL;

            $penitip->save();

            return response()->json([
                'message' => 'Update penitip berhasil!',
                'data' => $penitip
            ]);
            
        } catch (\Exception $e) {
            Log::error("Error updating penitip: " . $e->getMessage());
            return response()->json([
                'error' => 'Failed to update penitip',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $penitip = Penitip::findOrFail($id);
            // Toggle the STATUS field
            $penitip->STATUS = $penitip->STATUS === 'active' ? 'inactive' : 'active';
            $penitip->save();

            return response()->json([
                'message' => 'Penitip status updated to ' . $penitip->STATUS,
                'data' => $penitip
            ]);
        } catch (\Exception $e) {
            Log::error("Error updating penitip status: " . $e->getMessage());
            return response()->json([
                'error' => 'Failed to update penitip status',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // New method to check NO_KTP uniqueness
    public function checkNoKtp(Request $request)
    {
        $noKtp = $request->query('no_ktp');
        $penitipId = $request->query('penitip_id'); // Optional for update checks

        $query = Penitip::where('NO_KTP', $noKtp);
        if ($penitipId) {
            $query->where('ID_PENITIP', '!=', $penitipId);
        }

        $exists = $query->exists();

        return response()->json([
            'is_unique' => !$exists,
            'message' => $exists ? 'Nomor KTP sudah terdaftar.' : 'Nomor KTP tersedia.'
        ]);
    }
    
    public function getTransactionReport(Request $request)
{
    try {
        // Pastikan guard 'penitip' sudah dikonfigurasi di config/auth.php
        $penitipId = auth('penitip')->user()->ID_PENITIP;
        $month = $request->query('month');
        $year = $request->query('year', date('Y'));

        // Debug log
        \Log::info("Getting sold items for penitip: $penitipId, month: $month, year: $year");

        $query = BarangTitipan::select(
                'barangtitipans.KODE_PRODUK',
                'barangtitipans.NAMA',
                'barangtitipans.HARGA_JUAL',
                'barangtitipans.STATUS',
                'barangtitipans.TERJUAL_CEPAT',
                'transaksipenitipans.TANGGAL_PENITIPAN',
                'transaksipenjualans.TANGGAL_PEMBAYARAN',
                'transaksipenjualans.NO_NOTA_PENJUALAN',
                'komisis.KOMISI_PENITIP',
                'komisis.BONUS'
            )
            ->join('transaksipenitipans', 'barangtitipans.ID_PENITIPAN', '=', 'transaksipenitipans.ID_PENITIPAN')
            ->join('transaksipenjualans', 'barangtitipans.ID_PENJUALAN', '=', 'transaksipenjualans.ID_PENJUALAN')
            ->leftJoin('komisis', 'barangtitipans.KODE_PRODUK', '=', 'komisis.KODE_PRODUK')
            ->where('transaksipenitipans.ID_PENITIP', $penitipId)
            ->where('barangtitipans.STATUS', 'Terjual')
            ->whereNotNull('transaksipenjualans.TANGGAL_PEMBAYARAN')
            ->orderBy('transaksipenjualans.TANGGAL_PEMBAYARAN', 'desc');

        if ($month) {
            $query->whereMonth('transaksipenjualans.TANGGAL_PEMBAYARAN', $month);
        }
        $query->whereYear('transaksipenjualans.TANGGAL_PEMBAYARAN', $year);

        $soldItems = $query->get();

        // Debug log
        \Log::info("Found " . $soldItems->count() . " sold items ");

        $mappedItems = $soldItems->map(function ($item) {
            // Safely parse dates
            $tanggalPenitipan = null;
            $tanggalPembayaran = null;
            
            try {
                if ($item->TANGGAL_PENITIPAN) {
                    $tanggalPenitipan = Carbon::parse($item->TANGGAL_PENITIPAN)->format('d-m-Y');
                }
            } catch (\Exception $e) {
                $tanggalPenitipan = $item->TANGGAL_PENITIPAN;
            }
            
            try {
                if ($item->TANGGAL_PEMBAYARAN) {
                    $tanggalPembayaran = Carbon::parse($item->TANGGAL_PEMBAYARAN)->format('d-m-Y H:i:s');
                }
            } catch (\Exception $e) {
                $tanggalPembayaran = $item->TANGGAL_PEMBAYARAN;
            }

            $komisi = $item->KOMISI_PENITIP ?? 0;
            $bonus = $item->BONUS ?? 0;

            return [
                'kode_produk' => $item->KODE_PRODUK,
                'nama_produk' => $item->NAMA,
                'harga_jual' => $item->HARGA_JUAL,
                'status' => $item->STATUS,
                'terjual_cepat' => $item->TERJUAL_CEPAT ? 'Ya' : 'Tidak',
                'tanggal_penitipan' => $tanggalPenitipan,
                'tanggal_pembayaran' => $tanggalPembayaran,
                'no_nota_penjualan' => $item->NO_NOTA_PENJUALAN,
                'komisi_penitip' => $komisi,
                'bonus' => $bonus,
                'total_pendapatan' => $komisi + $bonus
            ];
        });

        $totalPendapatan = $mappedItems->sum('total_pendapatan');

        return response()->json([
            'success' => true,
            'data' => [
                'sold_items' => $mappedItems,
                'total_items' => $mappedItems->count(),
                'total_pendapatan' => $totalPendapatan
            ]
        ], 200);

    } catch (\Exception $e) {
        \Log::error("Error getting sold items simple: " . $e->getMessage());
        \Log::error("Stack trace: " . $e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'message' => 'Failed to get sold items: ' . $e->getMessage()
        ], 500);
    }
}
}