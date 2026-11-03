<?php

namespace App\Http\Controllers;

use App\Models\BarangTitipan;
use App\Models\Donasi; // Added missing use statement
use App\Models\RequestDonasi;
use App\Models\Organisasi;
use App\Models\TransaksiPenjualan;
use App\Models\Penitip;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LaporanController extends Controller
{
    public function getMonthlySales(Request $request)
    {
        try {
            $year = $request->query('year', now()->year);
            Log::info("Fetching monthly sales data for year: {$year}");

            $months = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ];

            $salesData = TransaksiPenjualan::select(
                DB::raw('MONTH(TANGGAL_PEMBAYARAN) as month'),
                DB::raw('SUM(TOTAL_BIAYA) as total_biaya'),
                DB::raw('COUNT(ID_PENJUALAN) as total_transaksi')
            )
            ->whereNotNull('TANGGAL_PEMBAYARAN')
            ->whereIn('STATUS', ['Sudah Diambil', 'Sudah Dikirim', 'Sedang Dikemas', 'Sudah Diterima', 'Siap Dikirim'])
            ->whereYear('TANGGAL_PEMBAYARAN', $year)
            ->groupBy(DB::raw('MONTH(TANGGAL_PEMBAYARAN)'))
            ->orderBy('month')
            ->get()
            ->map(function ($item) use ($months) {
                return [
                    'bulan' => $months[$item->month - 1],
                    'total_biaya' => (int)$item->total_biaya,
                    'total_transaksi' => (int)$item->total_transaksi,
                ];
            });

            // Fill in missing months with zero values
            $result = [];
            for ($i = 1; $i <= 12; $i++) {
                $monthData = $salesData->firstWhere('bulan', $months[$i - 1]);
                $result[] = $monthData ?: [
                    'bulan' => $months[$i - 1],
                    'total_biaya' => 0,
                    'total_transaksi' => 0,
                ];
            }

            Log::info("Monthly sales data fetched: " . json_encode($result));

            return response()->json([
                'success' => true,
                'data' => $result
            ], 200);
        } catch (\Exception $e) {
            Log::error("Failed to fetch monthly sales data: " . $e->getMessage() . "\nStack Trace: " . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data penjualan bulanan: ' . $e->getMessage()
            ], 500);
        }
    }
    public function komisiBulananPerProduk(Request $request)
    {
        try {
            $year = $request->query('year', now()->year);
            $month = $request->query('month', now()->month);
            Log::info("Fetching monthly commission data for year: {$year}, month: {$month}");

            $months = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ];

            $commissionData = TransaksiPenjualan::select(
                'barangtitipans.KODE_PRODUK',
                'barangtitipans.NAMA as product_name',
                'barangtitipans.HARGA_JUAL as product_price',
                DB::raw('komisis.KOMISI_PENITIP as komisi_penitip'),
                DB::raw('komisis.KOMISI_HUNTER as komisi_hunter'),
                DB::raw('komisis.KOMISI_REUSEMART as komisi_reusemart'),
                DB::raw('komisis.BONUS as bonus'),
                'transaksipenitipans.TANGGAL_PENITIPAN as tanggal_masuk',
                'transaksipenjualans.TANGGAL_PEMBAYARAN as tanggal_laku'
            )
            ->join('barangtitipans', 'transaksipenjualans.ID_PENJUALAN', '=', 'barangtitipans.ID_PENJUALAN')
            ->join('transaksipenitipans', 'barangtitipans.ID_PENITIPAN', '=', 'transaksipenitipans.ID_PENITIPAN')
            ->join('komisis', 'barangtitipans.KODE_PRODUK', '=', 'komisis.KODE_PRODUK')
            ->whereMonth('transaksipenitipans.TANGGAL_PENITIPAN', $month)
            ->whereYear('transaksipenitipans.TANGGAL_PENITIPAN', $year)
            ->whereIn('transaksipenjualans.STATUS', ['Sudah Diambil', 'Sudah Diterima', 'Selesai', 'Siap Dikirim', 'Sudah Diterima'])
            ->get()
            ->map(function ($item) use ($months) {
                // Safely handle date formatting
                $tanggalMasuk = $item->tanggal_masuk instanceof Carbon
                    ? $item->tanggal_masuk->format('d/m/Y')
                    : (is_string($item->tanggal_masuk) ? Carbon::parse($item->tanggal_masuk)->format('d/m/Y') : '-');
                $tanggalLaku = $item->tanggal_laku instanceof Carbon
                    ? $item->tanggal_laku->format('d/m/Y')
                    : (is_string($item->tanggal_laku) ? Carbon::parse($item->tanggal_laku)->format('d/m/Y') : '-');

                $komisiPenitip = $item->komisi_penitip ?: (int)($item->product_price * 0.10); // 10% default
                $komisiHunter = $item->komisi_hunter ?: (int)($item->product_price * 0.05); // 5% default
                $komisiReuseMart = $item->komisi_reusemart ?: (int)($item->product_price * 0.40); // 40% default
                $bonus = $item->bonus ?: (int)($item->product_price * 0.30); // 30% default if hunter O

                return [
                    'kode_produk' => $item->KODE_PRODUK,
                    'nama_produk' => $item->product_name,
                    'harga_jual' => $item->product_price,
                    'tanggal_masuk' => $tanggalMasuk,
                    'tanggal_laku' => $tanggalLaku,
                    'komisi_penitip' => $komisiPenitip,
                    'komisi_hunter' => $komisiHunter,
                    'komisi_reusemart' => $komisiReuseMart,
                    'bonus' => $bonus,
                    'subtotal' => $komisiPenitip + $bonus,
                ];
            });

            $totalKomisiPenitip = $commissionData->sum('komisi_penitip');
            $totalKomisiHunter = $commissionData->sum('komisi_hunter');
            $totalKomisiReuseMart = $commissionData->sum('komisi_reusemart');
            $totalBonus = $commissionData->sum('bonus');
            $totalSubtotal = $commissionData->sum('subtotal');

            $result = [
                'bulan' => $months[$month - 1],
                'tahun' => $year,
                'data' => $commissionData,
                'totals' => [
                    'komisi_penitip' => $totalKomisiPenitip,
                    'komisi_hunter' => $totalKomisiHunter,
                    'komisi_reusemart' => $totalKomisiReuseMart,
                    'bonus' => $totalBonus,
                    'subtotal' => $totalSubtotal,
                ],
            ];

            Log::info("Monthly commission data fetched: " . json_encode($result));
            return response()->json(['success' => true, 'data' => $result], 200);
        } catch (\Exception $e) {
            Log::error("Failed to fetch monthly commission data: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data komisi bulanan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function stokGudang(Request $request)
{
    try {
        $today = Carbon::now()->toDateString();
        $page = $request->query('page', 1);
        Log::info("Fetching warehouse stock report up to date: {$today}, page: {$page}");

        $stockQuery = BarangTitipan::select(
            'barangtitipans.KODE_PRODUK as kode_produk',
            'barangtitipans.NAMA as nama_produk',
            'penitips.ID_PENITIP as id_penitip',
            'penitips.NAMA as nama_penitip',
            'transaksipenitipans.TANGGAL_PENITIPAN as tanggal_masuk',
            'barangtitipans.TANGGAL_PERPANJANGAN as perpanjangan',
            'pegawais.ID_PEGAWAI as id_hunter',
            'pegawais.NAMA as nama_hunter',
            'barangtitipans.HARGA_JUAL as harga'
        )
        ->join('transaksipenitipans', 'barangtitipans.ID_PENITIPAN', '=', 'transaksipenitipans.ID_PENITIPAN')
        ->join('penitips', 'transaksipenitipans.ID_PENITIP', '=', 'penitips.ID_PENITIP')
        ->leftJoin('pegawais', 'transaksipenitipans.ID_PEGAWAI_HUNTER', '=', 'pegawais.ID_PEGAWAI')
        ->where('barangtitipans.STATUS', 'Tersedia')
        ->whereDate('transaksipenitipans.TANGGAL_PENITIPAN', '<=', $today);


        // ->whereIn('barangtitipans.STATUS', ['Tersedia', 'Kadaluarsa', 'Hangus', 'Didonasikan'])
        $stockData = $stockQuery->paginate(15, ['*'], 'page', $page);

        $stockData->getCollection()->transform(function ($item) {
            return [
                'kode_produk' => $item->kode_produk,
                'nama_produk' => $item->nama_produk,
                'id_penitip' => $item->id_penitip,
                'nama_penitip' => $item->nama_penitip,
                'tanggal_masuk' => $item->tanggal_masuk ? Carbon::parse($item->tanggal_masuk)->format('d/m/Y') : '-',
                'perpanjangan' => $item->perpanjangan ? Carbon::parse($item->perpanjangan)->format('d/m/Y') : 'Tidak',
                'id_hunter' => $item->id_hunter ?? '-',
                'nama_hunter' => $item->nama_hunter ?? '-',
                'harga' => $item->harga,
            ];
        });

        $result = [
            'tanggal_cetak' => $today,
            'data' => $stockData->items(),
            'pagination' => [
                'current_page' => $stockData->currentPage(),
                'last_page' => $stockData->lastPage(),
                'per_page' => $stockData->perPage(),
                'total' => $stockData->total(),
            ],
        ];

        Log::info("Warehouse stock report fetched: " . json_encode($result));
        return response()->json(['success' => true, 'data' => $result], 200);
    } catch (\Exception $e) {
        Log::error("Failed to fetch warehouse stock report: " . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Gagal mengambil data stok gudang: ' . $e->getMessage()
        ], 500);
    }
}

public function penjualanPerKategori(Request $request)
{
    try {
        $year = $request->query('year', now()->year);
        Log::info("Fetching sales report per category for year: {$year}");

        $startDate = Carbon::create($year, 1, 1)->toDateString();
        $endDate = Carbon::create($year, 12, 31)->toDateString();

        // Total items sold (successful transactions)
        $soldItems = TransaksiPenjualan::select(
            'kategoris.NAMA as category_name',
            DB::raw('COUNT(*) as total_sold')
        )
        ->join('barangtitipans', 'transaksipenjualans.ID_PENJUALAN', '=', 'barangtitipans.ID_PENJUALAN')
        ->join('subkategoris', 'barangtitipans.ID_SUBKATEGORI', '=', 'subkategoris.ID_SUBKATEGORI')
        ->join('kategoris', 'subkategoris.ID_KATEGORI', '=', 'kategoris.ID_KATEGORI')
        ->whereIn('transaksipenjualans.STATUS', ['Sudah Diambil', 'Sudah Diterima', 'Siap Dikirim', 'Sudah Dikirim'])
        ->whereBetween('transaksipenjualans.TANGGAL_PEMBAYARAN', [$startDate, $endDate])
        ->groupBy('kategoris.NAMA')
        ->get()
        ->pluck('total_sold', 'category_name')
        ->toArray();

        // Total items that failed to sell
        $failedItems = BarangTitipan::select(
            'kategoris.NAMA as category_name',
            DB::raw('COUNT(*) as total_failed')
        )
        ->join('subkategoris', 'barangtitipans.ID_SUBKATEGORI', '=', 'subkategoris.ID_SUBKATEGORI')
        ->join('kategoris', 'subkategoris.ID_KATEGORI', '=', 'kategoris.ID_KATEGORI')
        ->leftJoin('transaksipenitipans', 'barangtitipans.ID_PENITIPAN', '=', 'transaksipenitipans.ID_PENITIPAN')
        ->leftJoin('transaksipenjualans', 'barangtitipans.ID_PENJUALAN', '=', 'transaksipenjualans.ID_PENJUALAN')
        ->whereIn('barangtitipans.STATUS', ['Telah Didonasikan', 'Didonasikan', 'Kadaluarsa', 'Hangus'])
        ->whereBetween('transaksipenitipans.TANGGAL_PENITIPAN', [$startDate, $endDate])
        ->where(function ($query) use ($startDate, $endDate) {
            $query->whereNull('transaksipenjualans.ID_PENJUALAN')
                  ->orWhere(function ($subQuery) use ($startDate, $endDate) {
                      $subQuery->whereNotIn('transaksipenjualans.STATUS', ['Sudah Diambil', 'Sudah Diterima'])
                               ->whereBetween('transaksipenjualans.TANGGAL_PEMBAYARAN', [$startDate, $endDate]);
                  });
        })
        ->groupBy('kategoris.NAMA')
        ->get()
        ->pluck('total_failed', 'category_name')
        ->toArray();

        $categories = [
            'Elektronik & Gadget',
            'Pakaian & Aksesori',
            'Perabotan Rumah Tangga',
            'Buku, Alat Tulis, & Peralatan Sekolah',
            'Hobi, Mainan, & Koleksi',
            'Perlengkapan Bayi & Anak',
            'Otomotif & Aksesori',
            'Perlengkapan Taman & Outdoor',
            'Peralatan Kantor & Industri',
            'Kosmetik & Perawatan Diri'
        ];

        $result = [
            'tahun' => $year,
            'tanggal_cetak' => Carbon::now()->toDateString(),
            'data' => array_map(function ($category) use ($soldItems, $failedItems) {
                return [
                    'kategori' => $category,
                    'jumlah_item_terjual' => $soldItems[$category] ?? 0,
                    'jumlah_item_gagal_terjual' => $failedItems[$category] ?? 0,
                ];
            }, $categories),
        ];

        Log::info("Sales report per category fetched: " . json_encode($result));
        return response()->json(['success' => true, 'data' => $result], 200);
    } catch (\Exception $e) {
        Log::error("Failed to fetch sales report per category: " . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Gagal mengambil data laporan penjualan per kategori: ' . $e->getMessage()
        ], 500);
    }
}

    public function penitipanSudahHabis(Request $request)
{
    try {
        $today = Carbon::now()->toDateString(); // Current date: 2025-06-07
        $tanggalCetak = Carbon::now()->format('d M Y'); // Format: 07 Jun 2025
        Log::info("Fetching report of expired consignment items up to date: {$today}");

        $expiredItems = BarangTitipan::select(
            'barangtitipans.KODE_PRODUK as kode_produk',
            'barangtitipans.NAMA as nama_produk',
            'penitips.ID_PENITIP as id_penitip',
            'penitips.NAMA as nama_penitip',
            'transaksipenitipans.TANGGAL_PENITIPAN as tanggal_masuk',
            'barangtitipans.TANGGAL_KADALUARSA as tanggal_akhir',
            DB::raw("COALESCE(DATE_ADD(barangtitipans.TANGGAL_KADALUARSA, INTERVAL 7 DAY), NULL) as batas_ambil")
        )
        ->join('transaksipenitipans', 'barangtitipans.ID_PENITIPAN', '=', 'transaksipenitipans.ID_PENITIPAN')
        ->join('penitips', 'transaksipenitipans.ID_PENITIP', '=', 'penitips.ID_PENITIP')
        ->whereNotNull('barangtitipans.TANGGAL_KADALUARSA') // Ensure TANGGAL_KADALUARSA is not null
        ->where('barangtitipans.TANGGAL_KADALUARSA', '<=', $today)
        ->whereNotIn('barangtitipans.STATUS', ['Dikembalikan', 'Didonasikan', 'Telah Didonasikan', 'Terjual', 'Hangus']) // Exclude already handled statuses
        ->get()
        ->map(function ($item) {
            try {
                return [
                    'kode_produk' => $item->kode_produk ?? '-',
                    'nama_produk' => $item->nama_produk ?? '-',
                    'id_penitip' => $item->id_penitip ?? '-',
                    'nama_penitip' => $item->nama_penitip ?? '-',
                    'tanggal_masuk' => $item->tanggal_masuk ? Carbon::parse($item->tanggal_masuk)->format('d/m/Y') : '-',
                    'tanggal_akhir' => $item->tanggal_akhir ? Carbon::parse($item->tanggal_akhir)->format('d/m/Y') : '-',
                    'batas_ambil' => $item->batas_ambil ? Carbon::parse($item->batas_ambil)->format('d/m/Y') : '-',
                ];
            } catch (\Exception $e) {
                Log::warning("Error parsing item data: " . $e->getMessage() . ", Item: " . json_encode($item));
                return [
                    'kode_produk' => $item->kode_produk ?? '-',
                    'nama_produk' => $item->nama_produk ?? '-',
                    'id_penitip' => $item->id_penitip ?? '-',
                    'nama_penitip' => $item->nama_penitip ?? '-',
                    'tanggal_masuk' => '-',
                    'tanggal_akhir' => '-',
                    'batas_ambil' => '-',
                ];
            }
        });

        $result = [
            'tanggal_cetak' => $tanggalCetak,
            'data' => $expiredItems,
        ];

        Log::info("Expired consignment report fetched: " . json_encode($result));
        return response()->json(['success' => true, 'data' => $result], 200);
    } catch (\Exception $e) {
        Log::error("Gagal mengambil laporan barang titipan yang telah kedaluwarsa: " . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Terjadi kesalahan saat mengambil data laporan barang dengan masa penitipan habis. Pesan kesalahan: ' . $e->getMessage(),
        ], 500);
    }
}

public function laporanDonasi(Request $request)
{
    try {
        $year = $request->query('year', now()->year);
        $tanggalCetak = Carbon::now()->format('d M Y');
        Log::info("Fetching donation report for year: {$year}");

        $donations = Donasi::select(
            'donasis.KODE_PRODUK as kode_produk',
            'barangtitipans.NAMA as nama_produk',
            'penitips.ID_PENITIP as id_penitip',
            'penitips.NAMA as nama_penitip',
            'donasis.TANGGAL_DONASI as tanggal_donasi',
            'organisasis.NAMA as organisasi',
            'donasis.NAMA_PENERIMA as nama_penerima'
        )
        ->join('barangtitipans', 'donasis.KODE_PRODUK', '=', 'barangtitipans.KODE_PRODUK')
        ->join('transaksipenitipans', 'barangtitipans.ID_PENITIPAN', '=', 'transaksipenitipans.ID_PENITIPAN')
        ->join('penitips', 'transaksipenitipans.ID_PENITIP', '=', 'penitips.ID_PENITIP')
        ->join('requestdonasis', 'donasis.ID_REQUEST', '=', 'requestdonasis.ID_REQUEST')
        ->join('organisasis', 'requestdonasis.ID_ORGANISASI', '=', 'organisasis.ID_ORGANISASI')
        ->whereYear('donasis.TANGGAL_DONASI', $year)
        ->whereNotNull('donasis.TANGGAL_DONASI')
        ->get()
        ->map(function ($item) {
            return [
                'kode_produk' => $item->kode_produk ?? '-',
                'nama_produk' => $item->nama_produk ?? '-',
                'id_penitip' => $item->id_penitip ?? '-',
                'nama_penitip' => $item->nama_penitip ?? '-',
                'tanggal_donasi' => $item->tanggal_donasi ? Carbon::parse($item->tanggal_donasi)->format('d/m/Y') : '-',
                'organisasi' => $item->organisasi ?? '-',
                'nama_penerima' => $item->nama_penerima ?? '-',
            ];
        });

        $result = [
            'tahun' => $year,
            'tanggal_cetak' => $tanggalCetak,
            'data' => $donations,
        ];

        Log::info("Donation report fetched: " . json_encode($result));
        return response()->json(['success' => true, 'data' => $result], 200);
    } catch (\Exception $e) {
        Log::error("Gagal mengambil laporan donasi barang: " . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Terjadi kesalahan saat mengambil data laporan donasi barang. Pesan kesalahan: ' . $e->getMessage(),
        ], 500);
    }
}

public function requestDonasiBelumTerpenuhi(Request $request)
{
    try {
        $tanggalCetak = Carbon::now()->format('d M Y');
        Log::info("Fetching report of unfulfilled donation requests, Tanggal cetak: {$tanggalCetak}");

        $unfulfilledRequests = RequestDonasi::select(
            'requestdonasis.ID_ORGANISASI as id_organisasi',
            'organisasis.NAMA as nama_organisasi',
            'organisasis.ALAMAT as alamat',
            'requestdonasis.DESKRIPSI_PERMINTAAN as request' // Changed from REQUEST to DESKRIPSI_PERMINTAAN
        )
        ->join('organisasis', 'requestdonasis.ID_ORGANISASI', '=', 'organisasis.ID_ORGANISASI')
        ->whereNotIn('requestdonasis.ID_REQUEST', function ($query) {
            $query->select('ID_REQUEST')
                  ->from('donasis')
                  ->whereNotNull('TANGGAL_DONASI');
        }) // Exclude fulfilled requests
        ->get()
        ->map(function ($item) {
            return [
                'id_organisasi' => $item->id_organisasi ?? '-',
                'nama_organisasi' => $item->nama_organisasi ?? '-',
                'alamat' => $item->alamat ?? '-',
                'request' => $item->request ?? '-',
            ];
        });

        $result = [
            'tanggal_cetak' => $tanggalCetak,
            'data' => $unfulfilledRequests,
        ];

        Log::info("Unfulfilled donation request report fetched: " . json_encode($result));
        return response()->json(['success' => true, 'data' => $result], 200);
    } catch (\Exception $e) {
        Log::error("Gagal mengambil laporan request donasi belum terpenuhi : " . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Terjadi kesalahan saat mengambil data laporan request donasi belum terpenuhi. Pesan kesalahan: ' . $e->getMessage(),
        ], 500);
    }
}

public function getPenitipTransactionReport(Request $request)
    {
        try {
            $year = $request->query('year', now()->year);
            $month = $request->query('month', now()->month);
            $search = $request->query('search', ''); // Search term for ID_PENITIP or NAMA
            Log::info("Fetching penitip transaction report: year={$year}, month={$month}, search={$search}");

            $months = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ];

            $query = TransaksiPenjualan::select(
                'barangtitipans.KODE_PRODUK',
                'barangtitipans.NAMA as nama_produk',
                'penitips.ID_PENITIP as id_penitip',
                'penitips.NAMA as nama_penitip',
                'barangtitipans.HARGA_JUAL as harga_jual',
                DB::raw('komisis.KOMISI_PENITIP as komisi_penitip'),
                DB::raw('komisis.BONUS as bonus'),
                'transaksipenitipans.TANGGAL_PENITIPAN as tanggal_penitipan',
                'transaksipenjualans.TANGGAL_PEMBAYARAN as tanggal_pembayaran'
            )
            ->join('barangtitipans', 'transaksipenjualans.ID_PENJUALAN', '=', 'barangtitipans.ID_PENJUALAN')
            ->join('transaksipenitipans', 'barangtitipans.ID_PENITIPAN', '=', 'transaksipenitipans.ID_PENITIPAN')
            ->join('penitips', 'transaksipenitipans.ID_PENITIP', '=', 'penitips.ID_PENITIP')
            ->join('komisis', 'barangtitipans.KODE_PRODUK', '=', 'komisis.KODE_PRODUK')
            ->whereMonth('transaksipenjualans.TANGGAL_PEMBAYARAN', $month)
            ->whereYear('transaksipenjualans.TANGGAL_PEMBAYARAN', $year)
            ->whereIn('transaksipenjualans.STATUS', ['Sudah Diterima', 'Sudah Diambil']);

            // Apply search filter if provided
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('penitips.ID_PENITIP', 'like', "%{$search}%")
                      ->orWhere('penitips.NAMA', 'like', "%{$search}%");
                });
            }

            $transactionData = $query->get()->map(function ($item) use ($months) {
                $tanggalPenitipan = $item->tanggal_penitipan instanceof Carbon
                    ? $item->tanggal_penitipan->format('d/m/Y')
                    : (is_string($item->tanggal_penitipan) ? Carbon::parse($item->tanggal_penitipan)->format('d/m/Y') : '-');
                $tanggalPembayaran = $item->tanggal_pembayaran instanceof Carbon
                    ? $item->tanggal_pembayaran->format('d/m/Y H:i:s')
                    : (is_string($item->tanggal_pembayaran) ? Carbon::parse($item->tanggal_pembayaran)->format('d/m/Y H:i:s') : '-');

                $komisiPenitip = $item->komisi_penitip ?: (int)($item->harga_jual * 0.10); // 10% default
                $bonus = $item->bonus ?: 0; // Default to 0 if no bonus

                return [
                    'kode_produk' => $item->KODE_PRODUK,
                    'nama_produk' => $item->nama_produk,
                    'id_penitip' => $item->id_penitip,
                    'nama_penitip' => $item->nama_penitip,
                    'harga_jual' => $item->harga_jual,
                    'komisi_penitip' => $komisiPenitip,
                    'bonus' => $bonus,
                    'total_pendapatan' => $komisiPenitip + $bonus,
                    'tanggal_penitipan' => $tanggalPenitipan,
                    'tanggal_pembayaran' => $tanggalPembayaran,
                ];
            });

            // Aggregate by penitip
            $penitipData = $transactionData->groupBy('id_penitip')->map(function ($items, $idPenitip) {
                return [
                    'id_penitip' => $idPenitip,
                    'nama_penitip' => $items->first()['nama_penitip'],
                    'items' => $items->toArray(),
                    'total_komisi' => $items->sum('komisi_penitip'),
                    'total_bonus' => $items->sum('bonus'),
                    'total_pendapatan' => $items->sum('total_pendapatan'),
                ];
            })->values();

            $result = [
                'bulan' => $months[$month - 1],
                'tahun' => $year,
                'sold_items' => $transactionData->toArray(),
                'penitip_data' => $penitipData,
            ];

            Log::info("Penitip transaction report fetched: " . json_encode($result));
            return response()->json(['success' => true, 'data' => $result], 200);
        } catch (\Exception $e) {
            Log::error("Failed to fetch penitip transaction report: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data laporan transaksi: ' . $e->getMessage(),
            ], 500);
        }
    }
}