<?php

namespace App\Http\Controllers;

use App\Models\TransaksiPenitipan;
use App\Models\BarangTitipan;
use App\Models\Donasi;
use App\Models\Subkategori;
use App\Models\FotoProduk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class BarangTitipanController extends Controller
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
                Log::info("Mapping transaksi ID: {$transaksi->ID_PENITIPAN}, ALAMAT: " . ($transaksi->penitip->ALAMAT ?? '-'));
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
                'ID_PENITIPAN' => 'required|integer|exists:transaksipenitipans,ID_PENITIPAN',
                'ID_SUBKATEGORI' => 'nullable|integer|exists:subkategoris,ID_SUBKATEGORI',
                'NAMA' => 'required|string|max:50',
                'NAMA_SUBKATEGORI' => 'required|string|max:50',
                'HARGA_JUAL' => 'required|integer',
                'BERAT' => 'required|numeric',
                'KONDISI' => 'required|string|max:20',
                'TANGGAL_GARANSI' => 'nullable|date',
                'DESKRIPSI' => 'required|string',
                'FOTOS.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'IS_UTAMA_INDEX' => 'required|integer|between:0,2',
            ]);

            return DB::transaction(function () use ($request) {
                $kodeProduk = BarangTitipan::generateKodeProduk($request->NAMA);
                $idSubkategori = $request->ID_SUBKATEGORI;
                if (!$idSubkategori) {
                    $subkategori = Subkategori::firstOrCreate(
                        ['NAMASUB' => $request->NAMA_SUBKATEGORI],
                        ['ID_KATEGORI' => 1]
                    );
                    $idSubkategori = $subkategori->ID_SUBKATEGORI;
                }

                $penitipan = TransaksiPenitipan::findOrFail($request->ID_PENITIPAN);
                $tanggalKadaluarsa = Carbon::parse($penitipan->TANGGAL_PENITIPAN)
                    ->addDays(30)
                    ->toDateTimeString();

                $barangTitipan = BarangTitipan::create([
                    'KODE_PRODUK' => $kodeProduk,
                    'ID_SUBKATEGORI' => $idSubkategori,
                    'ID_PENITIPAN' => $request->ID_PENITIPAN,
                    'ID_PENJUALAN' => null,
                    'NAMA' => $request->NAMA,
                    'HARGA_JUAL' => $request->HARGA_JUAL,
                    'BERAT' => $request->BERAT,
                    'TANGGAL_KADALUARSA' => $tanggalKadaluarsa,
                    'TANGGAL_PERPANJANGAN' => null,
                    'STATUS' => 'Tersedia',
                    'TERJUAL_CEPAT' => null,
                    'KONDISI' => $request->KONDISI,
                    'TANGGAL_GARANSI' => $request->TANGGAL_GARANSI ?? null,
                    'rating' => null,
                    'DESKRIPSI' => $request->DESKRIPSI,
                ]);

                $fotos = $request->file('FOTOS') ?? [];
                $isUtamaIndex = $request->IS_UTAMA_INDEX;
                $uploadedCount = 0;

                foreach ($fotos as $index => $foto) {
                    if ($foto && $uploadedCount < 3) {
                        $path = $foto->store('produk', 'public');
                        FotoProduk::create([
                            'KODE_PRODUK' => $kodeProduk,
                            'URL_FOTO' => $path,
                            'IS_UTAMA' => $index == $isUtamaIndex ? true : false,
                        ]);
                        $uploadedCount++;
                    }
                }

                if ($uploadedCount === 0) {
                    throw new \Exception("At least one photo is required.");
                }

                $penitipan->TOTAL_NILAI_BARANG = ($penitipan->TOTAL_NILAI_BARANG ?? 0) + $request->HARGA_JUAL;
                $penitipan->save();

                return response()->json([
                    'success' => true,
                    'data' => $barangTitipan
                ], 201);
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validasi gagal', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error("Failed to create barang titipan: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create barang titipan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($kode_produk)
    {
        try {
            $barangTitipan = BarangTitipan::findOrFail($kode_produk);
            return response()->json([
                'success' => true,
                'data' => $barangTitipan
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Barang titipan not found'
            ], 404);
        }
    }

    public function update(Request $request, $kode_produk)
    {
        try {
            $request->validate([
                'ID_PENITIPAN' => 'sometimes|integer|exists:transaksipenitipans,ID_PENITIPAN',
                'ID_SUBKATEGORI' => 'nullable|integer|exists:subkategoris,ID_SUBKATEGORI',
                'NAMA' => 'sometimes|string|max:50',
                'NAMA_SUBKATEGORI' => 'sometimes|string|max:50',
                'HARGA_JUAL' => 'sometimes|integer',
                'BERAT' => 'sometimes|numeric',
                'KONDISI' => 'sometimes|string|max:20',
                'STATUS' => 'sometimes|string',
                'TANGGAL_GARANSI' => 'nullable|date',
                'TANGGAL_KONFIRMASI' => 'nullable|date_format:Y-m-d H:i:s',
                'DESKRIPSI' => 'sometimes|string',
                'FOTOS.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'IS_UTAMA_INDEX' => 'sometimes|integer|between:0,2',
            ]);

            return DB::transaction(function () use ($request, $kode_produk) {
                $barangTitipan = BarangTitipan::where('KODE_PRODUK', $kode_produk)->firstOrFail();
                $oldHargaJual = $barangTitipan->HARGA_JUAL;
                $oldPenitipanId = $barangTitipan->ID_PENITIPAN;
                $oldStatus = $barangTitipan->STATUS;

                $idSubkategori = $request->ID_SUBKATEGORI;
                if ($request->has('NAMA_SUBKATEGORI') && !$idSubkategori) {
                    $subkategori = Subkategori::firstOrCreate(
                        ['NAMASUB' => $request->NAMA_SUBKATEGORI],
                        ['ID_KATEGORI' => 1]
                    );
                    $idSubkategori = $subkategori->ID_SUBKATEGORI;
                }

                $subkategori = Subkategori::where('ID_SUBKATEGORI', $idSubkategori ?? $barangTitipan->ID_SUBKATEGORI)
                    ->with('kategori')
                    ->first();
                $isElektronik = $subkategori && $subkategori->kategori && $subkategori->kategori->NAMA === 'Elektronik & Gadget';
                
                $tanggalGaransi = $isElektronik ? ($request->TANGGAL_GARANSI ?? $barangTitipan->TANGGAL_GARANSI) : null;

                $updateData = [
                    'ID_SUBKATEGORI' => $idSubkategori ?? $barangTitipan->ID_SUBKATEGORI,
                    'ID_PENITIPAN' => $request->ID_PENITIPAN ?? $barangTitipan->ID_PENITIPAN,
                    'NAMA' => $request->NAMA ?? $barangTitipan->NAMA,
                    'HARGA_JUAL' => $request->HARGA_JUAL ?? $barangTitipan->HARGA_JUAL,
                    'BERAT' => $request->BERAT ?? $barangTitipan->BERAT,
                    'TANGGAL_KADALUARSA' => $barangTitipan->TANGGAL_KADALUARSA,
                    'KONDISI' => $request->KONDISI ?? $barangTitipan->KONDISI,
                    'STATUS' => $request->STATUS ?? $barangTitipan->STATUS,
                    'TANGGAL_GARANSI' => $tanggalGaransi,
                    'TANGGAL_KONFIRMASI' => $request->has('TANGGAL_KONFIRMASI') ? $request->TANGGAL_KONFIRMASI : $barangTitipan->TANGGAL_KONFIRMASI,
                    'DESKRIPSI' => $request->DESKRIPSI ?? $barangTitipan->DESKRIPSI,
                ];

                if ($request->has('ID_PENITIPAN') && $request->ID_PENITIPAN != $oldPenitipanId) {
                    $penitipan = TransaksiPenitipan::findOrFail($request->ID_PENITIPAN);
                    $updateData['TANGGAL_KADALUARSA'] = Carbon::parse($penitipan->TANGGAL_PENITIPAN)
                        ->addDays(30)
                        ->toDateTimeString();
                }

                $barangTitipan->update($updateData);

                $fotos = $request->file('FOTOS') ?? [];
                if (!empty($fotos)) {
                    $isUtamaIndex = $request->IS_UTAMA_INDEX ?? 0;
                    $uploadedCount = 0;

                    FotoProduk::where('KODE_PRODUK', $kode_produk)->delete();

                    foreach ($fotos as $index => $foto) {
                        if ($foto && $uploadedCount < 3) {
                            $path = $foto->store('produk', 'public');
                            FotoProduk::create([
                                'KODE_PRODUK' => $kode_produk,
                                'URL_FOTO' => $path,
                                'IS_UTAMA' => $index == $isUtamaIndex ? true : null,
                            ]);
                            $uploadedCount++;
                        }
                    }
                }

                $penitipan = TransaksiPenitipan::findOrFail($updateData['ID_PENITIPAN']);
                if ($oldPenitipanId === $updateData['ID_PENITIPAN']) {
                    $penitipan->TOTAL_NILAI_BARANG = ($penitipan->TOTAL_NILAI_BARANG ?? 0) - $oldHargaJual + $updateData['HARGA_JUAL'];
                } else {
                    $oldPenitipan = TransaksiPenitipan::find($oldPenitipanId);
                    if ($oldPenitipan) {
                        $oldPenitipan->TOTAL_NILAI_BARANG = ($oldPenitipan->TOTAL_NILAI_BARANG ?? 0) - $oldHargaJual;
                        $oldPenitipan->save();
                    }
                    $penitipan->TOTAL_NILAI_BARANG = ($penitipan->TOTAL_NILAI_BARANG ?? 0) + $updateData['HARGA_JUAL'];
                }
                $penitipan->save();

                if ($updateData['STATUS'] === 'Didonasikan' && $oldStatus !== 'Didonasikan') {
                    $penitip = \App\Models\Penitip::findOrFail($penitipan->ID_PENITIP);
                    $points = ceil($updateData['HARGA_JUAL'] / 10000);
                    $penitip->POIN_LOYALITAS = ($penitip->POIN_LOYALITAS ?? 0) + $points;
                    $penitip->save();
                    Log::info("Poin loyalitas updated for penitip {$penitip->ID_PENITIP}: +{$points} points");
                }

                return response()->json([
                    'success' => true,
                    'data' => $barangTitipan
                ], 200);
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validasi gagal', 'errors' => $e->errors()], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Barang titipan not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error("Failed to update barang titipan: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update barang titipan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($kode_produk)
    {
        try {
            return DB::transaction(function () use ($kode_produk) {
                $barangTitipan = BarangTitipan::findOrFail($kode_produk);
                $penitipan = TransaksiPenitipan::findOrFail($barangTitipan->ID_PENITIPAN);
                $penitipan->TOTAL_NILAI_BARANG = ($penitipan->TOTAL_NILAI_BARANG ?? 0) - $barangTitipan->HARGA_JUAL;
                $penitipan->save();

                FotoProduk::where('KODE_PRODUK', $kode_produk)->delete();
                $barangTitipan->delete();

                return response()->json([
                    'success' => true,
                    'message' => 'Barang titipan deleted successfully'
                ], 204);
            });
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Barang titipan not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error("Failed to delete barang titipan: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete barang titipan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function indexForGudang(Request $request)
    {
        try {
            Log::info("Fetching barang titipan for gudang role");
            $barangTitipan = BarangTitipan::leftJoin('subkategoris', 'barangtitipans.ID_SUBKATEGORI', '=', 'subkategoris.ID_SUBKATEGORI')
                ->leftJoin('transaksipenitipans', 'barangtitipans.ID_PENITIPAN', '=', 'transaksipenitipans.ID_PENITIPAN')
                ->leftJoin('penitips', 'transaksipenitipans.ID_PENITIP', '=', 'penitips.ID_PENITIP')
                ->leftJoin('transaksipenjualans', 'barangtitipans.ID_PENJUALAN', '=', 'transaksipenjualans.ID_PENJUALAN')
                ->leftJoin('foto_produk', function ($join) {
                    $join->on('barangtitipans.KODE_PRODUK', '=', 'foto_produk.KODE_PRODUK')
                         ->where('foto_produk.IS_UTAMA', true);
                })
                ->select(
                    'barangtitipans.KODE_PRODUK as kode_barang',
                    'barangtitipans.ID_PENITIPAN as id_penitipan',
                    'transaksipenitipans.NO_NOTA_PENITIPAN as no_nota_penitipan',
                    'penitips.NAMA as nama_penitip',
                    'penitips.ALAMAT as alamat_penitip',
                    'barangtitipans.NAMA as nama',
                    'subkategoris.NAMASUB as nama_subkategori',
                    'barangtitipans.HARGA_JUAL as harga_jual',
                    'barangtitipans.BERAT as berat',
                    'barangtitipans.TANGGAL_KADALUARSA as tanggal_kadaluarsa',
                    'barangtitipans.TANGGAL_PERPANJANGAN as tanggal_perpanjangan',
                    'barangtitipans.TANGGAL_KONFIRMASI as tanggal_konfirmasi',
                    'barangtitipans.STATUS as status_barang',
                    'barangtitipans.KONDISI as kondisi',
                    'barangtitipans.TANGGAL_GARANSI as tanggal_garansi',
                    'barangtitipans.DESKRIPSI as deskripsi',
                    'foto_produk.URL_FOTO as foto_produk'
                )
                ->get()
                ->map(function ($item) {
                    Log::info("Processing item with ID_PENITIPAN: {$item->id_penitipan}");
                    return [
                        'kode_barang' => $item->kode_barang ?? '-',
                        'id_penitipan' => $item->id_penitipan ?? 0,
                        'no_nota_penitipan' => $item->no_nota_penitipan ?? '-',
                        'nama_penitip' => $item->nama_penitip ?? '-',
                        'alamat_penitip' => $item->alamat_penitip ?? '-',
                        'nama' => $item->nama ?? '-',
                        'nama_subkategori' => $item->nama_subkategori ?? '-',
                        'harga_jual' => $item->harga_jual ? 'Rp' . number_format($item->harga_jual, 0, ',', '.') : '-',
                        'berat' => $item->berat ?? '-',
                        'tanggal_kadaluarsa' => $item->tanggal_kadaluarsa ?? '-',
                        'tanggal_perpanjangan' => $item->tanggal_perpanjangan ?? '-',
                        'tanggal_konfirmasi' => $item->tanggal_konfirmasi ?? '-',
                        'status_barang' => $item->status_barang ?? '-',
                        'kondisi' => $item->kondisi ?? '-',
                        'tanggal_garansi' => $item->tanggal_garansi ?? '-',
                        'deskripsi' => $item->deskripsi ?? '-',
                        'foto_produk' => $item->foto_produk ? "/storage/{$item->foto_produk}" : '/api/placeholder/60/60'
                    ];
                });
            Log::info("Barang titipan fetched for gudang: " . json_encode($barangTitipan));
            return response()->json([
                'success' => true,
                'data' => $barangTitipan
            ], 200);
        } catch (\Exception $e) {
            Log::error("Failed to fetch barang titipan for gudang: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch barang titipan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getItemsForDonation()
    {
        try {
            // Hanya barang yang belum dipasangkan ke request donasi yang boleh tampil.
            // Status 'Telah Didonasikan' berarti proses donasi sudah selesai.
            $items = BarangTitipan::whereIn('STATUS', ['Didonasikan', 'Hangus', 'Kadaluarsa'])
                ->whereNotIn('KODE_PRODUK', Donasi::select('KODE_PRODUK'))
                ->get();
            $items = $items->map(function ($item) {
                $itemArray = $item->toArray();
                $itemArray['KODE_PRODUK'] = (string)$itemArray['KODE_PRODUK'];
                return $itemArray;
            });
            return response()->json([
                'success' => true,
                'data' => $items
            ], 200);
        } catch (\Exception $e) {
            Log::error("Failed to fetch items for donation: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch items for donation'
            ], 500);
        }
    }

    public function updateStatus(Request $request, $kode_produk)
    {
        $request->validate([
            'STATUS' => 'required|string|in:Tersedia,Didonasikan,Hangus,Kadaluarsa,Telah Didonasikan'
        ]);

        try {
            $barang = BarangTitipan::findOrFail($kode_produk);
            $barang->update(['STATUS' => $request->STATUS]);
            return response()->json([
                'success' => true,
                'message' => 'Status barang berhasil diupdate',
                'data' => $barang
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Barang titipan not found'
            ], 404);
        }
    }

    public function getProducts(Request $request)
    {
        try {
            $products = BarangTitipan::whereIn('STATUS', ['Tersedia'])
                ->leftJoin('subkategoris', 'barangtitipans.ID_SUBKATEGORI', '=', 'subkategoris.ID_SUBKATEGORI')
                ->leftJoin('foto_produk', function ($join) {
                    $join->on('barangtitipans.KODE_PRODUK', '=', 'foto_produk.KODE_PRODUK')
                         ->where('foto_produk.IS_UTAMA', true);
                })
                ->select(
                    'barangtitipans.KODE_PRODUK as id',
                    'barangtitipans.NAMA as name',
                    'subkategoris.NAMASUB as subcategory',
                    'barangtitipans.HARGA_JUAL as price',
                    'barangtitipans.rating',
                    'foto_produk.URL_FOTO as image'
                )
                // Dipakai layar detail produk mobile untuk menampilkan produk lain.
                ->when($request->filled('exclude'), function ($query) use ($request) {
                    $query->where('barangtitipans.KODE_PRODUK', '!=', $request->input('exclude'));
                })
                ->get()
                ->map(function ($product) {
                    $product->image = $product->image ? asset('storage/' . $product->image) : '/api/placeholder/60/60';
                    return $product;
                });

            Log::info("Fetched products: " . json_encode($products));

            return response()->json([
                'success' => true,
                'data' => $products
            ], 200);
        } catch (\Exception $e) {
            Log::error("Failed to fetch products: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch products: ' . $e->getMessage()
            ], 500);
        }
    }

    /* Modify getProductsMobile method in BarangTitipanController.php */
public function getProductsMobile(Request $request)
{
    try {
        $query = BarangTitipan::whereIn('STATUS', ['Tersedia'])
            ->leftJoin('subkategoris', 'barangtitipans.ID_SUBKATEGORI', '=', 'subkategoris.ID_SUBKATEGORI')
            ->leftJoin('kategoris', 'subkategoris.ID_KATEGORI', '=', 'kategoris.ID_KATEGORI')
            ->leftJoin('foto_produk', function ($join) {
                $join->on('barangtitipans.KODE_PRODUK', '=', 'foto_produk.KODE_PRODUK')
                     ->where('foto_produk.IS_UTAMA', true);
            })
            ->select(
                'barangtitipans.KODE_PRODUK as id',
                'barangtitipans.NAMA as name',
                'subkategoris.NAMASUB as subcategory',
                'kategoris.NAMA as category',
                'barangtitipans.HARGA_JUAL as price',
                'barangtitipans.rating',
                'foto_produk.URL_FOTO as image'
            );

        if ($request->has('subcategories')) {
            $filters = $request->input('subcategories');
            if (is_array($filters) && !empty($filters)) {
                $query->where(function ($q) use ($filters) {
                    foreach ($filters as $filter) {
                        [$category, $subcategory] = explode(':', $filter, 2);
                        $q->orWhere(function ($q2) use ($category, $subcategory) {
                            $q2->where('kategoris.NAMA', $category)
                               ->where('subkategoris.NAMASUB', $subcategory);
                        });
                    }
                });
            }
        }

        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where('barangtitipans.NAMA', 'LIKE', "%{$search}%");
        }

        $products = $query->get()->map(function ($product) {
            $product->image = $product->image ? url("/products/{$product->id}/thumbnail") : '/api/placeholder/60/60';
            return $product;
        });

        Log::info("Fetched products with filters: " . json_encode([
            'subcategories' => $request->input('subcategories'),
            'search' => $request->input('search'),
            'results_count' => $products->count()
        ]));

        return response()->json([
            'success' => true,
            'data' => $products
        ], 200);
    } catch (\Exception $e) {
        Log::error("Failed to fetch products: " . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Failed to fetch products: ' . $e->getMessage()
        ], 500);
    }
}

    public function getProductById($kode_produk)
    {
        try {
            $product = BarangTitipan::where('barangtitipans.KODE_PRODUK', $kode_produk)
                ->leftJoin('subkategoris', 'barangtitipans.ID_SUBKATEGORI', '=', 'subkategoris.ID_SUBKATEGORI')
                ->leftJoin('kategoris', 'subkategoris.ID_KATEGORI', '=', 'kategoris.ID_KATEGORI')
                ->select(
                    'barangtitipans.KODE_PRODUK as id',
                    'barangtitipans.NAMA as name',
                    'barangtitipans.HARGA_JUAL as price',
                    'barangtitipans.BERAT as weight',
                    'barangtitipans.KONDISI as condition',
                    'barangtitipans.TANGGAL_GARANSI as warranty_date',
                    'barangtitipans.DESKRIPSI as description',
                    'barangtitipans.rating',
                    'subkategoris.NAMASUB as subcategory',
                    'kategoris.NAMA as category',
                    'barangtitipans.TANGGAL_KADALUARSA as expiry_date',
                    'barangtitipans.STATUS as status',
                    'barangtitipans.TANGGAL_PERPANJANGAN as extension_date',
                    'barangtitipans.ID_PENITIPAN'
                )
                ->firstOrFail();

            $photos = FotoProduk::where('KODE_PRODUK', $kode_produk)
                ->select('URL_FOTO', 'IS_UTAMA')
                ->get()
                ->map(function ($photo) {
                    return [
                        'url' => asset('storage/' . $photo->URL_FOTO),
                        'is_utama' => $photo->IS_UTAMA,
                    ];
                });
            $product->photos = $photos;

            $penitipData = null;
            if ($product->ID_PENITIPAN) {
                Log::info("Fetching penitip data for ID_PENITIPAN: {$product->ID_PENITIPAN}");
                $penitipData = DB::table('transaksipenitipans')
                    ->leftJoin('penitips', 'transaksipenitipans.ID_PENITIP', '=', 'penitips.ID_PENITIP')
                    ->where('transaksipenitipans.ID_PENITIPAN', $product->ID_PENITIPAN)
                    ->select(
                        'penitips.NAMA as name',
                        'penitips.RATING as rating',
                        'penitips.JLH_PENJUALAN as sales_count',
                        'penitips.BADGE as badge'
                    )
                    ->first();
                if (!$penitipData) {
                    Log::warning("No penitip data found for ID_PENITIPAN: {$product->ID_PENITIPAN}");
                } else {
                    Log::info("Penitip data found: " . json_encode($penitipData));
                }
            } else {
                Log::warning("No ID_PENITIPAN found for product: {$kode_produk}");
            }

            $product->penitip_name = $penitipData ? $penitipData->name : null;
            $product->penitip_rating = $penitipData ? $penitipData->rating : null;
            $product->penitip_sales_count = $penitipData ? ($penitipData->sales_count ?? 0) : 0;
            $product->penitip_badge = $penitipData ? ($penitipData->badge ?? 0) : 0;

            unset($product->ID_PENITIPAN);

            Log::info("Fetched product with penitip data: " . json_encode($product));

            return response()->json([
                'success' => true,
                'data' => $product
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error("Product not found for KODE_PRODUK: {$kode_produk}");
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error("Failed to fetch product: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch product: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getProductByIdMobile($kode_produk)
    {
        try {
            $product = BarangTitipan::where('barangtitipans.KODE_PRODUK', $kode_produk)
                ->leftJoin('subkategoris', 'barangtitipans.ID_SUBKATEGORI', '=', 'subkategoris.ID_SUBKATEGORI')
                ->leftJoin('kategoris', 'subkategoris.ID_KATEGORI', '=', 'kategoris.ID_KATEGORI')
                ->leftJoin('transaksipenitipans', 'barangtitipans.ID_PENITIPAN', '=', 'transaksipenitipans.ID_PENITIPAN')
                ->leftJoin('penitips', 'transaksipenitipans.ID_PENITIP', '=', 'penitips.ID_PENITIP')
                ->select(
                    'barangtitipans.KODE_PRODUK as id',
                    'barangtitipans.NAMA as name',
                    'barangtitipans.HARGA_JUAL as price',
                    'barangtitipans.BERAT as weight',
                    'barangtitipans.KONDISI as condition',
                    'barangtitipans.TANGGAL_GARANSI as warranty_date',
                    'barangtitipans.DESKRIPSI as description',
                    'barangtitipans.rating',
                    'subkategoris.NAMASUB as subcategory',
                    'kategoris.NAMA as category',
                    'barangtitipans.TANGGAL_KADALUARSA as expiry_date',
                    'barangtitipans.STATUS as status',
                    'barangtitipans.TANGGAL_PERPANJANGAN as extension_date',
                    'barangtitipans.ID_PENITIPAN',
                    'penitips.NAMA as penitip_name',
                    'penitips.RATING as penitip_rating',
                    'penitips.JLH_PENJUALAN as penitip_sales_count',
                    'penitips.BADGE as penitip_badge',
                    'transaksipenitipans.TANGGAL_PENITIPAN as penitip_tanggal_penitipan'
                )
                ->firstOrFail();

            $photos = FotoProduk::where('KODE_PRODUK', $kode_produk)
                ->select('ID_FOTO', 'URL_FOTO', 'IS_UTAMA')
                ->get()
                ->map(function ($photo) use ($kode_produk) {
                    return [
                        'id' => $photo->ID_FOTO,
                        'url' => $photo->IS_UTAMA ? url("/products/{$kode_produk}/thumbnail") : asset('storage/' . $photo->URL_FOTO),
                        'is_utama' => $photo->IS_UTAMA,
                    ];
                });

            $productArray = $product->toArray();
            $productArray['photos'] = $photos;

            unset($productArray['ID_PENITIPAN']);

            Log::info("Fetched product with penitip data: " . json_encode($productArray));

            return response()->json([
                'success' => true,
                'data' => $productArray
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error("Product not found for KODE_PRODUK: {$kode_produk}");
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error("Failed to fetch product: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch product: ' . $e->getMessage()
            ], 500);
        }
    }

    /* Modify getItemsByPenitip method in BarangTitipanController.php */
public function getItemsByPenitip(Request $request)
{
    try {
        $penitipId = auth('penitip')->user()->ID_PENITIP;
        Log::info("Fetching barang titipan for penitip ID: {$penitipId}");

        $perPage = $request->query('per_page', 10);
        $page = $request->query('page', 1);
        $search = $request->query('search', '');

        $query = BarangTitipan::whereHas('penitipan', function ($query) use ($penitipId) {
            $query->where('ID_PENITIP', $penitipId);
        })
        ->leftJoin('subkategoris', 'barangtitipans.ID_SUBKATEGORI', '=', 'subkategoris.ID_SUBKATEGORI')
        ->leftJoin('kategoris', 'subkategoris.ID_KATEGORI', '=', 'kategoris.ID_KATEGORI')
        ->leftJoin('transaksipenitipans', 'barangtitipans.ID_PENITIPAN', '=', 'transaksipenitipans.ID_PENITIPAN')
        ->leftJoin('foto_produk', function ($join) {
            $join->on('barangtitipans.KODE_PRODUK', '=', 'foto_produk.KODE_PRODUK')
                 ->where('foto_produk.IS_UTAMA', true);
        })
        ->select(
            'barangtitipans.KODE_PRODUK as kode_produk',
            'barangtitipans.NAMA as nama',
            'subkategoris.NAMASUB as nama_subkategori',
            'kategoris.NAMA as nama_kategori',
            'barangtitipans.HARGA_JUAL as harga_jual',
            'barangtitipans.BERAT as berat',
            'barangtitipans.TANGGAL_KADALUARSA as tanggal_kadaluarsa',
            'barangtitipans.TANGGAL_PERPANJANGAN as tanggal_perpanjangan',
            'barangtitipans.STATUS as status',
            'barangtitipans.TERJUAL_CEPAT as terjual_cepat',
            'barangtitipans.KONDISI as kondisi',
            'barangtitipans.TANGGAL_GARANSI as tanggal_garansi',
            'barangtitipans.TANGGAL_KONFIRMASI as tanggal_konfirmasi',
            'barangtitipans.rating',
            'barangtitipans.DESKRIPSI as deskripsi',
            'foto_produk.URL_FOTO as foto_produk',
            'transaksipenitipans.NO_NOTA_PENITIPAN as no_nota_penitipan',
            'transaksipenitipans.TANGGAL_PENITIPAN as tanggal_penitipan'
        );

        if (!empty($search)) {
            $query->where('barangtitipans.NAMA', 'LIKE', "%{$search}%");
        }

        $total = $query->count();
        $barangTitipan = $query->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get()
            ->map(function ($item) {
                return [
                    'kode_produk' => $item->kode_produk,
                    'nama' => $item->nama ?? '-',
                    'nama_subkategori' => $item->nama_subkategori ?? '-',
                    'nama_kategori' => $item->nama_kategori ?? '-',
                    'harga_jual' => $item->harga_jual ?? 0,
                    'berat' => $item->berat ?? '-',
                    'tanggal_kadaluarsa' => $item->tanggal_kadaluarsa ? Carbon::parse($item->tanggal_kadaluarsa)->format('Y-m-d H:i:s') : '-',
                    'tanggal_perpanjangan' => $item->tanggal_perpanjangan ? Carbon::parse($item->tanggal_perpanjangan)->format('Y-m-d H:i:s') : '-',
                    'status' => $item->status ?? '-',
                    'terjual_cepat' => $item->terjual_cepat ? 'Ya' : 'Tidak',
                    'kondisi' => $item->kondisi ?? '-',
                    'tanggal_garansi' => $item->tanggal_garansi ? Carbon::parse($item->tanggal_garansi)->format('Y-m-d H:i:s') : '-',
                    'tanggal_konfirmasi' => $item->tanggal_konfirmasi ? Carbon::parse($item->tanggal_konfirmasi)->format('Y-m-d H:i:s') : '-',
                    'rating' => $item->rating ?? '-',
                    'deskripsi' => $item->deskripsi ?? '-',
                    'foto_produk' => $item->foto_produk ? url("/products/{$item->kode_produk}/thumbnail") : '/api/placeholder/60/60',
                    'no_nota_penitipan' => $item->no_nota_penitipan ?? '-',
                    'tanggal_penitipan' => $item->tanggal_penitipan ? Carbon::parse($item->tanggal_penitipan)->format('Y-m-d H:i:s') : '-'
                ];
            });

        Log::info("Barang titipan fetched for penitip: " . json_encode([
            'penitip_id' => $penitipId,
            'search' => $search,
            'results_count' => $barangTitipan->count()
        ]));

        return response()->json([
            'success' => true,
            'data' => $barangTitipan,
            'meta' => [
                'total' => $total,
                'per_page' => $perPage,
                'current_page' => $page,
                'last_page' => ceil($total / $perPage)
            ]
        ], 200);
    } catch (\Exception $e) {
        Log::error("Failed to fetch barang titipan for penitip: " . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Failed to fetch barang titipan: ' . $e->getMessage()
        ], 500);
    }
}

    public function extendConsignment($kode_produk)
    {
        try {
            return DB::transaction(function () use ($kode_produk) {
                $penitip = auth('penitip')->user();
                if (!$penitip) {
                    Log::error("Unauthorized access attempt to extend consignment for KODE_PRODUK: {$kode_produk}");
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized: You must be logged in as a penitip'
                    ], 401);
                }

                $penitipId = $penitip->ID_PENITIP;
                Log::info("Attempting to extend consignment for KODE_PRODUK: {$kode_produk} by penitip ID: {$penitipId}");

                $barangTitipan = BarangTitipan::where('KODE_PRODUK', $kode_produk)
                    ->whereHas('penitipan', function ($query) use ($penitipId) {
                        $query->where('ID_PENITIP', $penitipId);
                    })
                    ->first();

                if (!$barangTitipan) {
                    Log::error("Barang titipan not found for KODE_PRODUK: {$kode_produk} or not owned by penitip ID: {$penitipId}");
                    return response()->json([
                        'success' => false,
                        'message' => 'Barang titipan not found or you do not have permission to extend this item'
                    ], 404);
                }

                Log::info("Found barang titipan: ", $barangTitipan->toArray());

                if ($barangTitipan->STATUS !== 'Kadaluarsa') {
                    Log::warning("Item status is not 'Kadaluarsa', current status: {$barangTitipan->STATUS}");
                    return response()->json([
                        'success' => false,
                        'message' => 'Hanya barang dengan status Kadaluarsa yang dapat diperpanjang'
                    ], 400);
                }

                if ($barangTitipan->TANGGAL_PERPANJANGAN) {
                    Log::warning("Item already extended on: {$barangTitipan->TANGGAL_PERPANJANGAN}");
                    return response()->json([
                        'success' => false,
                        'message' => 'Barang ini sudah diperpanjang sebelumnya'
                    ], 400);
                }

                $tanggalPerpanjangan = Carbon::now()->toDateTimeString();
                $tanggalKadaluarsa = Carbon::parse($barangTitipan->TANGGAL_KADALUARSA)
                    ->addDays(30)
                    ->toDateTimeString();

                Log::info("Updating item with new dates - PERPANJANGAN: {$tanggalPerpanjangan}, KADALUARSA: {$tanggalKadaluarsa}");

                $updated = $barangTitipan->update([
                    'TANGGAL_PERPANJANGAN' => $tanggalPerpanjangan,
                    'TANGGAL_KADALUARSA' => $tanggalKadaluarsa,
                    'STATUS' => 'Tersedia',
                ]);

                if (!$updated) {
                    Log::error("Failed to update barang titipan in database");
                    throw new \Exception("Failed to update barang titipan in database");
                }

                $barangTitipan->refresh();

                Log::info("Successfully extended consignment for KODE_PRODUK: {$kode_produk} by penitip ID: {$penitipId}");

                return response()->json([
                    'success' => true,
                    'data' => [
                        'kode_produk' => $barangTitipan->KODE_PRODUK,
                        'tanggal_perpanjangan' => $barangTitipan->TANGGAL_PERPANJANGAN,
                        'tanggal_kadaluarsa' => $barangTitipan->TANGGAL_KADALUARSA,
                        'status' => $barangTitipan->STATUS,
                    ],
                    'message' => 'Masa penitipan berhasil diperpanjang'
                ], 200);
            });
        } catch (\Exception $e) {
            Log::error("Failed to extend consignment for KODE_PRODUK: {$kode_produk}: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperpanjang masa penitipan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function requestRetrieval($kode_produk)
    {
        try {
            return DB::transaction(function () use ($kode_produk) {
                $penitip = auth('penitip')->user();
                if (!$penitip) {
                    Log::error("Unauthorized access attempt to request retrieval for KODE_PRODUK: {$kode_produk}");
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized: You must be logged in as a penitip'
                    ], 401);
                }

                $penitipId = $penitip->ID_PENITIP;
                Log::info("Attempting to request retrieval for KODE_PRODUK: {$kode_produk} by penitip ID: {$penitipId}");

                $barangTitipan = BarangTitipan::where('KODE_PRODUK', $kode_produk)
                    ->whereHas('penitipan', function ($query) use ($penitipId) {
                        $query->where('ID_PENITIP', $penitipId);
                    })
                    ->first();

                if (!$barangTitipan) {
                    Log::error("Barang titipan not found for KODE_PRODUK: {$kode_produk} or not owned by penitip ID: {$penitipId}");
                    return response()->json([
                        'success' => false,
                        'message' => 'Barang titipan not found or you do not have permission to request retrieval of this item'
                    ], 404);
                }

                if ($barangTitipan->STATUS !== 'Kadaluarsa') {
                    Log::warning("Item status is not 'Kadaluarsa', current status: {$barangTitipan->STATUS}");
                    return response()->json([
                        'success' => false,
                        'message' => 'Hanya barang dengan status Kadaluarsa yang dapat diajukan untuk pengambilan'
                    ], 400);
                }

                $tanggalKonfirmasi = Carbon::now()->toDateTimeString();

                $updated = $barangTitipan->update([
                    'TANGGAL_KONFIRMASI' => $tanggalKonfirmasi,
                    'STATUS' => 'Siap Diambil Kembali',
                ]);

                if (!$updated) {
                    Log::error("Failed to update barang titipan in database");
                    throw new \Exception("Failed to update barang titipan in database");
                }

                $barangTitipan->refresh();

                Log::info("Successfully requested retrieval for KODE_PRODUK: {$kode_produk} by penitip ID: {$penitipId}");

                return response()->json([
                    'success' => true,
                    'data' => [
                        'kode_barang' => $barangTitipan->KODE_PRODUK,
                    ],
                    'message' => 'Pengambilan barang berhasil diajukan'
                ], 200);
            });
        } catch (\Exception $e) {
            Log::error("Failed to request retrieval for KODE_PRODUK: {$kode_produk}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengajukan pengambilan barang: ' . $e->getMessage()
            ], 500);
        }
    }

    public function confirmRetrieval($kode_produk)
    {
        try {
            if (!Auth::guard('pegawai')->check()) {
                Log::error("Unauthorized attempt to confirm retrieval for KODE_PRODUK: {$kode_produk}");
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak terautentikasi'
                ], 401);
            }

            return DB::transaction(function () use ($kode_produk) {
                $barangTitipan = BarangTitipan::where('KODE_PRODUK', $kode_produk)
                    ->firstOrFail();

                if ($barangTitipan->STATUS !== 'Siap Diambil Kembali') {
                    Log::warning("Item status is not 'Siap Diambil Kembali', current status: {$barangTitipan->STATUS}");
                    return response()->json([
                        'success' => false,
                        'message' => 'Hanya barang dengan status Siap Diambil Kembali yang dapat dikonfirmasi pengambilannya'
                    ], 400);
                }

                $tanggalKonfirmasi = Carbon::now()->toDateTimeString();

                $barangTitipan->update([
                    'TANGGAL_KONFIRMASI' => $tanggalKonfirmasi,
                    'STATUS' => 'Dikembalikan',
                ]);

                Log::info("Successfully confirmed retrieval for KODE_PRODUK: {$kode_produk}");

                return response()->json([
                    'success' => true,
                    'data' => [
                        'kode_barang' => $barangTitipan->KODE_PRODUK,
                        'tanggal_konfirmasi' => $tanggalKonfirmasi,
                        'status' => $barangTitipan->STATUS,
                    ],
                    'message' => 'Pengambilan barang berhasil dikonfirmasi'
                ], 200);
            });
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error("Barang titipan not found for KODE_PRODUK: {$kode_produk}");
            return response()->json([
                'success' => false,
                'message' => 'Barang titipan tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            Log::error("Failed to confirm retrieval for KODE_PRODUK: {$kode_produk}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengkonfirmasi pengambilan barang: ' . $e->getMessage()
            ], 500);
        }
    }
}