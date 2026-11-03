<?php

namespace App\Http\Controllers;

use App\Models\Komisi;
use App\Models\BarangTitipan;
use App\Models\TransaksiPenjualan;
use App\Models\FotoProduky;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class KomisiController extends Controller
{
    public function index()
    {
        try {
            // Penitip hanya boleh melihat komisi miliknya sendiri.
            $penitipId = Auth::guard('penitip')->id();

            return Komisi::where('ID_PENITIP', $penitipId)->get();
        } catch (\Exception $e) {
            Log::error("Error fetching commissions: " . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch commissions'], 500);
        }
    }

    public function indexForHunter(Request $request)
    {
        try {
            if (!Auth::guard('pegawai')->check()) {
                Log::error("Unauthorized access to hunter commissions");
                return response()->json(['error' => 'Unauthorized'], 401);
            }
            $hunterId = Auth::guard('pegawai')->user()->ID_PEGAWAI;
            if (!$hunterId) {
                Log::error("Hunter ID not found in authenticated user");
                return response()->json(['error' => 'Hunter ID not found'], 400);
            }
            $commissions = Komisi::select(
                'komisis.KODE_PRODUK',
                'komisis.ID_PEGAWAI',
                'komisis.ID_PENITIP',
                'komisis.KOMISI_HUNTER',
                'barangtitipans.NAMA as product_name',
                'barangtitipans.HARGA_JUAL as selling_price',
                'transaksipenjualans.TANGGAL_PESANAN as transaction_date',
                'transaksipenitipans.TANGGAL_PENITIPAN as consignment_date',
                'barangtitipans.STATUS as product_status',
                'penitips.NAMA as penitip_name',
                'foto_produk.URL_FOTO as product_image'
            )
            ->leftJoin('barangtitipans', 'komisis.KODE_PRODUK', '=', 'barangtitipans.KODE_PRODUK')
            ->leftJoin('transaksipenitipans', 'barangtitipans.ID_PENITIPAN', '=', 'transaksipenitipans.ID_PENITIPAN')
            ->leftJoin('transaksipenjualans', 'barangtitipans.ID_PENJUALAN', '=', 'transaksipenjualans.ID_PENJUALAN')
            ->leftJoin('penitips', 'komisis.ID_PENITIP', '=', 'penitips.ID_PENITIP')
            ->leftJoin('foto_produk', function ($join) {
                $join->on('komisis.KODE_PRODUK', '=', 'foto_produk.KODE_PRODUK')
                     ->where('foto_produk.IS_UTAMA', '=', 1);
            })
            ->where('komisis.ID_PEGAWAI', $hunterId)
            ->get()
            ->map(function ($commission) {
                $commission->product_image = $commission->product_image
                    ? url("/products/{$commission->KODE_PRODUK}/thumbnail")
                    : 'http://192.168.154.254:8000/api/placeholder/60/60'; // Full placeholder URL
                $commission->status = $commission->product_status === 'Terjual' ? 'Completed' : 'Pending';
                $commission->transaction_date = $commission->transaction_date
                    ? Carbon::parse($commission->transaction_date)->format('Y-m-d H:i:s')
                    : '-';
                $commission->consignment_date = $commission->consignment_date
                    ? Carbon::parse($commission->consignment_date)->format('Y-m-d H:i:s')
                    : '-';
                Log::info("Mapped commission for KODE_PRODUK: {$commission->KODE_PRODUK}, Image URL: {$commission->product_image}");
                return $commission;
            });

            Log::info("Fetched commissions for hunter ID: {$hunterId}", ['count' => $commissions->count()]);
            return response()->json($commissions, 200);
        } catch (\Exception $e) {
            Log::error("Error fetching hunter commissions: " . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch hunter commissions: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'KODE_PRODUK' => 'required|string|max:10',
                'ID_PEGAWAI' => 'nullable|string|max:10',
                'ID_PENITIP' => 'required|string|max:10',
                'KOMISI_PENITIP' => 'nullable|integer',
                'KOMISI_HUNTER' => 'nullable|integer',
                'KOMISI_REUSEMART' => 'nullable|integer',
                'BONUS' => 'nullable|integer',
            ]);

            $komisi = Komisi::create($request->all());
            return response()->json($komisi, 201);
        } catch (\Exception $e) {
            Log::error("Error creating commission: " . $e->getMessage());
            return response()->json(['error' => 'Failed to create commission'], 500);
        }
    }

    public function show($kode_produk)
    {
        try {
            $komisi = Komisi::select(
                'komisis.*',
                'barangtitipans.NAMA as product_name',
                'barangtitipans.TANGGAL_KADALUARSA as commission_date',
                'penitips.NAMA as penitip_name',
                'foto_produk.URL_FOTO as product_image'
            )
            ->leftJoin('barangtitipans', 'komisis.KODE_PRODUK', '=', 'barangtitipans.KODE_PRODUK')
            ->leftJoin('penitips', 'komisis.ID_PENITIP', '=', 'penitips.ID_PENITIP')
            ->leftJoin('foto_produk', function ($join) {
                $join->on('komisis.KODE_PRODUK', '=', 'foto_produk.KODE_PRODUK')
                     ->where('foto_produk.IS_UTAMA', '=', 1);
            })
            ->where('komisis.KODE_PRODUK', $kode_produk)
            ->where('komisis.ID_PENITIP', Auth::guard('penitip')->id())
            ->firstOrFail();

            $komisi->product_image = $komisi->product_image
                ? url("/products/{$komisi->KODE_PRODUK}/thumbnail")
                : 'http://10.0.2.2:8000/api/placeholder/60/60';

            return response()->json($komisi, 200);
        } catch (\Exception $e) {
            Log::error("Error fetching commission: " . $e->getMessage());
            return response()->json(['error' => 'Commission not found'], 404);
        }
    }

    public function update(Request $request, $kode_produk)
    {
        try {
            $komisi = Komisi::findOrFail($kode_produk);
            $komisi->update($request->all());
            return response()->json($komisi, 200);
        } catch (\Exception $e) {
            Log::error("Error updating commission: " . $e->getMessage());
            return response()->json(['error' => 'Failed to update commission'], 500);
        }
    }

    public function destroy($kode_produk)
    {
        try {
            Komisi::destroy($kode_produk);
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error("Error deleting commission: " . $e->getMessage());
            return response()->json(['error' => 'Failed to delete commission'], 500);
        }
    }

    
}