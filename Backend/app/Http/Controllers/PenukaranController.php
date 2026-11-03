<?php

namespace App\Http\Controllers;

use App\Models\Penukaran;
use App\Models\Merchandise;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\Pembeli;
use App\Models\Penitip;

class PenukaranController extends Controller
{
    public function index()
    {
        $user = auth('pembeli')->user() ?: auth('penitip')->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Tidak terautentikasi'], 401);
        }

        $userId = $user instanceof \App\Models\Pembeli ? $user->ID_PEMBELI : $user->ID_PENITIP;
        $userType = $user instanceof \App\Models\Pembeli ? 'ID_PEMBELI' : 'ID_PENITIP';

        $penukaran = Penukaran::where($userType, $userId)
            ->with('merchandise')
            ->get()
            ->map(function ($item) {
                return [
                    'ID_PENUKARAN' => $item->ID_PENUKARAN,
                    'NAMA_MERCHANDISE' => $item->merchandise->NAMA,
                    'POIN_DIGUNAKAN' => $item->POIN_DIGUNAKAN,
                    'TANGGAL_PENUKARAN' => $item->TANGGAL_PENUKARAN,
                    'KODE_PENUKARAN' => $item->KODE_PENUKARAN,
                    'TANGGAL_DIKLAIM' => $item->TANGGAL_DIKLAIM,
                ];
            });

        return response()->json($penukaran);
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'ID_MERCHANDISE' => 'required|integer|exists:merchandises,ID_MERCHANDISE',
            ]);

            $user = auth('pembeli')->user() ?: auth('penitip')->user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Tidak terautentikasi'], 401);
            }

            return DB::transaction(function () use ($request, $user) {
                $merchandise = Merchandise::lockForUpdate()->findOrFail($request->ID_MERCHANDISE);

                if ($merchandise->STOK <= 0) {
                    Log::warning("Exchange attempt failed: Stock empty for merchandise ID {$request->ID_MERCHANDISE}");
                    return response()->json(['success' => false, 'message' => 'Stok merchandise habis.'], 400);
                }

                if ($user->POIN_LOYALITAS < $merchandise->POIN_DIBUTUHKAN) {
                    Log::warning("Exchange attempt failed: Insufficient points for user {$user->getKey()}");
                    return response()->json(['success' => false, 'message' => 'Poin tidak mencukupi.'], 400);
                }

                $merchandise->STOK -= 1;
                $merchandise->save();

                $user->POIN_LOYALITAS -= $merchandise->POIN_DIBUTUHKAN;
                $user->save();

                $penukaranData = [
                    'ID_MERCHANDISE' => $merchandise->ID_MERCHANDISE,
                    'ID_PEGAWAI' => null,
                    'POIN_DIGUNAKAN' => $merchandise->POIN_DIBUTUHKAN,
                    'KODE_PENUKARAN' => sprintf('%06d', rand(0, 999999)),
                    'TANGGAL_PENUKARAN' => now(),
                    'TANGGAL_DIKLAIM' => null,
                ];

                if ($user instanceof \App\Models\Pembeli) {
                    $penukaranData['ID_PEMBELI'] = $user->ID_PEMBELI;
                    $penukaranData['ID_PENITIP'] = null;
                } else {
                    $penukaranData['ID_PEMBELI'] = null;
                    $penukaranData['ID_PENITIP'] = $user->ID_PENITIP;
                }

                $penukaran = Penukaran::create($penukaranData);

                Log::info("Exchange successful: Penukaran ID {$penukaran->ID_PENUKARAN} created for user {$user->getKey()}");

                return response()->json(['success' => true, 'data' => $penukaran], 201);
            });
        } catch (\Exception $e) {
            Log::error("Error in PenukaranController::store: " . $e->getMessage(), ['request' => $request->all()]);
            return response()->json(['success' => false, 'message' => 'Terjadi kesalahan server: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        return Penukaran::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $penukaran = Penukaran::findOrFail($id);
        $penukaran->update($request->all());
        return $penukaran;
    }

    public function destroy($id)
    {
        Penukaran::destroy($id);
        return response()->noContent();
    }

  public function claim(Request $request, $id)
    {
        try {
            $request->validate([
                'KODE_PENUKARAN' => 'required|string|size:6',
            ]);

            if (!auth('pegawai')->check()) {
                return response()->json(['success' => false, 'message' => 'Tidak terautentikasi'], 401);
            }

            $pegawai = auth('pegawai')->user();

            return DB::transaction(function () use ($id, $request, $pegawai) {
                $penukaran = Penukaran::lockForUpdate()->findOrFail($id);

                if ($penukaran->KODE_PENUKARAN !== $request->KODE_PENUKARAN) {
                    Log::warning("Claim attempt failed: Invalid code for penukaran ID {$id}");
                    return response()->json(['success' => false, 'message' => 'Kode penukaran tidak valid.'], 400);
                }
                
                if ($penukaran->TANGGAL_DIKLAIM !== null) {
                    Log::warning("Claim attempt failed: Already claimed for penukaran ID {$id}");
                    return response()->json(['success' => false, 'message' => 'Merchandise sudah diklaim.'], 400);
                }
                
                $penukaran->TANGGAL_DIKLAIM = now();
                $penukaran->ID_PEGAWAI = $pegawai->ID_PEGAWAI;
                $penukaran->save();
                
                Log::info("Claim successful: Penukaran ID {$id} claimed by pegawai {$pegawai->ID_PEGAWAI}");
                
                return response()->json(['success' => true, 'data' => $penukaran]);
            });
        } catch (\Exception $e) {
            Log::error("Error in PenukaranController::claim: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Terjadi kesalahan server: ' . $e->getMessage()], 500);
        }
    }
  
    public function getAllClaims(Request $request)
    {
        try {
            $query = Penukaran::with(['pembeli', 'merchandise', 'pegawai', 'penitip'])
                ->orderBy('TANGGAL_PENUKARAN', 'desc');

            // Apply year and month filters if provided
            if ($request->has('year') && $request->has('month')) {
                $query->whereYear('TANGGAL_PENUKARAN', $request->year)
                      ->whereMonth('TANGGAL_PENUKARAN', $request->month);
            }

            $penukaran = $query->get();

            return response()->json(['success' => true, 'data' => $penukaran], 200);
        } catch (\Exception $e) {
            Log::error("Error in PenukaranController::getAllClaims: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal mengambil data klaim: ' . $e->getMessage()], 500);
        }
    }

    public function markAsClaimed($id)
    {
        try {
            if (!auth('pegawai')->check()) {
                return response()->json(['success' => false, 'message' => 'Tidak terautentikasi'], 401);
            }

            $pegawai = auth('pegawai')->user();

            return DB::transaction(function () use ($id, $pegawai) {
                $penukaran = Penukaran::lockForUpdate()->findOrFail($id);

                if ($penukaran->TANGGAL_DIKLAIM !== null) {
                    Log::warning("Mark as claimed failed: Already claimed for penukaran ID {$id}");
                    return response()->json(['success' => false, 'message' => 'Merchandise sudah diklaim.'], 400);
                }

                $penukaran->TANGGAL_DIKLAIM = now();
                $penukaran->ID_PEGAWAI = $pegawai->ID_PEGAWAI;
                $penukaran->save();

                Log::info("Mark as claimed successful: Penukaran ID {$id} claimed by pegawai {$pegawai->ID_PEGAWAI}");

                return response()->json(['success' => true, 'data' => $penukaran], 200);
            });
        } catch (\Exception $e) {
            Log::error("Error in PenukaranController::markAsClaimed: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal menandai klaim: ' . $e->getMessage()], 500);
        }
    }
}
