<?php

namespace App\Http\Controllers;

use App\Models\Donasi;
use App\Models\RequestDonasi;
use App\Models\BarangTitipan;
use App\Models\Organisasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class DonasiController extends Controller
{
    public function index()
    {
        return Donasi::all();
    }

    public function historyDonasi()
    {
        $donasisWithData = Donasi::all()
            ->map(function ($donasi) {
                $requestDonasi = RequestDonasi::find($donasi->ID_REQUEST);
                $organisasi = $requestDonasi ? Organisasi::find($requestDonasi->ID_ORGANISASI) : null;
                $barangInfo = BarangTitipan::find($donasi->KODE_PRODUK);
                $barangArray = $barangInfo ? [$barangInfo->NAMA_PRODUK ?? $barangInfo->NAMA ?? 'Unknown Item'] : ['Unknown Item'];
                
                return [
                    'id' => $donasi->ID_REQUEST,
                    'organisasi' => $organisasi ? $organisasi->NAMA : 'Unknown',
                    'barang' => $barangArray,
                    'nama_penerima' => $donasi->NAMA_PENERIMA ?? 'Belum ditentukan',
                    'tanggal_donasi' => $donasi->TANGGAL_DONASI ? date('Y-m-d', strtotime($donasi->TANGGAL_DONASI)) : 'Belum ditentukan',
                    'status' => $donasi->TANGGAL_DONASI ? 'Diterima' : 'Menunggu',
                    'kode_produk' => $donasi->KODE_PRODUK
                ];
            });

        return response()->json($donasisWithData);
    }

    public function store(Request $request)
    {
        $request->validate([
            'KODE_PRODUK' => 'required|string|max:10|exists:barangtitipans,KODE_PRODUK',
            'ID_REQUEST' => 'required|integer|exists:requestdonasis,ID_REQUEST',
            'NAMA_PENERIMA' => 'nullable|string|max:50',
            'TANGGAL_DONASI' => 'nullable|date',
        ]);

        try {
            $donasi = DB::transaction(function () use ($request) {
                $barangTitipan = BarangTitipan::where('KODE_PRODUK', $request->KODE_PRODUK)
                    ->lockForUpdate()
                    ->firstOrFail();

                $statusYangBolehDidonasikan = ['Didonasikan', 'Hangus', 'Kadaluarsa'];
                if (!in_array($barangTitipan->STATUS, $statusYangBolehDidonasikan, true)) {
                    throw ValidationException::withMessages([
                        'KODE_PRODUK' => 'Barang dengan status ' . $barangTitipan->STATUS . ' tidak tersedia untuk didonasikan.',
                    ]);
                }

                if (Donasi::where('KODE_PRODUK', $request->KODE_PRODUK)->exists()) {
                    throw ValidationException::withMessages([
                        'KODE_PRODUK' => 'Barang ini sudah tercatat dalam donasi lain.',
                    ]);
                }

                if (Donasi::find($request->ID_REQUEST)) {
                    throw ValidationException::withMessages([
                        'ID_REQUEST' => 'Request donasi ini sudah memiliki data donasi.',
                    ]);
                }

                $requestDonasi = RequestDonasi::findOrFail($request->ID_REQUEST);
                if ($requestDonasi->STATUS === 'ditolak') {
                    throw ValidationException::withMessages([
                        'ID_REQUEST' => 'Request donasi yang sudah ditolak tidak dapat didonasikan.',
                    ]);
                }

                $donasi = Donasi::create([
                    'KODE_PRODUK' => $request->KODE_PRODUK,
                    'ID_REQUEST' => $request->ID_REQUEST,
                    'NAMA_PENERIMA' => $request->NAMA_PENERIMA,
                    'TANGGAL_DONASI' => $request->TANGGAL_DONASI,
                ]);

                // Barang yang sudah dipasangkan ke request donasi tidak boleh muncul lagi
                // sebagai kandidat donasi.
                $barangTitipan->update(['STATUS' => 'Telah Didonasikan']);

                // Konfirmasi request sekaligus agar alur UI dan API konsisten.
                $requestDonasi->STATUS = 'dikonfirmasi';
                if (auth('pegawai')->check()) {
                    $requestDonasi->ID_PEGAWAI = auth('pegawai')->id();
                }
                $requestDonasi->save();

                return $donasi;
            });

            return response()->json([
                'message' => 'Donasi berhasil dibuat',
                'data' => $donasi
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi donasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error("Failed to create donation: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat donasi: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show($id)
    {
        return Donasi::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        try {
            return DB::transaction(function () use ($request, $id) {
                $request->validate([
                    'NAMA_PENERIMA' => 'required|string|max:50',
                    'TANGGAL_DONASI' => 'required|date|before_or_equal:today',
                ]);

                $donasi = Donasi::findOrFail($id);
                Log::info("Found donation ID_REQUEST: {$id}");

                $barangTitipan = BarangTitipan::where('KODE_PRODUK', $donasi->KODE_PRODUK)->first();
                if (!$barangTitipan) {
                    Log::error("BarangTitipan not found for KODE_PRODUK: {$donasi->KODE_PRODUK}");
                    throw new \Exception("Associated item not found");
                }
                Log::info("Found BarangTitipan KODE_PRODUK: {$donasi->KODE_PRODUK}, Current STATUS: {$barangTitipan->STATUS}");

                if ($donasi->NAMA_PENERIMA && $donasi->TANGGAL_DONASI) {
                    Log::warning("Donation ID_REQUEST: {$id} already confirmed with NAMA_PENERIMA: {$donasi->NAMA_PENERIMA}, TANGGAL_DONASI: {$donasi->TANGGAL_DONASI}");
                    return response()->json([
                        'success' => false,
                        'message' => 'Donation already confirmed'
                    ], 400);
                }

                $donasi->update([
                    'NAMA_PENERIMA' => $request->NAMA_PENERIMA,
                    'TANGGAL_DONASI' => $request->TANGGAL_DONASI,
                ]);
                Log::info("Updated donation ID_REQUEST: {$id} with NAMA_PENERIMA: {$request->NAMA_PENERIMA}, TANGGAL_DONASI: {$request->TANGGAL_DONASI}");

                if ($barangTitipan->STATUS !== 'Telah Didonasikan') {
                    $barangTitipan->update(['STATUS' => 'Telah Didonasikan']);
                    Log::info("Updated BarangTitipan status to 'Telah Didonasikan' for KODE_PRODUK: {$donasi->KODE_PRODUK}");
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Donation updated successfully',
                    'data' => [
                        'id' => $donasi->ID_REQUEST,
                        'nama_penerima' => $donasi->NAMA_PENERIMA,
                        'tanggal_donasi' => date('Y-m-d', strtotime($donasi->TANGGAL_DONASI)),
                        'kode_produk' => $donasi->KODE_PRODUK,
                    ]
                ], 200);
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error("Validation failed for updating donation ID: {$id}, Errors: " . json_encode($e->errors()));
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error("Donation not found for ID: {$id}");
            return response()->json([
                'success' => false,
                'message' => 'Donation not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error("Failed to update donation ID: {$id}, Error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update donation: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        DB::transaction(function () use ($id) {
            $donasi = Donasi::findOrFail($id);
            $barangTitipan = BarangTitipan::where('KODE_PRODUK', $donasi->KODE_PRODUK)->first();

            $donasi->delete();

            // Jika donasi dibatalkan/dihapus, barang kembali menjadi kandidat donasi
            // agar statusnya tidak menggantung sebagai "Telah Didonasikan".
            if ($barangTitipan && $barangTitipan->STATUS === 'Telah Didonasikan') {
                $barangTitipan->update(['STATUS' => 'Didonasikan']);
            }
        });

        return response()->json(['message' => 'Donation deleted successfully']);
    }
}