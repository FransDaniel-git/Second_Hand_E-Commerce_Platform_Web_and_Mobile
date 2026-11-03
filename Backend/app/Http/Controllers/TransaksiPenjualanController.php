<?php

namespace App\Http\Controllers;

use App\Models\TransaksiPenjualan;
use App\Models\Komisi;
use App\Models\Alamat;
use App\Models\BarangTitipan;
use App\Models\Pembeli;
use App\Models\Penitip;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class TransaksiPenjualanController extends Controller
{
    private function transactionDetailQuery()
    {
        return TransaksiPenjualan::with([
            'pembeli' => function ($query) {
                $query->select('ID_PEMBELI', 'NAMA', 'EMAIL')->where('STATUS', 'active');
            },
            'pegawaiKurir' => function ($query) {
                $query->select('ID_PEGAWAI', 'NAMA')->where('STATUS', 'active');
            },
            'barangTitipan' => function ($query) {
                $query->select(
                    'barangtitipans.ID_PENJUALAN',
                    'barangtitipans.KODE_PRODUK',
                    'barangtitipans.NAMA as product_name',
                    'barangtitipans.HARGA_JUAL as product_price',
                    'barangtitipans.ID_PENITIPAN',
                    'barangtitipans.RATING'
                )
                ->join('transaksipenitipans', 'barangtitipans.ID_PENITIPAN', '=', 'transaksipenitipans.ID_PENITIPAN')
                ->join('penitips', 'transaksipenitipans.ID_PENITIP', '=', 'penitips.ID_PENITIP')
                ->leftJoin('pegawais', 'transaksipenitipans.ID_PEGAWAI_QC', '=', 'pegawais.ID_PEGAWAI')
                ->selectRaw('penitips.NAMA as penitip_name, pegawais.NAMA as qc_name');
            }
        ])
        ->select(
            'ID_PENJUALAN',
            'NO_NOTA_PENJUALAN',
            'TOTAL_AKHIR',
            'TANGGAL_PESANAN',
            'STATUS',
            'ONGKIR',
            'POIN_TERPAKAI',
            'POIN_DIPEROLEH',
            'ALAMAT_PENGIRIMAN',
            'ID_PEMBELI',
            'ID_PEGAWAI_KURIR',
            'METODE_PENGIRIMAN',
            'BUKTI_PEMBAYARAN',
            'TANGGAL_PEMBAYARAN',
            'PRODUCT_SNAPSHOT'
        );
    }

    private function formatTransaction($transaction)
    {
        $products = json_decode($transaction->PRODUCT_SNAPSHOT, true) ?? [];

        if (empty($products)) {
            $products = $transaction->barangTitipan->map(function ($item) {
                return [
                    'product_id' => $item->KODE_PRODUK,
                    'nama_barang' => $item->product_name,
                    'harga_barang' => 'Rp' . number_format($item->product_price, 0, ',', '.'),
                    'product_price_raw' => $item->product_price,
                    'nama_penitip' => $item->penitip_name,
                    'nama_qc' => $item->qc_name ?? '-',
                    'image' => '/api/placeholder/60/60',
                    'has_rating' => $item->RATING !== null,
                ];
            })->toArray();
        } else {
            // Pastikan nama_qc tersedia meskipun snapshot lama belum menyimpannya.
            $products = array_map(function ($product) use ($transaction) {
                if (!isset($product['nama_qc'])) {
                    $barang = $transaction->barangTitipan->firstWhere('KODE_PRODUK', $product['product_id']);
                    $product['nama_qc'] = $barang ? ($barang->qc_name ?? '-') : '-';
                }
                return $product;
            }, $products);
        }

        return [
            'no_nota' => $transaction->NO_NOTA_PENJUALAN,
            'status' => $transaction->STATUS,
            'products' => $products,
            'total_akhir' => 'Rp' . number_format($transaction->TOTAL_AKHIR, 0, ',', '.'),
            'tanggal_transaksi' => $transaction->TANGGAL_PESANAN
                ? $transaction->TANGGAL_PESANAN->format('Y-m-d H:i:s')
                : null,
            'nama_pembeli' => $transaction->pembeli ? $transaction->pembeli->NAMA : '-',
            'email_pembeli' => $transaction->pembeli ? $transaction->pembeli->EMAIL : '-',
            'alamat' => $transaction->ALAMAT_PENGIRIMAN ?? '-',
            'ongkir' => 'Rp' . number_format($transaction->ONGKIR ?? 0, 0, ',', '.'),
            'poin_digunakan' => $transaction->POIN_TERPAKAI ?? 0,
            'poin_diperoleh' => $transaction->POIN_DIPEROLEH ?? 0,
            'nama_kurir' => $transaction->pegawaiKurir ? $transaction->pegawaiKurir->NAMA : '-',
            'nama_qc' => $products[0]['nama_qc'] ?? '-',
            'metode_pengiriman' => $transaction->METODE_PENGIRIMAN ?? '-',
            'bukti_pembayaran' => $transaction->BUKTI_PEMBAYARAN ? asset('storage/' . $transaction->BUKTI_PEMBAYARAN) : null,
            'tanggal_pembayaran' => $transaction->TANGGAL_PEMBAYARAN
                ? $transaction->TANGGAL_PEMBAYARAN->format('Y-m-d H:i:s')
                : null,
        ];
    }

    public function index(Request $request)
{
    try {
        $pembeliId = auth('pembeli')->user()->ID_PEMBELI;

        \Log::info("Fetching transactions for pembeli ID: {$pembeliId}");

        $transactions = $this->transactionDetailQuery()
            ->where('ID_PEMBELI', $pembeliId)
            ->get()
            ->map(function ($transaction) {
                return $this->formatTransaction($transaction);
            });

        \Log::info("Transactions fetched: " . json_encode($transactions));

        return response()->json([
            'success' => true,
            'data' => $transactions
        ], 200);
    } catch (\Exception $e) {
        \Log::error("Failed to fetch transactions: " . $e->getMessage() . "\nStack Trace: " . $e->getTraceAsString());
        return response()->json([
            'success' => false,
            'message' => 'Failed to fetch transactions: ' . $e->getMessage()
        ], 500);
    }
}

    public function store(Request $request)
    {
        // Updated validation: alamat_id is required only for 'dikirim'
        $request->validate([
            'alamat_id' => [
                'nullable',
                function ($attribute, $value, $fail) use ($request) {
                    if ($request->shipping_method === 'dikirim' && !$value) {
                        $fail('Alamat wajib dipilih untuk pengiriman dikirim.');
                    }
                    if ($value && !Alamat::where('ID_ALAMAT', $value)->exists()) {
                        $fail('Alamat tidak ditemukan.');
                    }
                },
            ],
            'products' => 'required|array',
            'products.*.product_id' => 'required|exists:barangtitipans,KODE_PRODUK',
            'products.*.quantity' => 'required|integer|min:1',
            'shipping_method' => 'required|in:diambil sendiri,dikirim',
            'use_points' => 'boolean',
            'points_to_use' => 'nullable|integer|min:100',
        ]);

        $user = auth('pembeli')->user();
        $productsData = $request->products;
        $products = BarangTitipan::whereIn('KODE_PRODUK', array_column($productsData, 'product_id'))
        ->with([
            'penitipan.penitip',
            'penitipan.pegawaiQC', // Add pegawaiQC to fetch QC employee data
            'fotoProduk' => function ($query) {
                $query->where('IS_UTAMA', true);
            }
        ])
        ->get();

    $itemTotal = 0;
    $productSnapshot = [];
    foreach ($productsData as $productData) {
        $product = $products->firstWhere('KODE_PRODUK', $productData['product_id']);
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => "Produk dengan ID {$productData['product_id']} tidak ditemukan."
            ], 404);
        }
        $itemTotal += $product->HARGA_JUAL * $productData['quantity'];

        $productSnapshot[] = [
            'product_id' => $product->KODE_PRODUK,
            'nama_barang' => $product->NAMA,
            'harga_barang' => 'Rp' . number_format($product->HARGA_JUAL, 0, ',', '.'),
            'product_price_raw' => $product->HARGA_JUAL,
            'nama_penitip' => $product->penitipan->penitip->NAMA ?? 'Unknown',
            'nama_qc' => $product->penitipan->pegawaiQC->NAMA ?? '-', // Add nama_qc
            'image' => url("/api/products/{$product->KODE_PRODUK}/thumbnail"),
            'has_rating' => $product->RATING !== null,
            'quantity' => $productData['quantity'],
        ];
    }

        $shippingCost = $request->shipping_method === 'dikirim' && $itemTotal < 1500000 ? 100000 : 0;
        $userPoints = $user->POIN_LOYALITAS;

        $pointsToUse = 0;
        $pointsDiscount = 0;
        if ($request->use_points && $request->points_to_use >= 100) {
            $maxPoints = min($userPoints, floor($itemTotal / 100) * 100);
            $pointsToUse = $request->points_to_use;
            if ($pointsToUse % 100 !== 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Poin yang digunakan harus dalam kelipatan 100.'
                ], 422);
            }
            if ($pointsToUse > $maxPoints) {
                return response()->json([
                    'success' => false,
                    'message' => "Poin yang digunakan melebihi batas maksimum {$maxPoints}."
                ], 422);
            }
            $pointsDiscount = ($pointsToUse / 100) * 10000;
        }

        $totalAmount = $itemTotal + $shippingCost - $pointsDiscount;
        $basePoints = floor($itemTotal / 10000);
        $pointsEarned = $itemTotal > 500000 ? ceil($basePoints * 1.2) : $basePoints;
        $totalPoinPembeli = $user->POIN_LOYALITAS - $pointsToUse + $pointsEarned;

        // Handle address for 'diambil sendiri' or 'dikirim'
        $alamatPengiriman = '-';
        if ($request->shipping_method === 'dikirim' || $request->alamat_id) {
            $alamat = $request->alamat_id
                ? Alamat::find($request->alamat_id)
                : Alamat::where('ID_PEMBELI', $user->ID_PEMBELI)->where('ALAMAT_UTAMA', 1)->first();
            
            if ($alamat) {
                $alamatPengiriman = sprintf(
                    "%s, Kelurahan %s, Kecamatan %s, Kota %s, %s",
                    $alamat->JALAN,
                    $alamat->KELURAHAN,
                    $alamat->KECAMATAN,
                    $alamat->KOTA,
                    $alamat->KODE_POS
                );
            } elseif ($request->shipping_method === 'dikirim') {
                return response()->json([
                    'success' => false,
                    'message' => "Alamat tidak ditemukan untuk pengiriman."
                ], 404);
            }
        }

        DB::beginTransaction();
        try {
            $transaction = TransaksiPenjualan::create([
                'ID_PEMBELI' => $user->ID_PEMBELI,
                'NO_NOTA_PENJUALAN' => null,
                'TOTAL_BIAYA' => $itemTotal,
                'ONGKIR' => $shippingCost,
                'POIN_TERPAKAI' => $pointsToUse,
                'TOTAL_AKHIR' => $totalAmount,
                'POIN_DIPEROLEH' => $pointsEarned,
                'TOTAL_POIN_PEMBELI' => $totalPoinPembeli,
                'TANGGAL_PESANAN' => now(),
                'STATUS' => 'Menunggu Pembayaran',
                'ALAMAT_PENGIRIMAN' => $alamatPengiriman,
                'METODE_PENGIRIMAN' => $request->shipping_method,
                'PRODUCT_SNAPSHOT' => json_encode($productSnapshot),
            ]);

            $noNota = TransaksiPenjualan::generateNoNotaPenjualan($transaction->ID_PENJUALAN);
            $transaction->NO_NOTA_PENJUALAN = $noNota;
            $transaction->save();

            foreach ($productsData as $productData) {
                $product = $products->firstWhere('KODE_PRODUK', $productData['product_id']);
                $product->ID_PENJUALAN = $transaction->ID_PENJUALAN;
                $product->STATUS = 'Terjual';
                $product->setTerjualCepat($transaction->TANGGAL_PESANAN);
                $product->save();
            }

            if ($pointsToUse > 0) {
                $user->POIN_LOYALITAS -= $pointsToUse;
                $user->save();
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'data' => $transaction,
                'message' => 'Transaksi berhasil, menunggu pembayaran.'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Checkout error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyelesaikan transaksi: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(Request $request, $noNotaAtauId)
    {
        try {
            $query = $this->transactionDetailQuery();

            // Utamakan nomor nota; dukung juga ID_PENJUALAN numerik.
            $query->where(function ($q) use ($noNotaAtauId) {
                $q->where('NO_NOTA_PENJUALAN', $noNotaAtauId);

                if (ctype_digit((string) $noNotaAtauId)) {
                    $q->orWhere('ID_PENJUALAN', (int) $noNotaAtauId);
                }
            });

            // Batasi data sesuai pemiliknya agar tidak terjadi IDOR.
            if (auth('pembeli')->check()) {
                $query->where('ID_PEMBELI', auth('pembeli')->id());
            } elseif (auth('penitip')->check()) {
                $penitipId = auth('penitip')->id();
                $query->whereHas('barangTitipan.penitipan', function ($q) use ($penitipId) {
                    $q->where('ID_PENITIP', $penitipId);
                });
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak terautentikasi.',
                ], 401);
            }

            $transaction = $query->firstOrFail();

            return response()->json([
                'success' => true,
                'data' => $this->formatTransaction($transaction),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak ditemukan atau Anda tidak memiliki akses.',
            ], 404);
        } catch (\Exception $e) {
            Log::error("Failed to fetch transaction detail: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil detail transaksi: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        \Log::info("Received PUT request for ID_PENJUALAN: {$id}", $request->all());
        $transaksiPenjualan = TransaksiPenjualan::findOrFail($id);
        $oldTanggalSiap = $transaksiPenjualan->TANGGAL_SIAP;
        $oldStatus = $transaksiPenjualan->STATUS;
        \Log::info("Before update - ID_PENJUALAN: {$id}, TANGGAL_SIAP: {$oldTanggalSiap}, ID_PEGAWAI_KURIR: {$transaksiPenjualan->ID_PEGAWAI_KURIR}, STATUS: {$oldStatus}");

        $request->validate([
            'ID_PEMBELI' => 'nullable|integer',
            'ID_PEGAWAI_GUDANG' => 'nullable|string|max:10',
            'ID_PEGAWAI_CS' => 'nullable|string|max:10',
            'ID_PEGAWAI_KURIR' => 'nullable|string|max:10',
            'NO_NOTA_PENJUALAN' => 'nullable|string|max:50',
            'TOTAL_BIAYA' => 'nullable|integer',
            'ONGKIR' => 'nullable|integer',
            'POIN_TERPAKAI' => 'nullable|integer',
            'TOTAL_AKHIR' => 'nullable|integer',
            'POIN_DIPEROLEH' => 'nullable|integer',
            'TANGGAL_PESANAN' => 'nullable|date',
            'TANGGAL_PEMBAYARAN' => 'nullable|date',
            'BUKTI_PEMBAYARAN' => 'nullable|string',
            'METODE_PENGIRIMAN' => 'nullable|in:dikirim,diambil sendiri',
            'TANGGAL_SIAP' => 'nullable|date_format:Y-m-d H:i:s',
            'STATUS' => 'nullable|string',
            'TOTAL_POIN_PEMBELI' => 'nullable|integer',
            'ALAMAT_PENGIRIMAN' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $transaksiPenjualan->update($request->all());
            $transaksiPenjualan->refresh();

            // Apply POIN_DIPEROLEH to Pembeli.POIN_LOYALITAS when status changes to Sudah Diterima or Sudah Diambil
            // if (
            //     $oldStatus !== $transaksiPenjualan->STATUS &&
            //     in_array($transaksiPenjualan->STATUS, ['Sudah Diterima', 'Sudah Diambil']) &&
            //     $transaksiPenjualan->POIN_DIPEROLEH > 0
            // ) {
            //     $pembeli = Pembeli::findOrFail($transaksiPenjualan->ID_PEMBELI);
            //     $pembeli->POIN_LOYALITAS += $transaksiPenjualan->POIN_DIPEROLEH;
            //     $pembeli->save();
            //     \Log::info("Added {$transaksiPenjualan->POIN_DIPEROLEH} points to pembeli ID: {$transaksiPenjualan->ID_PEMBELI} for transaction ID: {$id}");
            // }

            // if ((string)$oldTanggalSiap !== (string)$transaksiPenjualan->TANGGAL_SIAP && $transaksiPenjualan->TANGGAL_SIAP !== null) {
            //     \Log::info("Manually triggering TransaksiPenjualanTanggalSiapSet for ID_PENJUALAN: {$id}");
            //     event(new \App\Events\TransaksiPenjualanTanggalSiapSet($transaksiPenjualan));
            // } else {
            //     \Log::warning("Manual event not triggered: TANGGAL_SIAP unchanged or null for ID_PENJUALAN: {$id}, Old: {$oldTanggalSiap}, New: {$transaksiPenjualan->TANGGAL_SIAP}");
            // }

            DB::commit();
            return response()->json($transaksiPenjualan);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Update error for ID_PENJUALAN: {$id}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui transaksi: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        TransaksiPenjualan::destroy($id);
        return response()->noContent();
    }

    public function indexForPenitip(Request $request)
    {
        try {
            $penitipId = auth('penitip')->user()->ID_PENITIP;

            \Log::info("Fetching sales transactions for penitip ID: {$penitipId}");

            $barangTitipan = BarangTitipan::whereHas('penitipan', function ($query) use ($penitipId) {
                $query->where('ID_PENITIP', $penitipId);
            })
            ->where('STATUS', '!=', 'Tersedia')
            ->with([
                'penitipan.penitip' => function ($query) {
                    $query->select('ID_PENITIP', 'NAMA');
                },
                'penitipan.pegawaiQC' => function ($query) {
                    $query->select('ID_PEGAWAI', 'NAMA');
                },
                'penjualan.pembeli' => function ($query) {
                    $query->select('ID_PEMBELI', 'NAMA', 'EMAIL')->where('STATUS', 'active');
                },
                'penjualan.pegawaiKurir' => function ($query) {
                    $query->select('ID_PEGAWAI', 'NAMA')->where('STATUS', 'active');
                },
                'komisi' => function ($query) {
                    $query->select('KODE_PRODUK', 'KOMISI_PENITIP', 'KOMISI_HUNTER', 'KOMISI_REUSEMART', 'BONUS', 'ID_PENITIP');
                }
            ])
            ->leftJoin('foto_produk', function ($join) {
                $join->on('barangtitipans.KODE_PRODUK', '=', 'foto_produk.KODE_PRODUK')
                     ->where('foto_produk.IS_UTAMA', true);
            })
            ->select(
                'barangtitipans.KODE_PRODUK',
                'barangtitipans.NAMA as product_name',
                'barangtitipans.HARGA_JUAL as product_price',
                'barangtitipans.BERAT as weight',
                'barangtitipans.KONDISI as condition',
                'barangtitipans.ID_PENITIPAN',
                'barangtitipans.ID_PENJUALAN',
                'barangtitipans.STATUS',
                'foto_produk.URL_FOTO as main_photo'
            )
            ->get();

            \Log::info("Found barang titipan for penitip: " . json_encode($barangTitipan->pluck('KODE_PRODUK')));

            $transactions = [];
            $standaloneItems = [];

            foreach ($barangTitipan as $item) {
                $productData = [
                    'product_id' => $item->KODE_PRODUK,
                    'nama_barang' => $item->product_name,
                    'harga_barang' => 'Rp' . number_format($item->product_price, 0, ',', '.'),
                    'product_price_raw' => $item->product_price,
                    'weight' => $item->weight ?? '-',
                    'condition' => $item->condition ?? '-',
                    'nama_penitip' => $item->penitipan->penitip->NAMA ?? '-',
                    'nama_qc' => $item->penitipan->pegawaiQC->NAMA ?? '-',
                    'komisi_penitip' => $item->komisi ? (int)$item->komisi->KOMISI_PENITIP : 0,
                    'komisi_hunter' => $item->komisi ? (int)$item->komisi->KOMISI_HUNTER : 0,
                    'komisi_reusemart' => $item->komisi ? (int)$item->komisi->KOMISI_REUSEMART : 0,
                    'bonus' => $item->komisi ? (int)$item->komisi->BONUS : 0,
                    'status' => $item->STATUS,
                    'subtotal' => ($item->komisi ? (int)$item->komisi->KOMISI_PENITIP + (int)$item->komisi->BONUS : 0),
                    'image' => $item->main_photo ? asset('storage/' . $item->main_photo) : '/api/placeholder/60/60'
                ];

                if ($item->ID_PENJUALAN && $item->penjualan) {
                    $transactionKey = $item->ID_PENJUALAN;
                    if (!isset($transactions[$transactionKey])) {
                        $transactions[$transactionKey] = [
                            'no_nota' => $item->penjualan->NO_NOTA_PENJUALAN,
                            'status' => $item->penjualan->STATUS,
                            'products' => [],
                            'tanggal_transaksi' => $item->penjualan->TANGGAL_PESANAN,
                            'email_pembeli' => $item->penjualan->pembeli ? $item->penjualan->pembeli->EMAIL : '-',
                            'alamat' => $item->penjualan->ALAMAT_PENGIRIMAN ?? '-',
                            'nama_kurir' => $item->penjualan->pegawaiKurir ? $item->penjualan->pegawaiKurir->NAMA : '-',
                            'metode_pengiriman' => $item->penjualan->METODE_PENGIRIMAN ?? '-',
                            'total_pendapatan' => 0
                        ];
                    }
                    $transactions[$transactionKey]['products'][] = $productData;
                    $transactions[$transactionKey]['total_pendapatan'] += $productData['subtotal'];
                } else {
                    $standaloneItems[] = $productData;
                }
            }

            $mappedTransactions = array_values(array_map(function ($transaction) {
                $transaction['total_pendapatan'] = 'Rp' . number_format($transaction['total_pendapatan'], 0, ',', '.');
                return $transaction;
            }, $transactions));

            $result = $mappedTransactions;
            if (!empty($standaloneItems)) {
                $result[] = [
                    'no_nota' => 'N/A',
                    'status' => 'N/A',
                    'products' => $standaloneItems,
                    'tanggal_transaksi' => null,
                    'email_pembeli' => '-',
                    'alamat' => '-',
                    'nama_kurir' => '-',
                    'metode_pengiriman' => '-',
                    'total_pendapatan' => 'Rp' . number_format(array_sum(array_column($standaloneItems, 'subtotal')), 0, ',', '.')
                ];
            }

            \Log::info("Sales transactions fetched for penitip: " . json_encode($result));

            return response()->json([
                'success' => true,
                'data' => $result
            ], 200);
        } catch (\Exception $e) {
            \Log::error("Failed to fetch sales transactions: " . $e->getMessage() . "\nStack Trace: " . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch sales transactions: ' . $e->getMessage()
            ], 500);
        }
    }

    public function indexForGudang(Request $request)
    {
        try {
            \Log::info("Fetching transactions for gudang role");

            $transactions = TransaksiPenjualan::with([
                'pembeli' => function ($query) {
                    $query->select('ID_PEMBELI', 'NAMA', 'EMAIL')->where('STATUS', 'active');
                },
                'pegawaiKurir' => function ($query) {
                    $query->select('ID_PEGAWAI', 'NAMA')->where('STATUS', 'active');
                },
                'barangTitipan' => function ($query) {
                    $query->select(
                        'barangtitipans.ID_PENJUALAN',
                        'barangtitipans.KODE_PRODUK',
                        'barangtitipans.NAMA as product_name',
                        'barangtitipans.HARGA_JUAL as product_price',
                        'barangtitipans.ID_PENITIPAN'
                    )
                    ->join('transaksipenitipans', 'barangtitipans.ID_PENITIPAN', '=', 'transaksipenitipans.ID_PENITIPAN')
                    ->join('penitips', 'transaksipenitipans.ID_PENITIP', '=', 'penitips.ID_PENITIP')
                    ->leftJoin('pegawais', 'transaksipenitipans.ID_PEGAWAI_QC', '=', 'pegawais.ID_PEGAWAI')
                    ->selectRaw('penitips.NAMA as penitip_name, pegawais.NAMA as qc_name, pegawais.ID_PEGAWAI as qc_id');
                }
            ])
            ->select(
                'ID_PENJUALAN',
                'NO_NOTA_PENJUALAN',
                'TOTAL_BIAYA',
                'ONGKIR',
                'POIN_TERPAKAI',
                'TOTAL_AKHIR',
                'POIN_DIPEROLEH',
                'TOTAL_POIN_PEMBELI',
                'TANGGAL_PESANAN',
                'TANGGAL_PEMBAYARAN',
                'STATUS',
                'ALAMAT_PENGIRIMAN',
                'ID_PEMBELI',
                'ID_PEGAWAI_KURIR',
                'METODE_PENGIRIMAN',
                'TANGGAL_SIAP'
            )
            ->get()
            ->map(function ($transaction) {
                $products = $transaction->barangTitipan->map(function ($item) use ($transaction) {
                    return [
                        'product_id' => $item->KODE_PRODUK,
                        'nama_barang' => $item->product_name,
                        'harga_barang' => 'Rp' . number_format($item->product_price, 0, ',', '.'),
                        'harga_raw' => $item->product_price,
                        'nama_penitip' => $item->penitip_name,
                        'nama_qc' => $item->qc_name ?? '-',
                        'id_pegawai_qc' => $item->qc_id ?? '-',
                        'nama_kurir' => $transaction->pegawaiKurir ? $transaction->pegawaiKurir->NAMA : '-',
                        'id_pegawai_kurir' => $transaction->ID_PEGAWAI_KURIR ?? '-',
                    ];
                })->toArray();

                return [
                    'id_penjualan' => $transaction->ID_PENJUALAN,
                    'no_nota' => $transaction->NO_NOTA_PENJUALAN,
                    'total_biaya' => $transaction->TOTAL_BIAYA ?? 0,
                    'ongkir' => $transaction->ONGKIR ?? 0,
                    'poin_digunakan' => $transaction->POIN_TERPAKAI ?? 0,
                    'total_akhir' => $transaction->TOTAL_AKHIR ?? 0,
                    'poin_diperoleh' => $transaction->POIN_DIPEROLEH ?? 0,
                    'total_poin_pembeli' => $transaction->TOTAL_POIN_PEMBELI ?? 0,
                    'tanggal_transaksi' => $transaction->TANGGAL_PESANAN,
                    'tanggal_pembayaran' => $transaction->TANGGAL_PEMBAYARAN,
                    'status' => $transaction->STATUS,
                    'products' => $products,
                    'nama_pembeli' => $transaction->pembeli ? $transaction->pembeli->NAMA : '-',
                    'email_pembeli' => $transaction->pembeli ? $transaction->pembeli->EMAIL : '-',
                    'alamat' => $transaction->ALAMAT_PENGIRIMAN ?? '-',
                    'nama_kurir' => $transaction->pegawaiKurir ? $transaction->pegawaiKurir->NAMA : '-',
                    'id_pegawai_kurir' => $transaction->ID_PEGAWAI_KURIR ?? '-',
                    'metode_pengiriman' => $transaction->METODE_PENGIRIMAN ?? '-',
                    'schedule_details' => $transaction->TANGGAL_SIAP ? [
                        'scheduleDate' => date('Y-m-d', strtotime($transaction->TANGGAL_SIAP)),
                        'session' => date('H:i', strtotime($transaction->TANGGAL_SIAP)),
                        'courier' => $transaction->pegawaiKurir ? $transaction->pegawaiKurir->NAMA : null,
                    ] : null,
                ];
            });

            \Log::info("Transactions fetched for gudang: " . json_encode($transactions));

            return response()->json([
                'success' => true,
                'data' => $transactions
            ], 200);
        } catch (\Exception $e) {
            \Log::error("Failed to fetch transactions for gudang: " . $e->getMessage() . "\nStack Trace: " . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch transactions: ' . $e->getMessage()
            ], 500);
        }
    }

    public function testNotification()
    {
        $service = app(\App\Services\NotificationService::class);
        return $service->sendNotification(
            'cy4XIwjgQVqsLm4HWtlsuz:APA91bGFrHBOV-orntmwZ0luxkjP9z8NE2keaIKcCHz_hL-BZol0cM0PQv3LRMWwwH68ss323BDN3WOOOhF5gkpb1-6UtWsnU7yak9MDaXj4juPtnOSb9aQ',
            'Test Notification',
            'This is a test.',
            ['test' => '1']
        );
    }

    public function testEvent($id)
    {
        $transaksi = TransaksiPenjualan::findOrFail($id);
        \Log::info("Manually triggering TransaksiPenjualanTanggalSiapSet for ID_PENJUALAN: {$id}");
        event(new \App\Events\TransaksiPenjualanTanggalSiapSet($transaksi));
        return response()->json(['success' => true, 'message' => 'Event triggered']);
    }

    public function uploadProof(Request $request, $noNota)
    {
        Log::info("Attempting to upload proof for NO_NOTA_PENJUALAN: {$noNota}");
        Log::info("Request data: ", $request->all());
        Log::info("Request files: ", $request->file());

        // Validate the request
        $request->validate([
            'BUKTI_PEMBAYARAN' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            'STATUS' => 'required|string|in:Menunggu Verifikasi',
            'TANGGAL_PEMBAYARAN' => 'required|date',
        ], [
            'BUKTI_PEMBAYARAN.required' => 'Bukti pembayaran wajib diunggah.',
            'BUKTI_PEMBAYARAN.image' => 'Bukti pembayaran harus berupa gambar.',
            'BUKTI_PEMBAYARAN.mimes' => 'Format gambar harus jpeg, png, jpg, atau gif.',
            'BUKTI_PEMBAYARAN.max' => 'Ukuran gambar tidak boleh melebihi 2MB.',
        ]);

        $pembeliId = auth('pembeli')->user()->ID_PEMBELI;
        Log::info("Authenticated pembeli ID: {$pembeliId}");

        // Normalize noNota
        $noNota = trim($noNota);
        Log::info("Normalized noNota: {$noNota}");

        // Find transaction
        DB::enableQueryLog();
        $transaction = TransaksiPenjualan::where('NO_NOTA_PENJUALAN', $noNota)
            ->where('ID_PEMBELI', $pembeliId)
            ->first();
        $queryLog = DB::getQueryLog();
        Log::info("Query executed: " . json_encode($queryLog));

        if (!$transaction) {
            $debugTransaction = TransaksiPenjualan::where('NO_NOTA_PENJUALAN', $noNota)->first();
            if ($debugTransaction) {
                Log::error("Transaction exists but ID_PEMBELI mismatch. Transaction ID_PEMBELI: {$debugTransaction->ID_PEMBELI}, Requested ID_PEMBELI: {$pembeliId}");
                return response()->json([
                    'success' => false,
                    'message' => "Transaksi dengan nomor {$noNota} tidak terkait dengan akun Anda."
                ], 403);
            } else {
                Log::error("Transaction does not exist in database for NO_NOTA_PENJUALAN: {$noNota}");
                $allTransactions = TransaksiPenjualan::select('NO_NOTA_PENJUALAN', 'ID_PEMBELI')->get()->toArray();
                Log::info("All available transactions: " . json_encode($allTransactions));
                return response()->json([
                    'success' => false,
                    'message' => "Transaksi dengan nomor {$noNota} tidak ditemukan di server."
                ], 404);
            }
        }

        if ($transaction->BUKTI_PEMBAYARAN !== null) {
            Log::warning("Payment proof already exists for NO_NOTA_PENJUALAN: {$noNota}");
            return response()->json([
                'success' => false,
                'message' => 'Bukti pembayaran sudah diunggah untuk transaksi ini.'
            ], 403);
        }

        DB::beginTransaction();
        try {
            // Handle file upload
            if ($request->hasFile('BUKTI_PEMBAYARAN')) {
                $file = $request->file('BUKTI_PEMBAYARAN');
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('payment_proofs', $filename, 'public');
                Log::info("File uploaded to: {$path}");
                $transaction->BUKTI_PEMBAYARAN = $path;
            } else {
                Log::error("No file found in BUKTI_PEMBAYARAN field");
                throw new \Exception("File bukti pembayaran tidak ditemukan.");
            }

            $transaction->STATUS = $request->STATUS;
            $transaction->TANGGAL_PEMBAYARAN = $request->TANGGAL_PEMBAYARAN;
            $transaction->save();

            // Remove items from Wishlist
            $productIds = BarangTitipan::where('ID_PENJUALAN', $transaction->ID_PENJUALAN)
                ->pluck('KODE_PRODUK')
                ->toArray();
            \App\Models\Wishlist::whereIn('KODE_PRODUK', $productIds)->delete();
            Log::info("Removed products from Wishlist: " . json_encode($productIds));

            DB::commit();
            Log::info("Upload proof successful for NO_NOTA_PENJUALAN: {$noNota}");
            return response()->json([
                'success' => true,
                'message' => 'Bukti pembayaran berhasil diunggah.',
                'data' => [
                    'bukti_pembayaran' => $transaction->BUKTI_PEMBAYARAN,
                    'status' => $transaction->STATUS,
                    'tanggal_pembayaran' => $transaction->TANGGAL_PEMBAYARAN,
                ]
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Upload proof error for NO_NOTA_PENJUALAN: {$noNota}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengunggah bukti pembayaran: ' . $e->getMessage()
            ], 500);
        }
    }

    public function submitRating(Request $request)
    {
        Log::info("Attempting to submit rating for product", $request->all());

        // Validate input
        $request->validate([
            'product_id' => 'required|string|exists:barangtitipans,KODE_PRODUK',
            'rating' => 'required|integer|between:1,5',
        ]);

        $pembeliId = auth('pembeli')->user()->ID_PEMBELI;
        $productId = $request->product_id;

        try {
            DB::beginTransaction();

            // Check if the product already has a rating
            $barangTitipan = BarangTitipan::where('KODE_PRODUK', $productId)->firstOrFail();
            if ($barangTitipan->rating !== null) {
                Log::warning("Rating already exists for KODE_PRODUK: {$productId}");
                return response()->json([
                    'success' => false,
                    'message' => 'Produk ini sudah memiliki rating.',
                ], 403);
            }

            // Check if the buyer has a valid transaction for this product
            $transaction = TransaksiPenjualan::where('ID_PEMBELI', $pembeliId)
                ->whereIn('STATUS', ['Sudah Diterima', 'Sudah Diambil'])
                ->whereHas('barangTitipan', function ($query) use ($productId) {
                    $query->where('KODE_PRODUK', $productId);
                })
                ->first();

            if (!$transaction) {
                Log::error("No valid transaction found for pembeli ID: {$pembeliId} and product ID: {$productId}");
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki transaksi yang valid untuk memberikan rating pada produk ini.',
                ], 403);
            }

            // Save the rating to barangtitipans
            $barangTitipan->rating = $request->rating;
            $barangTitipan->save();

            // Get the penitip associated with this product
            $penitip = Penitip::whereHas('transaksiPenitipan', function ($query) use ($barangTitipan) {
                $query->where('ID_PENITIPAN', $barangTitipan->ID_PENITIPAN);
            })->first();

            if ($penitip) {
                // Calculate the average rating for the penitip
                $averageRating = BarangTitipan::whereHas('penitipan', function ($query) use ($penitip) {
                    $query->where('ID_PENITIP', $penitip->ID_PENITIP);
                })
                ->whereNotNull('rating')
                ->whereHas('penjualan', function ($query) {
                    $query->whereIn('STATUS', ['Sudah Diterima', 'Sudah Diambil']);
                })
                ->avg('rating');

                // Update the penitip's RATING
                $penitip->RATING = $averageRating ? round($averageRating, 1) : null;
                $penitip->save();

                Log::info("Updated penitip rating for ID_PENITIP: {$penitip->ID_PENITIP}, New Rating: " . ($penitip->RATING ?? 'null'));
            } else {
                Log::warning("No penitip found for product ID: {$productId}");
            }

            DB::commit();
            Log::info("Rating submitted successfully for KODE_PRODUK: {$productId}, Rating: {$request->rating}");

            return response()->json([
                'success' => true,
                'message' => 'Rating berhasil disimpan.',
                'data' => [
                    'product_id' => $productId,
                    'rating' => $request->rating,
                    'has_rating' => true,
                    'penitip_rating' => $penitip ? $penitip->RATING : null,
                ],
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to submit rating for KODE_PRODUK: {$productId}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan rating: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getRating($productId)
    {
        Log::info("Fetching rating status for KODE_PRODUK: {$productId}");

        try {
            $barangTitipan = BarangTitipan::where('KODE_PRODUK', $productId)->firstOrFail();
            $hasRating = $barangTitipan->rating !== null;

            return response()->json([
                'success' => true,
                'data' => [
                    'product_id' => $productId,
                    'has_rating' => $hasRating,
                    'rating' => $hasRating ? $barangTitipan->rating : null,
                ],
            ], 200);
        } catch (ModelNotFoundException $e) {
            Log::error("Product not found for KODE_PRODUK: {$productId}");
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        } catch (\Exception $e) {
            Log::error("Failed to fetch rating status for KODE_PRODUK: {$productId}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil status rating: ' . $e->getMessage(),
            ], 500);
        }
    }

    // public function cancelTransaction(Request $request, $noNota)
    // {
    //     Log::info("Attempting to cancel transaction for NO_NOTA_PENJUALAN: {$noNota}");

    //     $pembeliId = auth('pembeli')->user()->ID_PEMBELI;
    //     Log::info("Authenticated pembeli ID: {$pembeliId}");

    //     $noNota = trim($noNota);
    //     Log::info("Normalized noNota: {$noNota}");

    //     DB::enableQueryLog();
    //     $transaction = TransaksiPenjualan::where('NO_NOTA_PENJUALAN', $noNota)
    //         ->where('ID_PEMBELI', $pembeliId)
    //         ->first();
    //     $queryLog = DB::getQueryLog();
    //     Log::info("Query executed: " . json_encode($queryLog));

    //     if (!$transaction) {
    //         Log::error("Transaction does not exist for NO_NOTA_PENJUALAN: {$noNota}");
    //         return response()->json([
    //             'success' => false,
    //             'message' => "Transaksi dengan nomor {$noNota} tidak ditemukan atau tidak terkait dengan akun Anda."
    //         ], 404);
    //     }

    //     if ($transaction->STATUS === 'Dibatalkan') {
    //         Log::warning("Transaction already canceled for NO_NOTA_PENJUALAN: {$noNota}");
    //         return response()->json([
    //             'success' => true,
    //             'message' => 'Transaksi berhasil dibatalkan.',
    //         ]);
    //     }

    //     if ($transaction->BUKTI_PEMBAYARAN !== null) {
    //         Log::warning("Payment proof already uploaded for NO_NOTA_PENJUALAN: {$noNota}");
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Transaksi tidak dapat dibatalkan karena bukti pembayaran sudah diunggah.'
    //         ], 403);
    //     }

    //     DB::beginTransaction();
    //     try {
    //         // Refund points if used
    //         if ($transaction->POIN_TERPAKAI > 0) {
    //             $pembeli = Pembeli::findOrFail($pembeliId);
    //             $pembeli->POIN_LOYALITAS += $transaction->POIN_TERPAKAI;
    //             $pembeli->save();
    //             Log::info("Refunded {$transaction->POIN_TERPAKAI} points to pembeli ID: {$pembeliId}");
    //         }

    //         // Update transaction status
    //         $transaction->STATUS = 'Dibatalkan';
    //         $transaction->save();

    //         // Update associated products
    //         $updated = BarangTitipan::where('ID_PENJUALAN', $transaction->ID_PENJUALAN)
    //             ->update([
    //                 'STATUS' => 'Tersedia',
    //                 'ID_PENJUALAN' => null
    //             ]);

    //         Log::info("Updated {$updated} products to 'Tersedia' for transaction ID_PENJUALAN: {$transaction->ID_PENJUALAN}");

    //         DB::commit();
    //         Log::info("Cancellation successful for NO_NOTA_PENJUALAN: {$noNota}");
    //         return response()->json([
    //             'success' => true,
    //             'data' => [
    //                 'status' => $transaction->STATUS
    //             ]
    //         ], 200);
    //     } catch (\Exception $e) {
    //         DB::rollBack();
    //         Log::error("Cancellation error for NO_NOTA_PENJUALAN: {$noNota}: " . $e->getMessage());
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Gagal membatalkan transaksi: ' . $e->getMessage()
    //         ], 500);
    //     }
    // }

    // Di TransaksiPenjualanController - tambahkan validasi status
    public function cancelTransaction(Request $request, $noNota)
    {
        Log::info("Attempting to cancel transaction for NO_NOTA_PENJUALAN: {$noNota}");

        $pembeliId = auth('pembeli')->user()->ID_PEMBELI;
        Log::info("Authenticated pembeli ID: {$pembeliId}");

        $noNota = trim($noNota);
        
        $transaction = TransaksiPenjualan::where('NO_NOTA_PENJUALAN', $noNota)
            ->where('ID_PEMBELI', $pembeliId)
            ->first();

        if (!$transaction) {
            Log::error("Transaction does not exist for NO_NOTA_PENJUALAN: {$noNota}");
            return response()->json([
                'success' => false,
                'message' => "Transaksi dengan nomor {$noNota} tidak ditemukan atau tidak terkait dengan akun Anda."
            ], 404);
        }

        // HANYA status ini yang boleh dibatalkan
        $allowedStatuses = ['Menunggu Pembayaran', 'Menunggu Verifikasi'];
        if (!in_array($transaction->STATUS, $allowedStatuses)) {
            Log::warning("Transaction cannot be canceled due to status: {$transaction->STATUS}");
            return response()->json([
                'success' => false,
                'message' => "Transaksi dengan status {$transaction->STATUS} tidak dapat dibatalkan. Hanya transaksi dengan status 'Menunggu Pembayaran' atau 'Menunggu Verifikasi' yang dapat dibatalkan."
            ], 403);
        }

        if ($transaction->STATUS === 'Dibatalkan') {
            Log::warning("Transaction already canceled for NO_NOTA_PENJUALAN: {$noNota}");
            return response()->json([
                'success' => true,
                'message' => 'Transaksi sudah dalam status dibatalkan.',
            ]);
        }

        // HAPUS pengecekan bukti pembayaran untuk status Menunggu Verifikasi
        // Karena status Menunggu Verifikasi memang sudah ada bukti pembayaran
        if ($transaction->STATUS === 'Menunggu Pembayaran' && $transaction->BUKTI_PEMBAYARAN !== null) {
            Log::warning("Payment proof already uploaded for NO_NOTA_PENJUALAN: {$noNota}");
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak dapat dibatalkan karena bukti pembayaran sudah diunggah.'
            ], 403);
        }

        DB::beginTransaction();
        try {
            // Refund points if used
            if ($transaction->POIN_TERPAKAI > 0) {
                $pembeli = Pembeli::findOrFail($pembeliId);
                $pembeli->POIN_LOYALITAS += $transaction->POIN_TERPAKAI;
                $pembeli->save();
                Log::info("Refunded {$transaction->POIN_TERPAKAI} points to pembeli ID: {$pembeliId}");
            }

            // Update transaction status
            $transaction->STATUS = 'Dibatalkan';
            $transaction->save();

            // Update associated products - set back to available
            $updated = BarangTitipan::where('ID_PENJUALAN', $transaction->ID_PENJUALAN)
                ->update([
                    'STATUS' => 'Tersedia',
                    'ID_PENJUALAN' => null
                ]);

            Log::info("Updated {$updated} products to 'Tersedia' for transaction ID_PENJUALAN: {$transaction->ID_PENJUALAN}");

            DB::commit();
            Log::info("Cancellation successful for NO_NOTA_PENJUALAN: {$noNota}");
            
            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil dibatalkan.',
                'data' => [
                    'status' => $transaction->STATUS
                ]
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Cancellation error for NO_NOTA_PENJUALAN: {$noNota}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal membatalkan transaksi: ' . $e->getMessage()
            ], 500);
        }
    }

    public function indexForCS(Request $request)
    {
        try {
            \Log::info("Fetching transactions for CS role");

            $sort = $request->query('sort', 'unverified'); // Default to unverified
            $query = TransaksiPenjualan::with([
                'pembeli' => function ($query) {
                    $query->select('ID_PEMBELI', 'NAMA', 'EMAIL')
                         ->where('STATUS', 'active');
                },
                'barangTitipan' => function ($query) {
                    $query->select(
                        'barangtitipans.ID_PENJUALAN',
                        'barangtitipans.KODE_PRODUK',
                        'barangtitipans.NAMA as product_name',
                        'barangtitipans.HARGA_JUAL as product_price'
                    )
                    ->leftJoin('foto_produk', function ($join) {
                        $join->on('barangtitipans.KODE_PRODUK', '=', 'foto_produk.KODE_PRODUK')
                             ->where('foto_produk.IS_UTAMA', true);
                    })
                    ->selectRaw('foto_produk.URL_FOTO as main_photo');
                }
            ])
            ->whereHas('pembeli', function ($query) {
                $query->where('STATUS', 'active');
            });

            // Apply sorting based on sort parameter
            if ($sort === 'unverified') {
                $query->where('STATUS', 'Menunggu Verifikasi');
            } elseif ($sort === 'verified') {
                $query->whereIn('STATUS', ['Sedang Dikemas', 'Dibatalkan']);
            } // 'all' will include all transactions, so no additional where clause

            $transactions = $query->select(
                'ID_PENJUALAN',
                'NO_NOTA_PENJUALAN',
                'TOTAL_AKHIR',
                'TANGGAL_PESANAN',
                'STATUS',
                'BUKTI_PEMBAYARAN',
                'TANGGAL_PEMBAYARAN',
                'ALAMAT_PENGIRIMAN',
                'METODE_PENGIRIMAN',
                'ID_PEMBELI'
            )
            ->orderBy('TANGGAL_PESANAN', 'desc') // Optional: Sort by date descending
            ->get()
            ->map(function ($transaction) {
                $products = $transaction->barangTitipan->map(function ($item) {
                    return [
                        'product_id' => $item->KODE_PRODUK,
                        'nama_barang' => $item->product_name,
                        'harga_barang' => 'Rp' . number_format($item->product_price, 0, ',', '.'),
                        'image' => $item->main_photo ? asset('storage/' . $item->main_photo) : '/api/placeholder/60/60',
                    ];
                })->toArray();

                \Log::info("Transaction ID: {$transaction->ID_PENJUALAN}, Pembeli: " . json_encode($transaction->pembeli));

                return [
                    'no_nota' => $transaction->NO_NOTA_PENJUALAN,
                    'status' => $transaction->STATUS,
                    'products' => $products,
                    'total_akhir' => 'Rp' . number_format($transaction->TOTAL_AKHIR, 0, ',', '.'),
                    'tanggal_transaksi' => $transaction->TANGGAL_PESANAN->format('Y-m-d H:i:s'),
                    'bukti_pembayaran' => $transaction->BUKTI_PEMBAYARAN ? asset('storage/' . $transaction->BUKTI_PEMBAYARAN) : null,
                    'tanggal_pembayaran' => $transaction->TANGGAL_PEMBAYARAN ? $transaction->TANGGAL_PEMBAYARAN->format('Y-m-d H:i:s') : null,
                    'nama_pembeli' => $transaction->pembeli->NAMA,
                    'email_pembeli' => $transaction->pembeli->EMAIL,
                    'alamat' => $transaction->ALAMAT_PENGIRIMAN ?? '-',
                    'metode_pengiriman' => $transaction->METODE_PENGIRIMAN ?? '-',
                ];
            });

            \Log::info("Transactions fetched for CS: " . json_encode($transactions));

            return response()->json([
                'success' => true,
                'data' => $transactions
            ], 200);
        } catch (\Exception $e) {
            \Log::error("Failed to fetch transactions for CS: " . $e->getMessage() . "\nStack Trace: " . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch transactions: ' . $e->getMessage()
            ], 500);
        }
    }

    public function verifyPayment(Request $request, $noNota)
{
    $request->validate([
        'action' => 'required|in:accept,reject',
    ]);

    $transaction = TransaksiPenjualan::where('NO_NOTA_PENJUALAN', $noNota)->firstOrFail();

    if ($transaction->STATUS !== 'Menunggu Verifikasi') {
        return response()->json([
            'success' => false,
            'message' => 'Transaksi tidak dalam status Menunggu Verifikasi.'
        ], 403);
    }

    DB::beginTransaction();
    try {
        if ($request->action === 'accept') {
            $transaction->STATUS = 'Sedang Dikemas';

            // Retrieve all products associated with this transaction
            $barangTitipans = BarangTitipan::where('ID_PENJUALAN', $transaction->ID_PENJUALAN)
                ->with(['penitipan.penitip'])
                ->get();

            // Collect unique Penitip IDs to avoid duplicate updates
            $penitipIds = $barangTitipans->pluck('penitipan.penitip.ID_PENITIP')->unique();

            // Increment JLH_PENJUALAN for each unique Penitip
            foreach ($penitipIds as $penitipId) {
                $penitip = Penitip::findOrFail($penitipId);
                $penitip->JLH_PENJUALAN = ($penitip->JLH_PENJUALAN ?? 0) + 1;
                $penitip->save();
                \Log::info("Incremented JLH_PENJUALAN for penitip ID: {$penitipId}, New Value: {$penitip->JLH_PENJUALAN}");
            }
        } elseif ($request->action === 'reject') {
            $transaction->STATUS = 'Dibatalkan';

            // Update associated products to 'Tersedia'
            $updated = BarangTitipan::where('ID_PENJUALAN', $transaction->ID_PENJUALAN)
                ->update([
                    'STATUS' => 'Tersedia',
                    'ID_PENJUALAN' => null
                ]);
            \Log::info("Updated {$updated} products to 'Tersedia' for transaction ID_PENJUALAN: {$transaction->ID_PENJUALAN}");

            // Refund points if used
            if ($transaction->POIN_TERPAKAI > 0) {
                $pembeli = Pembeli::findOrFail($transaction->ID_PEMBELI);
                $pembeli->POIN_LOYALITAS += $transaction->POIN_TERPAKAI;
                $pembeli->save();
                \Log::info("Refunded {$transaction->POIN_TERPAKAI} points to pembeli ID: {$transaction->ID_PEMBELI}");
            }
        }

        $transaction->save();
        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Status transaksi berhasil diperbarui.',
            'data' => [
                'status' => $transaction->STATUS
            ]
        ], 200);
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error("Verify payment error for NO_NOTA_PENJUALAN: {$noNota}: " . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Gagal memperbarui status transaksi: ' . $e->getMessage()
        ], 500);
    }
}

public function indexForCourier(Request $request)
{
    try {
        $courierId = auth('pegawai')->user()->ID_PEGAWAI;
        Log::info("Fetching transactions for courier ID: {$courierId}");

        $transactions = TransaksiPenjualan::where('ID_PEGAWAI_KURIR', $courierId)
            ->select(
                'ID_PENJUALAN',
                'NO_NOTA_PENJUALAN',
                'STATUS',
                'TANGGAL_PESANAN',
                'TANGGAL_SIAP',
                'ID_PEGAWAI_KURIR'
            )
            ->get()
            ->map(function ($transaction) {
                return [
                    'id_penjualan' => $transaction->ID_PENJUALAN,
                    'no_nota' => $transaction->NO_NOTA_PENJUALAN,
                    'status' => $transaction->STATUS,
                    'tanggal_transaksi' => $transaction->TANGGAL_PESANAN->timezone('Asia/Jakarta')->format('Y-m-d H:i:s'),
                    'tanggal_siap' => $transaction->TANGGAL_SIAP ? $transaction->TANGGAL_SIAP->timezone('Asia/Jakarta')->format('Y-m-d H:i:s') : null,
                    'id_pegawai_kurir' => $transaction->ID_PEGAWAI_KURIR,
                ];
            });

        Log::info("Transactions fetched for courier: " . json_encode($transactions));

        return response()->json([
            'success' => true,
            'data' => $transactions
        ], 200);
    } catch (\Exception $e) {
        Log::error("Failed to fetch transactions for courier: " . $e->getMessage() . "\nStack Trace: " . $e->getTraceAsString());
        return response()->json([
            'success' => false,
            'message' => 'Failed to fetch transactions: ' . $e->getMessage()
        ], 500);
    }
}

    public function showForCourier($noNota)
{
    try {
        $courierId = auth('pegawai')->user()->ID_PEGAWAI;
        Log::info("Fetching transaction details for courier ID: {$courierId}, NO_NOTA_PENJUALAN: {$noNota}");

        $transaction = TransaksiPenjualan::where('NO_NOTA_PENJUALAN', $noNota)
            ->where('ID_PEGAWAI_KURIR', $courierId)
            ->with([
                'pembeli' => function ($query) {
                    $query->select('ID_PEMBELI', 'NAMA', 'EMAIL')->where('STATUS', 'active');
                },
                'barangTitipan' => function ($query) {
                    $query->select(
                        'barangtitipans.ID_PENJUALAN',
                        'barangtitipans.KODE_PRODUK',
                        'barangtitipans.NAMA as product_name',
                        'barangtitipans.HARGA_JUAL as product_price'
                    )
                    ->leftJoin('foto_produk', function ($join) {
                        $join->on('barangtitipans.KODE_PRODUK', '=', 'foto_produk.KODE_PRODUK')
                             ->where('foto_produk.IS_UTAMA', true);
                    })
                    ->selectRaw('foto_produk.URL_FOTO as main_photo');
                }
            ])
            ->select(
                'ID_PENJUALAN',
                'NO_NOTA_PENJUALAN',
                'TOTAL_AKHIR',
                'TANGGAL_PESANAN',
                'TANGGAL_SIAP',
                'STATUS',
                'ALAMAT_PENGIRIMAN',
                'ID_PEMBELI',
                'METODE_PENGIRIMAN'
            )
            ->firstOrFail();

        $products = $transaction->barangTitipan->map(function ($item) {
            return [
                'product_id' => $item->KODE_PRODUK,
                'nama_barang' => $item->product_name,
                'harga_barang' => 'Rp' . number_format($item->product_price, 0, ',', '.'),
                'image' => $item->main_photo ? url("/products/{$item->KODE_PRODUK}/thumbnail") : '/api/placeholder/60/60',
            ];
        })->toArray();

        $response = [
            'no_nota' => $transaction->NO_NOTA_PENJUALAN,
            'status' => $transaction->STATUS,
            'products' => $products,
            'total_akhir' => 'Rp' . number_format($transaction->TOTAL_AKHIR, 0, ',', '.'),
            'tanggal_transaksi' => $transaction->TANGGAL_PESANAN->timezone('Asia/Jakarta')->format('Y-m-d H:i:s'),
            'tanggal_siap' => $transaction->TANGGAL_SIAP ? $transaction->TANGGAL_SIAP->timezone('Asia/Jakarta')->format('Y-m-d H:i:s') : null,
            'nama_pembeli' => $transaction->pembeli ? $transaction->pembeli->NAMA : '-',
            'alamat' => $transaction->ALAMAT_PENGIRIMAN ?? '-',
            'metode_pengiriman' => $transaction->METODE_PENGIRIMAN ?? '-',
        ];

        Log::info("Transaction details fetched for courier: " . json_encode($response));

        return response()->json([
            'success' => true,
            'data' => $response
        ], 200);
    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        Log::error("Transaction not found for NO_NOTA_PENJUALAN: {$noNota}");
        return response()->json([
            'success' => false,
            'message' => 'Transaksi tidak ditemukan atau Anda tidak memiliki akses.'
        ], 404);
    } catch (\Exception $e) {
        Log::error("Failed to fetch transaction details for courier: " . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Gagal mengambil detail transaksi: ' . $e->getMessage()
        ], 500);
    }
}

public function updateStatusForCourier(Request $request, $id)
{
    Log::info("Attempting to update status for ID_PENJUALAN: {$id}", $request->all());

    $request->validate([
        'STATUS' => 'required|string|in:Sedang Dikirim,Sudah Diterima'
    ]);

    $courierId = auth('pegawai')->user()->ID_PEGAWAI;
    Log::info("Courier ID: {$courierId}");

    DB::beginTransaction();
    try {
        $transaction = TransaksiPenjualan::where('ID_PENJUALAN', $id)
            ->where('ID_PEGAWAI_KURIR', $courierId)
            ->firstOrFail();

        $oldStatus = $transaction->STATUS;
        $newStatus = $request->STATUS;

        // Validate status transition
        if ($oldStatus === 'Sudah Diterima') {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi sudah dalam status Sudah Diterima.'
            ], 400);
        }
        if ($newStatus === 'Sedang Dikirim' && $oldStatus !== 'Siap Dikirim') {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi harus dalam status Siap Dikirim untuk diubah ke Sedang Dikirim.'
            ], 400);
        }
        if ($newStatus === 'Sudah Diterima' && $oldStatus !== 'Sedang Dikirim') {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi harus dalam status Sedang Dikirim untuk diubah ke Sudah Diterima.'
            ], 400);
        }

        $transaction->STATUS = $newStatus;
        $transaction->save();

        // Apply POIN_DIPEROLEH to Pembeli.POIN_LOYALITAS when status changes to Sudah Diterima
        if ($newStatus === 'Sudah Diterima' && $transaction->POIN_DIPEROLEH > 0) {
            $pembeli = Pembeli::findOrFail($transaction->ID_PEMBELI);
            $pembeli->POIN_LOYALITAS += $transaction->POIN_DIPEROLEH;
            $pembeli->save();
            Log::info("Added {$transaction->POIN_DIPEROLEH} points to pembeli ID: {$transaction->ID_PEMBELI} for transaction ID: {$id}");
        }

        DB::commit();
        Log::info("Status updated successfully for ID_PENJUALAN: {$id}, New Status: {$newStatus}");

        return response()->json([
            'success' => true,
            'message' => 'Status transaksi berhasil diperbarui.',
            'data' => [
                'status' => $transaction->STATUS
            ]
        ], 200);
    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        DB::rollBack();
        Log::error("Transaction not found for ID_PENJUALAN: {$id} or not accessible by courier ID: {$courierId}");
        return response()->json([
            'success' => false,
            'message' => 'Transaksi tidak ditemukan atau Anda tidak memiliki akses.'
        ], 404);
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error("Update status error for ID_PENJUALAN: {$id}: " . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Gagal memperbarui status transaksi: ' . $e->getMessage()
        ], 500);
    }
}
}