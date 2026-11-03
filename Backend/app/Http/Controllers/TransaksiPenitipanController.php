<?php

namespace App\Http\Controllers;

use App\Models\TransaksiPenitipan;
use App\Models\BarangTitipan;
use App\Models\Subkategori;
use App\Models\FotoProduk;
use App\Models\Penitip;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class TransaksiPenitipanController extends Controller
{
    public function index(Request $request)
    {
        try {
            if (!Auth::guard('pegawai')->check()) {
                return response()->json(['message' => 'Tidak terautentikasi'], 401);
            }

            $search = $request->input('search');
            $query = TransaksiPenitipan::with(['penitip', 'pegawaiHunter', 'pegawaiQC']);

            if ($search) {
                $query->where('NO_NOTA_PENITIPAN', 'LIKE', "%{$search}%");
            }

            $transaksiPenitipans = $query->get()->map(function ($transaksi) {
                return [
                    'ID_PENITIPAN' => $transaksi->ID_PENITIPAN,
                    'ID_PENITIP' => $transaksi->ID_PENITIP,
                    'NAMA_PENITIP' => $transaksi->penitip->NAMA ?? '-',
                    'ALAMAT_PENITIP' => $transaksi->penitip->ALAMAT ?? '-',
                    'ID_PEGAWAI_HUNTER' => $transaksi->ID_PEGAWAI_HUNTER,
                    'NAMA_PEGAWAI_HUNTER' => $transaksi->pegawaiHunter->NAMA ?? '-',
                    'ID_PEGAWAI_QC' => $transaksi->ID_PEGAWAI_QC,
                    'NAMA_PEGAWAI_QC' => $transaksi->pegawaiQC->NAMA ?? '-',
                    'NO_NOTA_PENITIPAN' => $transaksi->NO_NOTA_PENITIPAN,
                    'TANGGAL_PENITIPAN' => $transaksi->TANGGAL_PENITIPAN,
                    'TOTAL_NILAI_BARANG' => $transaksi->TOTAL_NILAI_BARANG,
                    'CATATAN' => $transaksi->CATATAN,
                ];
            });

            return response()->json($transaksiPenitipans, 200);
        } catch (QueryException $e) {
            return response()->json(['message' => 'Gagal mengambil data transaksi: ' . $e->getMessage()], 500);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Terjadi kesalahan server: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'ID_PENITIP' => 'required|string|max:10|exists:penitips,ID_PENITIP',
                'ID_PEGAWAI_HUNTER' => 'nullable|string|max:10|exists:pegawais,ID_PEGAWAI',
                'ID_PEGAWAI_QC' => 'required|string|max:10|exists:pegawais,ID_PEGAWAI',
                'CATATAN' => 'nullable|string|max:250',
                'BARANG_TITIPAN' => 'required|array|min:1',
                'BARANG_TITIPAN.*.NAMA' => 'required|string|max:50',
                'BARANG_TITIPAN.*.ID_SUBKATEGORI' => 'required|integer|exists:subkategoris,ID_SUBKATEGORI',
                'BARANG_TITIPAN.*.HARGA_JUAL' => 'required|integer|min:0',
                'BARANG_TITIPAN.*.BERAT' => 'required|numeric|min:0',
                'BARANG_TITIPAN.*.KONDISI' => 'required|string|max:20',
                'BARANG_TITIPAN.*.TANGGAL_GARANSI' => 'nullable|date',
                'BARANG_TITIPAN.*.DESKRIPSI' => 'required|string',
                'BARANG_TITIPAN.*.FOTOS' => 'required|array|min:3|max:3',
                'BARANG_TITIPAN.*.FOTOS.*' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
                'BARANG_TITIPAN.*.IS_UTAMA_INDEX' => 'required|integer|between:0,2',
            ]);

            if (!Auth::guard('pegawai')->check()) {
                return response()->json(['message' => 'Tidak terautentikasi'], 401);
            }

            return DB::transaction(function () use ($request) {
                $tanggalPenitipan = Carbon::now()->toDateTimeString();

                // Create transaction without NO_NOTA_PENITIPAN initially
                $transaksiPenitipan = TransaksiPenitipan::create([
                    'ID_PENITIP' => $request->input('ID_PENITIP'),
                    'ID_PEGAWAI_HUNTER' => $request->input('ID_PEGAWAI_HUNTER'),
                    'ID_PEGAWAI_QC' => $request->input('ID_PEGAWAI_QC'),
                    'NO_NOTA_PENITIPAN' => null, // Set later
                    'TANGGAL_PENITIPAN' => $tanggalPenitipan,
                    'TOTAL_NILAI_BARANG' => 0,
                    'CATATAN' => $request->input('CATATAN'),
                ]);

                // Generate NO_NOTA_PENITIPAN using ID_PENITIPAN
                $noNota = TransaksiPenitipan::generateNoNotaPenitipan($transaksiPenitipan->ID_PENITIPAN);
                $transaksiPenitipan->NO_NOTA_PENITIPAN = $noNota;
                $transaksiPenitipan->save();

                $totalNilaiBarang = 0;

                foreach ($request->BARANG_TITIPAN as $barangData) {
                    $kodeProduk = BarangTitipan::generateKodeProduk($barangData['NAMA']);
                    
                    $tanggalKadaluarsa = Carbon::parse($transaksiPenitipan->TANGGAL_PENITIPAN)
                        ->addDays(30)
                        ->toDateTimeString();

                    $barangTitipan = BarangTitipan::create([
                        'KODE_PRODUK' => $kodeProduk,
                        'ID_SUBKATEGORI' => $barangData['ID_SUBKATEGORI'],
                        'ID_PENITIPAN' => $transaksiPenitipan->ID_PENITIPAN,
                        'ID_PENJUALAN' => null,
                        'NAMA' => $barangData['NAMA'],
                        'HARGA_JUAL' => $barangData['HARGA_JUAL'],
                        'BERAT' => $barangData['BERAT'],
                        'TANGGAL_KADALUARSA' => $tanggalKadaluarsa,
                        'TANGGAL_PERPANJANGAN' => null,
                        'STATUS' => 'Tersedia',
                        'TERJUAL_CEPAT' => null,
                        'KONDISI' => $barangData['KONDISI'],
                        'TANGGAL_GARANSI' => $barangData['TANGGAL_GARANSI'] ?? null,
                        'rating' => null,
                        'DESKRIPSI' => $barangData['DESKRIPSI'],
                    ]);

                    $fotos = $barangData['FOTOS'] ?? [];
                    $isUtamaIndex = $barangData['IS_UTAMA_INDEX'];

                    foreach ($fotos as $index => $foto) {
                        $path = $foto->store('produk', 'public');
                        FotoProduk::create([
                            'KODE_PRODUK' => $kodeProduk,
                            'URL_FOTO' => $path,
                            'IS_UTAMA' => $index == $isUtamaIndex,
                        ]);
                    }

                    $totalNilaiBarang += $barangData['HARGA_JUAL'];
                }

                $transaksiPenitipan->TOTAL_NILAI_BARANG = $totalNilaiBarang;
                $transaksiPenitipan->save();

                return response()->json([
                    'success' => true,
                    'data' => $transaksiPenitipan->load('barangTitipan'),
                    'message' => 'Transaksi dan barang titipan berhasil dibuat'
                ], 201);
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validasi gagal', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error("Failed to create transaksi penitipan: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan transaksi: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            if (!Auth::guard('pegawai')->check()) {
                return response()->json(['message' => 'Tidak terautentikasi'], 401);
            }
            
            $transaksiPenitipan = TransaksiPenitipan::with(['barangTitipan.fotoProduk'])->findOrFail($id);
            return response()->json([
                'success' => true,
                'data' => $transaksiPenitipan,
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Transaksi tidak ditemukan'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Terjadi kesalahan server: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        \Log::info("Updating transaksi ID: {$id}");
        \Log::info("Request Data: ", $request->all());
        try {
            $request->validate([
                'ID_PENITIP' => 'sometimes|string|max:10|exists:penitips,ID_PENITIP',
                'ID_PEGAWAI_HUNTER' => 'nullable|string|max:10|exists:pegawais,ID_PEGAWAI',
                'ID_PEGAWAI_QC' => 'sometimes|string|max:10|exists:pegawais,ID_PEGAWAI',
                'CATATAN' => 'nullable|string|max:250',
                'BARANG_TITIPAN' => 'sometimes|array',
                'BARANG_TITIPAN.*.KODE_PRODUK' => 'sometimes|string|max:10',
                'BARANG_TITIPAN.*.NAMA' => 'required_with:BARANG_TITIPAN|string|max:50',
                'BARANG_TITIPAN.*.ID_SUBKATEGORI' => 'required_with:BARANG_TITIPAN|integer|exists:subkategoris,ID_SUBKATEGORI',
                'BARANG_TITIPAN.*.HARGA_JUAL' => 'required_with:BARANG_TITIPAN|integer|min:0',
                'BARANG_TITIPAN.*.BERAT' => 'required_with:BARANG_TITIPAN|numeric|min:0',
                'BARANG_TITIPAN.*.KONDISI' => 'required_with:BARANG_TITIPAN|string|max:20',
                'BARANG_TITIPAN.*.TANGGAL_GARANSI' => 'nullable|date|after_or_equal:today',
                'BARANG_TITIPAN.*.DESKRIPSI' => 'required_with:BARANG_TITIPAN|string',
                'BARANG_TITIPAN.*.FOTOS' => 'sometimes|array|min:3|max:3',
                'BARANG_TITIPAN.*.FOTOS.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'BARANG_TITIPAN.*.IS_UTAMA_INDEX' => 'required_with:BARANG_TITIPAN|integer|between:0,2',
            ]);

            if (!Auth::guard('pegawai')->check()) {
                \Log::error("Unauthorized update attempt for transaksi ID: {$id}");
                return response()->json(['success' => false, 'message' => 'Tidak terautentikasi'], 401);
            }

            return DB::transaction(function () use ($request, $id) {
                $transaksiPenitipan = TransaksiPenitipan::findOrFail($id);

                // Update data transaksi
                $transaksiPenitipan->ID_PENITIP = $request->input('ID_PENITIP', $transaksiPenitipan->ID_PENITIP);
                $transaksiPenitipan->ID_PEGAWAI_HUNTER = $request->input('ID_PEGAWAI_HUNTER', $transaksiPenitipan->ID_PEGAWAI_HUNTER);
                $transaksiPenitipan->ID_PEGAWAI_QC = $request->input('ID_PEGAWAI_QC', $transaksiPenitipan->ID_PEGAWAI_QC);
                $transaksiPenitipan->CATATAN = $request->input('CATATAN', $transaksiPenitipan->CATATAN);
                
                // Proses BARANG_TITIPAN
                if ($request->has('BARANG_TITIPAN')) {
                    $barangTitipanIds = [];
                    $totalNilaiBarang = 0;

                    foreach ($request->BARANG_TITIPAN as $barangData) {
                        $subkategori = Subkategori::where('ID_SUBKATEGORI', $barangData['ID_SUBKATEGORI'])
                            ->with('kategori')
                            ->first();
                        $isElektronik = $subkategori && $subkategori->kategori && $subkategori->kategori->NAMA === 'Elektronik & Gadget';
                        
                        // Jika bukan kategori Elektronik & Gadget, set TANGGAL_GARANSI ke null
                        $tanggalGaransi = $isElektronik ? ($barangData['TANGGAL_GARANSI'] ?? null) : null;
                        if (isset($barangData['KODE_PRODUK']) && !empty($barangData['KODE_PRODUK'])) {
                            // Update barang yang ada
                            $barangTitipan = BarangTitipan::where('KODE_PRODUK', $barangData['KODE_PRODUK'])->first();
                            if ($barangTitipan) {
                                $barangTitipan->update([
                                    'ID_SUBKATEGORI' => $barangData['ID_SUBKATEGORI'],
                                    'NAMA' => $barangData['NAMA'],
                                    'HARGA_JUAL' => $barangData['HARGA_JUAL'],
                                    'BERAT' => $barangData['BERAT'],
                                    'KONDISI' => $barangData['KONDISI'],
                                    'TANGGAL_GARANSI' => $tanggalGaransi,
                                    'DESKRIPSI' => $barangData['DESKRIPSI'],
                                ]);
                                $barangTitipanIds[] = $barangTitipan->KODE_PRODUK;
                                $totalNilaiBarang += $barangData['HARGA_JUAL'];
                            }
                        } else {
                            // Tambahkan barang baru
                            $kodeProduk = BarangTitipan::generateKodeProduk($barangData['NAMA']);
                            $tanggalKadaluarsa = Carbon::parse($transaksiPenitipan->TANGGAL_PENITIPAN)->addDays(30)->toDateTimeString();
                            $barangTitipan = BarangTitipan::create([
                                'KODE_PRODUK' => $kodeProduk,
                                'ID_SUBKATEGORI' => $barangData['ID_SUBKATEGORI'],
                                'ID_PENITIPAN' => $transaksiPenitipan->ID_PENITIPAN,
                                'NAMA' => $barangData['NAMA'],
                                'HARGA_JUAL' => $barangData['HARGA_JUAL'],
                                'BERAT' => $barangData['BERAT'],
                                'TANGGAL_KADALUARSA' => $tanggalKadaluarsa,
                                'STATUS' => 'Tersedia',
                                'KONDISI' => $barangData['KONDISI'],
                                'TANGGAL_GARANSI' => $tanggalGaransi,
                                'DESKRIPSI' => $barangData['DESKRIPSI'],
                            ]);
                            $barangTitipanIds[] = $kodeProduk;
                            $totalNilaiBarang += $barangData['HARGA_JUAL'];
                        }

                        // Handle foto
                        if (isset($barangData['FOTOS']) && !empty($barangData['FOTOS'])) {
                            $existingPhotos = FotoProduk::where('KODE_PRODUK', $barangTitipan->KODE_PRODUK)->get();
                            foreach ($existingPhotos as $photo) {
                                Storage::disk('public')->delete($photo->URL_FOTO);
                                $photo->delete();
                            }
                            $isUtamaIndex = $barangData['IS_UTAMA_INDEX'] ?? 0;
                            foreach ($barangData['FOTOS'] as $index => $foto) {
                                if ($foto) {
                                    $path = $foto->store('produk', 'public');
                                    FotoProduk::create([
                                        'KODE_PRODUK' => $barangTitipan->KODE_PRODUK,
                                        'URL_FOTO' => $path,
                                        'IS_UTAMA' => $index == $isUtamaIndex,
                                    ]);
                                }
                            }
                        }
                    }

                    // Hapus barang yang tidak ada di request
                    BarangTitipan::where('ID_PENITIPAN', $id)
                        ->whereNotIn('KODE_PRODUK', $barangTitipanIds)
                        ->delete();

                    $transaksiPenitipan->TOTAL_NILAI_BARANG = $totalNilaiBarang;
                }

                \Log::info("Before save: ", $transaksiPenitipan->toArray());

                $transaksiPenitipan->save();

                \Log::info("After save: ", $transaksiPenitipan->fresh()->toArray());

                return response()->json([
                    'success' => true,
                    'data' => $transaksiPenitipan->fresh()->load('barangTitipan.fotoProduk'),
                    'message' => 'Transaksi berhasil diperbarui'
                ], 200);
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error("Validation error in update transaksi: " . json_encode($e->errors()));
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error("General exception in update transaksi: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan server: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            if (!Auth::guard('pegawai')->check()) {
                return response()->json(['message' => 'Tidak terautentikasi'], 401);
            }
            
            $transaksiPenitipan = TransaksiPenitipan::findOrFail($id);
            $transaksiPenitipan->delete();
            return response()->json(null, 204);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Transaksi tidak ditemukan'], 404);
        } catch (QueryException $e) {
            return response()->json(['message' => 'Gagal menghapus transaksi: ' . $e->getMessage()], 500);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Terjadi kesalahan server: ' . $e->getMessage()], 500);
        }
    }

    public function indexBarangTitipanForHunter(Request $request)
    {
        try {
            if (!Auth::guard('pegawai')->check()) {
                Log::error("Unauthorized access to hunter consigned items");
                return response()->json(['error' => 'Unauthorized'], 401);
            }
            $hunterId = Auth::guard('pegawai')->user()->ID_PEGAWAI;

            $search = $request->input('search');
            $status = $request->input('status');

            $query = BarangTitipan::select(
                'barangtitipans.KODE_PRODUK',
                'barangtitipans.NAMA as product_name',
                'penitips.NAMA as penitip_name',
                'barangtitipans.STATUS as status',
                'foto_produk.URL_FOTO as product_image',
                'transaksipenitipans.TANGGAL_PENITIPAN as consignment_date'
            )
            ->leftJoin('transaksipenitipans', 'barangtitipans.ID_PENITIPAN', '=', 'transaksipenitipans.ID_PENITIPAN')
            ->leftJoin('penitips', 'transaksipenitipans.ID_PENITIP', '=', 'penitips.ID_PENITIP')
            ->leftJoin('foto_produk', function ($join) {
                $join->on('barangtitipans.KODE_PRODUK', '=', 'foto_produk.KODE_PRODUK')
                     ->where('foto_produk.IS_UTAMA', true);
            })
            ->where('transaksipenitipans.ID_PEGAWAI_HUNTER', $hunterId);

            // Apply search filter
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('barangtitipans.NAMA', 'LIKE', "%{$search}%")
                      ->orWhere('penitips.NAMA', 'LIKE', "%{$search}%")
                      ->orWhere('barangtitipans.KODE_PRODUK', 'LIKE', "%{$search}%");
                });
            }

            // Apply status filter
            if ($status && $status !== 'All') {
                $query->where('barangtitipans.STATUS', $status);
            }

            $barangTitipan = $query->get()->map(function ($item) {
                $item->product_image = $item->product_image
                    ? url("/products/{$item->KODE_PRODUK}/thumbnail")
                    : '/api/placeholder/60/60';
                return $item;
            });

            Log::info("Fetched consigned items for hunter ID: {$hunterId}", ['count' => $barangTitipan->count()]);

            return response()->json([
                'success' => true,
                'data' => $barangTitipan
            ], 200);
        } catch (\Exception $e) {
            Log::error("Error fetching consigned items for hunter: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch consigned items: ' . $e->getMessage()
            ], 500);
        }
    }
}