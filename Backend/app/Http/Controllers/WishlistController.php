<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\Wishlist;
use App\Models\BarangTitipan;
use App\Models\TransaksiPenjualan;
use App\Models\Pembeli;

class WishlistController extends Controller
{
    // public function addToCart(Request $request, $kode_produk)
    // {
    //     try {
    //         // Validate authenticated user
    //         $user = Auth::guard('pembeli')->user();
    //         if (!$user || !$user->ID_PEMBELI) {
    //             Log::warning("Unauthenticated or invalid user: kode_produk={$kode_produk}, user=" . json_encode($user));
    //             return response()->json([
    //                 'success' => false,
    //                 'message' => 'Anda harus login sebagai pembeli untuk menambahkan ke keranjang.'
    //             ], 401);
    //         }

    //         Log::info("Wishlist add attempt: kode_produk={$kode_produk}, ID_PEMBELI={$user->ID_PEMBELI}");

    //         // Validate request data
    //         $request->validate([
    //             'ID_PEMBELI' => 'required|integer|exists:pembelis,ID_PEMBELI',
    //             'KODE_PRODUK' => 'required|string|max:10|exists:barangtitipans,KODE_PRODUK',
    //         ]);

    //         // Ensure ID_PEMBELI matches authenticated user
    //         if ($request->ID_PEMBELI != $user->ID_PEMBELI) {
    //             Log::warning("ID_PEMBELI mismatch: request={$request->ID_PEMBELI}, user={$user->ID_PEMBELI}");
    //             return response()->json([
    //                 'success' => false,
    //                 'message' => 'ID pembeli tidak valid.'
    //             ], 403);
    //         }

    //         // Check if product exists and is available
    //         $produk = BarangTitipan::where('KODE_PRODUK', $kode_produk)
    //             ->where('STATUS', 'Tersedia')
    //             ->first();
    //         if (!$produk) {
    //             Log::warning("Product not found or unavailable: kode_produk={$kode_produk}");
    //             return response()->json([
    //                 'success' => false,
    //                 'message' => 'Produk tidak ditemukan atau tidak tersedia.'
    //             ], 404);
    //         }

    //         // Check for duplicate item in wishlist
    //         $wishlistItem = Wishlist::where('ID_PEMBELI', $user->ID_PEMBELI)
    //             ->where('KODE_PRODUK', $kode_produk)
    //             ->first();
    //         if ($wishlistItem) {
    //             Log::info("Duplicate item: ID_PEMBELI={$user->ID_PEMBELI}, kode_produk={$kode_produk}");
    //             return response()->json([
    //                 'success' => false,
    //                 'message' => 'Produk sudah ada di keranjang.'
    //             ], 400);
    //         }

    //         // Create wishlist item
    //         $wishlistItem = Wishlist::create([
    //             'ID_PEMBELI' => $user->ID_PEMBELI,
    //             'KODE_PRODUK' => $kode_produk,
    //         ]);
    //         Log::info("Wishlist item created: ID_WISHLIST={$wishlistItem->ID_WISHLIST}, kode_produk={$kode_produk}");

    //         return response()->json([
    //             'success' => true,
    //             'message' => 'Berhasil ditambahkan ke keranjang.',
    //             'data' => [
    //                 'wishlist_id' => $wishlistItem->ID_WISHLIST,
    //                 'kode_produk' => $wishlistItem->KODE_PRODUK,
    //                 'nama_produk' => $produk->NAMA,
    //                 'harga' => $produk->HARGA_JUAL,
    //             ]
    //         ], 200);
    //     } catch (\Illuminate\Validation\ValidationException $e) {
    //         Log::error("Validation failed: kode_produk={$kode_produk}, errors=" . json_encode($e->errors()));
    //         // Meratakan array multi-dimensi menjadi satu array pesan error
    //         $errorMessages = array_map(function ($errors) {
    //             return implode(', ', (array)$errors);
    //         }, $e->errors());
    //         $message = 'Validasi gagal: ' . implode(', ', $errorMessages);
    //         return response()->json([
    //             'success' => false,
    //             'message' => $message,
    //         ], 422);
    //     } catch (\Exception $e) {
    //         Log::error("Wishlist error: kode_produk={$kode_produk}, ID_PEMBELI=" . ($user->ID_PEMBELI ?? 'null') . ", error: {$e->getMessage()}, stack: {$e->getTraceAsString()}");
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Gagal menambah ke keranjang: ' . $e->getMessage()
    //         ], 500);
    //     }
    // }

    public function addToCart(Request $request, $kode_produk)
    {
        try {
            // Validate authenticated user
            $user = Auth::guard('pembeli')->user();
            if (!$user || !$user->ID_PEMBELI) {
                Log::warning("Unauthenticated or invalid user: kode_produk={$kode_produk}, user=" . json_encode($user));
                return response()->json([
                    'success' => false,
                    'message' => 'Anda harus login sebagai pembeli untuk menambahkan ke keranjang.'
                ], 401);
            }

            Log::info("Wishlist add attempt: kode_produk={$kode_produk}, ID_PEMBELI={$user->ID_PEMBELI}");

            // HAPUS VALIDASI INI - Tidak diperlukan karena kode_produk sudah dari route parameter
            // dan ID_PEMBELI sudah dari authenticated user
            // $request->validate([
            //     'ID_PEMBELI' => 'required|integer|exists:pembelis,ID_PEMBELI',
            //     'KODE_PRODUK' => 'required|string|max:10|exists:barangtitipans,KODE_PRODUK',
            // ]);

            // Check if product exists and is available
            $produk = BarangTitipan::where('KODE_PRODUK', $kode_produk)
                ->where('STATUS', 'Tersedia')
                ->first();
            if (!$produk) {
                Log::warning("Product not found or unavailable: kode_produk={$kode_produk}");
                return response()->json([
                    'success' => false,
                    'message' => 'Produk tidak ditemukan atau tidak tersedia.'
                ], 404);
            }

            // Check for duplicate item in wishlist
            $wishlistItem = Wishlist::where('ID_PEMBELI', $user->ID_PEMBELI)
                ->where('KODE_PRODUK', $kode_produk)
                ->first();
            if ($wishlistItem) {
                Log::info("Duplicate item: ID_PEMBELI={$user->ID_PEMBELI}, kode_produk={$kode_produk}");
                return response()->json([
                    'success' => false,
                    'message' => 'Produk sudah ada di keranjang.'
                ], 400);
            }

            // Create wishlist item
            $wishlistItem = Wishlist::create([
                'ID_PEMBELI' => $user->ID_PEMBELI,
                'KODE_PRODUK' => $kode_produk,
            ]);
            Log::info("Wishlist item created: ID_WISHLIST={$wishlistItem->ID_WISHLIST}, kode_produk={$kode_produk}");

            return response()->json([
                'success' => true,
                'message' => 'Berhasil ditambahkan ke keranjang.',
                'data' => [
                    'wishlist_id' => $wishlistItem->ID_WISHLIST,
                    'kode_produk' => $wishlistItem->KODE_PRODUK,
                    'nama_produk' => $produk->NAMA,
                    'harga' => $produk->HARGA_JUAL,
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error("Wishlist error: kode_produk={$kode_produk}, ID_PEMBELI=" . ($user->ID_PEMBELI ?? 'null') . ", error: {$e->getMessage()}, stack: {$e->getTraceAsString()}");
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambah ke keranjang: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getCart(Request $request)
    {
        try {
            $user = Auth::guard('pembeli')->user();
            if (!$user || !$user->ID_PEMBELI) {
                Log::warning("Unauthenticated user attempting to access wishlist");
                return response()->json([
                    'success' => false,
                    'message' => 'Anda harus login sebagai pembeli untuk mengakses keranjang.'
                ], 401);
            }

            Log::info("Fetching cart for ID_PEMBELI: {$user->ID_PEMBELI}");

            // Get wishlist items with proper filtering
            $wishlistItems = Wishlist::where('ID_PEMBELI', $user->ID_PEMBELI)->get();
            Log::info("Found wishlist items: " . count($wishlistItems));

            $items = collect();

            foreach ($wishlistItems as $wishlistItem) {
                // Get barang titipan with detailed filtering
                $barangTitipan = BarangTitipan::where('KODE_PRODUK', $wishlistItem->KODE_PRODUK)
                    ->with(['fotoProduk' => function ($query) {
                        $query->where('IS_UTAMA', true);
                    }])
                    ->first();

                if (!$barangTitipan) {
                    Log::warning("BarangTitipan not found for KODE_PRODUK: {$wishlistItem->KODE_PRODUK}");
                    continue;
                }

                Log::info("Processing product: {$barangTitipan->KODE_PRODUK}, STATUS: {$barangTitipan->STATUS}, ID_PENJUALAN: {$barangTitipan->ID_PENJUALAN}");

                // Check if product is available or sold but payment is pending
                $isAvailable = false;

                if ($barangTitipan->STATUS === 'Tersedia') {
                    $isAvailable = true;
                    Log::info("Product {$barangTitipan->KODE_PRODUK} is available");
                } elseif ($barangTitipan->STATUS === 'Terjual' && $barangTitipan->ID_PENJUALAN) {
                    // Check transaction status
                    $transaction = TransaksiPenjualan::where('ID_PENJUALAN', $barangTitipan->ID_PENJUALAN)->first();
                    if (!$transaction) {
                        Log::warning("Transaction not found for ID_PENJUALAN: {$barangTitipan->ID_PENJUALAN}");
                        continue;
                    }

                    Log::info("Transaction status for {$barangTitipan->KODE_PRODUK}: {$transaction->STATUS}");

                    // Only show if transaction is not in "Menunggu Pembayaran" status
                    if ($transaction->STATUS !== 'Menunggu Pembayaran') {
                        $isAvailable = true;
                        Log::info("Product {$barangTitipan->KODE_PRODUK} is sold but payment not pending");
                    } else {
                        Log::info("Product {$barangTitipan->KODE_PRODUK} is sold with pending payment - excluding from cart");
                    }
                } else {
                    Log::info("Product {$barangTitipan->KODE_PRODUK} status {$barangTitipan->STATUS} - excluding from cart");
                }

                if ($isAvailable) {
                    $mainPhoto = $barangTitipan->fotoProduk->first();
                    $items->push([
                        'id' => $wishlistItem->ID_WISHLIST,
                        'kode_produk' => $barangTitipan->KODE_PRODUK,
                        'name' => $barangTitipan->NAMA,
                        'price' => $barangTitipan->HARGA_JUAL,
                        'description' => $barangTitipan->DESKRIPSI,
                        'condition' => $barangTitipan->KONDISI,
                        'guarantee' => $barangTitipan->GARANSI,
                        'weight' => $barangTitipan->BERAT,
                        'image' => $mainPhoto 
                            ? asset('storage/' . $mainPhoto->URL_FOTO)
                            : '/api/placeholder/60/60',
                        'status' => $barangTitipan->STATUS
                    ]);
                    Log::info("Added product {$barangTitipan->KODE_PRODUK} to cart response");
                }
            }

            Log::info("Cart retrieved: ID_PEMBELI={$user->ID_PEMBELI}, available_items_count=" . count($items));

            return response()->json([
                'success' => true,
                'data' => ['items' => $items->values()->all()]
            ], 200);

        } catch (\Exception $e) {
            Log::error("Get wishlist error: ID_PEMBELI=" . ($user->ID_PEMBELI ?? 'null') . ", error: {$e->getMessage()}, trace: {$e->getTraceAsString()}");
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat keranjang: ' . $e->getMessage()
            ], 500);
        }
    }

    public function removeFromCart(Request $request, $id)
    {
        try {
            $user = Auth::guard('pembeli')->user();
            if (!$user || !$user->ID_PEMBELI) {
                Log::warning("Unauthenticated user attempting to remove item: ID_WISHLIST={$id}");
                return response()->json([
                    'success' => false,
                    'message' => 'Anda harus login sebagai pembeli untuk menghapus item.'
                ], 401);
            }

            $wishlistItem = Wishlist::where('ID_PEMBELI', $user->ID_PEMBELI)
                ->where('ID_WISHLIST', $id)
                ->first();
            if (!$wishlistItem) {
                Log::warning("Wishlist item not found: ID_WISHLIST={$id}, ID_PEMBELI={$user->ID_PEMBELI}");
                return response()->json([
                    'success' => false,
                    'message' => 'Item tidak ditemukan di keranjang.'
                ], 404);
            }

            $wishlistItem->delete();
            Log::info("Wishlist item removed: ID_WISHLIST={$id}, ID_PEMBELI={$user->ID_PEMBELI}");

            return response()->json([
                'success' => true,
                'message' => 'Item berhasil dihapus dari keranjang.'
            ], 200);
        } catch (\Exception $e) {
            Log::error("Remove wishlist item error: ID_WISHLIST={$id}, ID_PEMBELI=" . ($user->ID_PEMBELI ?? 'null') . ", error: {$e->getMessage()}");
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus item: ' . $e->getMessage()
            ], 500);
        }
    }
}