<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PegawaiController;
use App\Http\Controllers\JabatanController;
use App\Http\Controllers\OrganisasiController;
use App\Http\Controllers\MerchandiseController;
use App\Http\Controllers\PenitipController;
use App\Http\Controllers\WishlistController;
use App\Http\Controllers\TransaksiPenjualanController;
use App\Http\Controllers\TransaksiPenitipanController;
use App\Http\Controllers\DiskusiController;
use App\Http\Controllers\AlamatController;
use App\Http\Controllers\DonasiController;
use App\Http\Controllers\BarangTitipanController;
use App\Http\Controllers\RequestDonasiController;
use App\Http\Controllers\PembeliController;
use App\Http\Controllers\KategoriController;
use App\Http\Controllers\SubkategoriController;
use App\Http\Controllers\KomisiController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\PenukaranController;
use App\Http\Controllers\FotoProdukController;
use App\Http\Controllers\ApiLogController;

// Auth Routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/verify-otp', [AuthController::class, 'verifyOtpAndLogin'])->middleware('throttle:5,1');
    Route::post('/forgot-password-gabungan', [AuthController::class, 'forgotPasswordGabungan'])->middleware('throttle:3,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,10');
    Route::post('/register/pembeli', [AuthController::class, 'registerPembeli'])->middleware('throttle:5,10');
    Route::post('/register/organisasi', [AuthController::class, 'registerOrganisasi'])->middleware('throttle:5,10');

    Route::middleware(['auth:pegawai,pembeli,organisasi,penitip'])->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/profile', [AuthController::class, 'profile']);
        Route::post('/update-fcm-token', [AuthController::class, 'updateFcmToken']);
    });
});

// Public Routes for Catalogue (accessible by guest, pembeli, penitip)
Route::get('/categories', [KategoriController::class, 'index']);
Route::get('/categories/{id}', [KategoriController::class, 'show']);
Route::get('/subcategories', [SubkategoriController::class, 'index']);
Route::get('/categories/{id}/subcategories', [KategoriController::class, 'getSubcategories']);
Route::get('/products', [BarangTitipanController::class, 'getProducts']);
Route::get('/products/mobile', [BarangTitipanController::class, 'getProductsMobile']);
Route::get('/products/{kode_produk}', [BarangTitipanController::class, 'getProductById']);
Route::get('/products/mobile/{kode_produk}', [BarangTitipanController::class, 'getProductByIdMobile']);
Route::get('/diskusi', [DiskusiController::class, 'index']);
Route::get('/subcategories/{id}', [SubkategoriController::class, 'show']);

// Shared Routes for Pembeli and Penitip
Route::middleware(['auth:pembeli,penitip'])->group(function () {
    Route::get('/merchandise', [MerchandiseController::class, 'index']);
    Route::get('/penukaran', [PenukaranController::class, 'index']);
    Route::post('/penukaran', [PenukaranController::class, 'store']);
});

// // Route ADMIN Only
// Route::prefix('admin')->middleware(['auth:pegawai', 'role:admin', 'can:manage-pegawai', 'can:manage-jabatan', 'can:manage-organisasi', 'can:manage-merchandise'])->group(function () {
//     Route::get('/manage-pegawai', [PegawaiController::class, 'index']);
//     Route::post('/manage-pegawai', [PegawaiController::class, 'store']);
//     Route::get('/manage-pegawai/{id}', [PegawaiController::class, 'show']);
//     Route::put('/manage-pegawai/{id}', [PegawaiController::class, 'update']);
//     Route::delete('/manage-pegawai/{id}', [PegawaiController::class, 'destroy']);
//     Route::get('/manage-jabatan', [JabatanController::class, 'index']);
//     Route::post('/manage-jabatan', [JabatanController::class, 'store']);
//     Route::get('/manage-jabatan/{id}', [JabatanController::class, 'show']);
//     Route::put('/manage-jabatan/{id}', [JabatanController::class, 'update']);
//     Route::delete('/manage-jabatan/{id}', [JabatanController::class, 'destroy']);
//     Route::get('/manage-organisasi', [OrganisasiController::class, 'index']);
//     Route::post('/manage-organisasi', [OrganisasiController::class, 'store']);
//     Route::get('/manage-organisasi/search', [OrganisasiController::class, 'search']);
//     Route::get('/manage-organisasi/{id}', [OrganisasiController::class, 'show']);
//     Route::put('/manage-organisasi/{id}', [OrganisasiController::class, 'update']);
//     Route::delete('/manage-organisasi/{id}', [OrganisasiController::class, 'destroy']);
//     Route::get('/manage-merchandise', [MerchandiseController::class, 'index']);
//     Route::post('/manage-merchandise', [MerchandiseController::class, 'store']);
//     Route::get('/manage-merchandise/{id}', [MerchandiseController::class, 'show']);
//     Route::put('/manage-merchandise/{id}', [MerchandiseController::class, 'update']);
//     Route::delete('/manage-merchandise/{id}', [MerchandiseController::class, 'destroy']);
//     Route::get('/monitoring-logs', [ApiLogController::class, 'getLogs']);
//     Route::get('/monitoring-logs/download', [ApiLogController::class, 'downloadLogsPdf']);
// });

// Admin & Admin Biasa Routes
Route::prefix('admin')->middleware(['auth:pegawai', 'role:admin|adminbiasa'])->group(function () {
    // Rute yang bisa diakses oleh 'admin' DAN 'adminbiasa'
    Route::get('/manage-pegawai', [PegawaiController::class, 'index']);
    Route::post('/manage-pegawai', [PegawaiController::class, 'store']);
    Route::get('/manage-pegawai/{id}', [PegawaiController::class, 'show']);
    Route::put('/manage-pegawai/{id}', [PegawaiController::class, 'update']);
    Route::delete('/manage-pegawai/{id}', [PegawaiController::class, 'destroy']);
    
    Route::get('/manage-organisasi', [OrganisasiController::class, 'index']);
    Route::post('/manage-organisasi', [OrganisasiController::class, 'store']);
    // ... rute CRUDS lain yang diizinkan untuk keduanya
    Route::get('/manage-organisasi/search', [OrganisasiController::class, 'search']);
    Route::get('/manage-organisasi/{id}', [OrganisasiController::class, 'show']);
    Route::put('/manage-organisasi/{id}', [OrganisasiController::class, 'update']);
    Route::delete('/manage-organisasi/{id}', [OrganisasiController::class, 'destroy']);
    Route::get('/manage-merchandise', [MerchandiseController::class, 'index']);
    Route::post('/manage-merchandise', [MerchandiseController::class, 'store']);
    Route::get('/manage-merchandise/{id}', [MerchandiseController::class, 'show']);
    Route::put('/manage-merchandise/{id}', [MerchandiseController::class, 'update']);
    Route::delete('/manage-merchandise/{id}', [MerchandiseController::class, 'destroy']);
    Route::get('/manage-jabatan', [JabatanController::class, 'index']);
    Route::get('/manage-jabatan/{id}', [JabatanController::class, 'show']);

    // Rute yang HANYA bisa diakses oleh 'admin' (Super Admin)
    Route::middleware(['role:admin'])->group(function() {
        // Rute untuk monitoring
        Route::get('/monitoring-logs', [ApiLogController::class, 'getLogs']);
        Route::get('/monitoring-logs/download', [ApiLogController::class, 'downloadLogsPdf']);
        
        // Rute untuk CRUDS Jabatan
        
        Route::post('/manage-jabatan', [JabatanController::class, 'store']);
        Route::get('/manage-jabatan/{id}', [JabatanController::class, 'show']);
        Route::put('/manage-jabatan/{id}', [JabatanController::class, 'update']);
        Route::delete('/manage-jabatan/{id}', [JabatanController::class, 'destroy']);
    });
});

// Route CS Only
Route::prefix('cs')->middleware(['auth:pegawai', 'role:cs', 'can:manage-penitip'])->group(function () {
    Route::get('/manage-penitip', [PenitipController::class, 'index']);
    Route::post('/manage-penitip', [PenitipController::class, 'store']);
    Route::get('/manage-penitip/{id}', [PenitipController::class, 'show']);
    Route::put('/manage-penitip/{id}', [PenitipController::class, 'update']);
    Route::delete('/manage-penitip/{id}', [PenitipController::class, 'destroy']);
    Route::get('/product-discussions', [DiskusiController::class, 'getProductDiscussions']);
    Route::put('/product-discussions/{id}/reply', [DiskusiController::class, 'reply']);
    Route::get('/verifikasi-pembayaran', [TransaksiPenjualanController::class, 'indexForCS']);
    Route::post('/verifikasi-pembayaran/{noNota}', [TransaksiPenjualanController::class, 'verifyPayment'])->where('noNota', '[0-9]+\.[0-9]+\.[0-9]+');
    Route::get('/daftar-claim-merchandise', [PenukaranController::class, 'getAllClaims']);
    Route::post('/penukaran/{id}/claim', [PenukaranController::class, 'claim']);
    Route::post('/penukaran/{id}/mark-claimed', [PenukaranController::class, 'markAsClaimed']);
});

// Route Gudang Only
Route::prefix('gudang')->middleware(['auth:pegawai', 'role:gudang', 'can:manage-transaksi-penitipan'])->group(function () {
    Route::get('/manage-transaksi-penitipan', [TransaksiPenitipanController::class, 'index']);
    Route::post('/manage-transaksi-penitipan', [TransaksiPenitipanController::class, 'store']);
    Route::get('/manage-transaksi-penitipan/{id}', [TransaksiPenitipanController::class, 'show']);
    Route::put('/manage-transaksi-penitipan/{id}', [TransaksiPenitipanController::class, 'update']);
    Route::delete('/manage-transaksi-penitipan/{id}', [TransaksiPenitipanController::class, 'destroy']);
    Route::get('/barang-titipan', [BarangTitipanController::class, 'indexForGudang']);
    Route::post('/barang-titipan', [BarangTitipanController::class, 'store']);
    Route::put('/barang-titipan/{kode_produk}', [BarangTitipanController::class, 'update']);
    Route::delete('/barang-titipan/{kode_produk}', [BarangTitipanController::class, 'destroy']);
    Route::get('/manage-penitip', [PenitipController::class, 'index']);
    Route::get('/employees/{role}', [PegawaiController::class, 'indexByRole']);
    Route::get('/transaksi-penjualan', [TransaksiPenjualanController::class, 'indexForGudang']);
    Route::put('/transaksi-penjualan/{id}', [TransaksiPenjualanController::class, 'update']);
    Route::put('/barang-titipan/{kode_produk}/confirm-retrieval', [BarangTitipanController::class, 'confirmRetrieval']);
});

// Route Owner Only
Route::prefix('owner')->middleware(['auth:pegawai', 'role:owner', 'can:manage-donasi', 'can:history-donasi', 'can:request-donasi'])->group(function () {
    Route::get('/manage-donasi', [DonasiController::class, 'index']);
    Route::post('/manage-donasi', [DonasiController::class, 'store']);
    Route::get('/manage-donasi/{id}', [DonasiController::class, 'show']);
    Route::put('/manage-donasi/{id}', [DonasiController::class, 'update']);
    Route::delete('/manage-donasi/{id}', [DonasiController::class, 'destroy']);
    Route::get('/history-donasi', [DonasiController::class, 'historyDonasi']);
    Route::put('/history-donasi/{id}', [DonasiController::class, 'update']);
    Route::get('/barang-titipan-donasi', [BarangTitipanController::class, 'getItemsForDonation']);
    Route::put('/barang-titipan-donasi/{kode_produk}', [BarangTitipanController::class, 'updateStatus']);
    Route::apiResource('request-donasi', RequestDonasiController::class);
    Route::get('/penjualan-bulanan-keseluruhan', [LaporanController::class, 'getMonthlySales']);
    Route::get('/komisi-bulanan', [LaporanController::class, 'komisiBulananPerProduk']);
    Route::get('/stok-gudang', [LaporanController::class, 'stokGudang']);
    Route::get('/penjualan-per-kategori', [LaporanController::class, 'penjualanPerKategori']);
    Route::get('/penitipan-sudah-habis', [LaporanController::class, 'penitipanSudahHabis']);
    Route::get('/donasi-barang', [LaporanController::class, 'laporanDonasi']);
    Route::get('/request-donasi-belum-terpenuhi', [LaporanController::class, 'requestDonasiBelumTerpenuhi']);
    Route::get('/laporan-transaksi', [LaporanController::class, 'getPenitipTransactionReport']);
});


// Route Organisasi Only
Route::prefix('organisasi')->middleware(['auth:organisasi', 'role:organisasi', 'can:manage-request-donasi'])->group(function () {
    Route::get('/request-donasi', [RequestDonasiController::class, 'index']);
    Route::post('/request-donasi', [RequestDonasiController::class, 'store']);
    Route::get('/request-donasi/{id}', [RequestDonasiController::class, 'show']);
    Route::put('/request-donasi/{id}', [RequestDonasiController::class, 'update']);
    Route::delete('/request-donasi/{id}', [RequestDonasiController::class, 'destroy']);
});

// Route Pembeli Only
Route::prefix('pembeli')->middleware(['auth:pembeli', 'role:pembeli'])->group(function () {
    Route::post('/transaksi', [TransaksiPenjualanController::class, 'store']);
    Route::get('/transaksi', [TransaksiPenjualanController::class, 'index']);
    Route::get('/transaksi/{noNota}', [TransaksiPenjualanController::class, 'show'])->where('noNota', '[0-9]+\.[0-9]+\.[0-9]+');
    Route::post('/transaksi/{noNota}', [TransaksiPenjualanController::class, 'uploadProof'])->where('noNota', '[0-9]+\.[0-9]+\.[0-9]+');
    Route::post('/transaksi/{noNota}/cancel', [TransaksiPenjualanController::class, 'cancelTransaction'])->where('noNota', '[0-9]+\.[0-9]+\.[0-9]+');
    Route::apiResource('diskusi', DiskusiController::class);
    Route::apiResource('alamat', AlamatController::class);
    Route::get('/pembeli/{id}', [PembeliController::class, 'show']);
    Route::put('/pembeli/{id}', [PembeliController::class, 'update']);
    Route::post('/cart/add/{kode_produk}', [WishlistController::class, 'addToCart'])->name('cart.add');
    Route::get('/cart', [WishlistController::class, 'getCart'])->name('cart.get');
    Route::delete('/cart/remove/{id}', [WishlistController::class, 'removeFromCart'])->name('cart.remove');
    Route::post('/rating', [TransaksiPenjualanController::class, 'submitRating']);
    Route::get('/rating/{productId}', [TransaksiPenjualanController::class, 'getRating']);
    Route::get('/merchandise', [MerchandiseController::class, 'index']);
    Route::post('/penukaran', [PenukaranController::class, 'store']);
    Route::get('/penukaran', [PenukaranController::class, 'index']);
});

// Route Penitip Only
Route::prefix('penitip')->middleware(['auth:penitip', 'role:penitip'])->group(function () {
    Route::get('/transaksi-penjualan', [TransaksiPenjualanController::class, 'indexForPenitip']);
    // Hanya baca. Jangan gunakan apiResource di sini karena akan membuka
    // update/destroy milik controller pembeli untuk role penitip.
    Route::get('/transaksi', [TransaksiPenjualanController::class, 'indexForPenitip']);
    Route::get('/transaksi/{noNota}', [TransaksiPenjualanController::class, 'show'])
        ->where('noNota', '[0-9]+\.[0-9]+\.[0-9]+');
    Route::get('/pembeli/{id}', [PembeliController::class, 'show']);
    // Penitip hanya boleh membaca komisi miliknya sendiri.
    Route::apiResource('komisi', KomisiController::class)->only(['index', 'show']);
    Route::get('/barang-titipan', [BarangTitipanController::class, 'getItemsByPenitip']);
    Route::post('/barang-titipan/{kode_produk}/extend', [BarangTitipanController::class, 'extendConsignment']);
    Route::post('/barang-titipan/{kode_produk}/request-retrieval', [BarangTitipanController::class, 'requestRetrieval']);
    Route::get('/laporan-transaksi', [PenitipController::class, 'getTransactionReport']);
    Route::get('/merchandise', [MerchandiseController::class, 'index']);
    Route::post('/penukaran', [PenukaranController::class, 'store']);
    Route::get('/penukaran', [PenukaranController::class, 'index']);
});

Route::prefix('kurir')->middleware(['auth:pegawai', 'role:kurir'])->group(function () {
    Route::get('/transaksi-penjualan', [TransaksiPenjualanController::class, 'indexForCourier']);
    Route::get('/transaksi-penjualan/{noNota}', [TransaksiPenjualanController::class, 'showForCourier'])->where('noNota', '[0-9]+\.[0-9]+\.[0-9]+');
    Route::put('/transaksi-penjualan/{id}', [TransaksiPenjualanController::class, 'updateStatusForCourier']);
});

Route::prefix('kurir')->middleware(['auth:pegawai', 'role:kurir'])->group(function () {
    Route::get('/transaksi-penjualan', [TransaksiPenjualanController::class, 'indexForCourier']);
});

Route::prefix('hunter')->middleware(['auth:pegawai', 'role:hunter'])->group(function () {
    Route::get('/komisi', [KomisiController::class, 'indexForHunter']);
    Route::get('/barang-titipan', [TransaksiPenitipanController::class, 'indexBarangTitipanForHunter']);
});

Route::post('/diskusi/public', [DiskusiController::class, 'storePublic']);

Route::get('/products/{kode_produk}/thumbnail', [FotoProdukController::class, 'getThumbnail']);
Route::get('/photos/{id}/optimized', [FotoProdukController::class, 'getOptimizedImage']);

Route::get('/test-gd', function () {
    $image = imagecreatetruecolor(100, 100);
    $color = imagecolorallocate($image, 255, 0, 0);
    imagefill($image, 0, 0, $color);
    ob_start();
    imagepng($image);
    $imageData = ob_get_clean();
    imagedestroy($image);
    return response($imageData)->header('Content-Type', 'image/png');
});
