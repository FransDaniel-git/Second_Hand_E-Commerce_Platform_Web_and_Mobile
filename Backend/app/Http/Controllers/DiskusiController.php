<?php

namespace App\Http\Controllers;

use App\Models\Diskusi;
use App\Models\BarangTitipan;
use App\Models\Pembeli;
use App\Models\Pegawai;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class DiskusiController extends Controller
{
    public function index(Request $request)
    {
        $query = Diskusi::with(['balasan.pegawai', 'balasan.pembeli', 'pegawai', 'pembeli'])
            ->whereNull('ID_BALASANDISKUSI');

        if ($request->has('kode_produk')) {
            $query->where('KODE_PRODUK', $request->input('kode_produk'));
        }

        return $query->get();
    }

    public function getProductDiscussions(Request $request)
    {
        try {
            Log::debug("Fetching product discussions");

            $query = DB::table('diskusis')
                ->select(
                    'diskusis.ID_DISKUSI',
                    'diskusis.KODE_PRODUK',
                    'diskusis.ID_PEMBELI',
                    'diskusis.PESAN as PESAN_DISKUSI',
                    'diskusis.TANGGAL_DIBUAT as TANGGAL_DISKUSI',
                    'barangtitipans.NAMA as NAMA_PRODUK',
                    'pembelis.NAMA as NAMA_PELANGGAN',
                    DB::raw('IF(EXISTS (
                        SELECT 1 FROM diskusis AS balasan 
                        WHERE balasan.ID_BALASANDISKUSI = diskusis.ID_DISKUSI 
                        AND balasan.ID_PEGAWAI IS NOT NULL
                    ), "Sudah Dibalas", "Belum Dibalas") as STATUS_BALASAN'),
                    DB::raw('(SELECT PESAN FROM diskusis AS balasan 
                        WHERE balasan.ID_BALASANDISKUSI = diskusis.ID_DISKUSI 
                        AND balasan.ID_PEGAWAI IS NOT NULL 
                        LIMIT 1) as BALASAN'),
                    DB::raw('(SELECT TANGGAL_DIBUAT FROM diskusis AS balasan 
                        WHERE balasan.ID_BALASANDISKUSI = diskusis.ID_DISKUSI 
                        AND balasan.ID_PEGAWAI IS NOT NULL 
                        LIMIT 1) as TANGGAL_BALASAN'),
                    DB::raw('(SELECT pegawais.NAMA FROM diskusis AS balasan 
                        JOIN pegawais ON balasan.ID_PEGAWAI = pegawais.ID_PEGAWAI 
                        WHERE balasan.ID_BALASANDISKUSI = diskusis.ID_DISKUSI 
                        AND balasan.ID_PEGAWAI IS NOT NULL 
                        LIMIT 1) as NAMA_CS')
                )
                ->leftJoin('barangtitipans', 'diskusis.KODE_PRODUK', '=', 'barangtitipans.KODE_PRODUK')
                ->leftJoin('pembelis', 'diskusis.ID_PEMBELI', '=', 'pembelis.ID_PEMBELI')
                ->whereNull('diskusis.ID_BALASANDISKUSI');

            $sql = $query->toSql();
            $bindings = $query->getBindings();
            Log::debug("getProductDiscussions SQL: {$sql}", ['bindings' => $bindings]);

            $discussions = $query->get();

            // Ensure NAMA_PELANGGAN is never null or anonymous
            $discussions = $discussions->map(function ($item) {
                if (empty($item->NAMA_PELANGGAN) && !empty($item->ID_PEMBELI)) {
                    $pembeli = Pembeli::find($item->ID_PEMBELI);
                    $item->NAMA_PELANGGAN = $pembeli ? $pembeli->NAMA : 'Customer #' . $item->ID_PEMBELI;
                    Log::debug("Resolved NAMA_PELANGGAN for ID {$item->ID_PEMBELI}: {$item->NAMA_PELANGGAN}");
                } elseif (empty($item->NAMA_PELANGGAN)) {
                    $item->NAMA_PELANGGAN = 'Customer #' . ($item->ID_PEMBELI ?? 'Unknown');
                    Log::debug("No pembeli found for discussion ID {$item->ID_DISKUSI}, using default: {$item->NAMA_PELANGGAN}");
                }
                return $item;
            });

            Log::info("Fetched " . count($discussions) . " product discussions");
            Log::debug("Sample discussion: " . json_encode($discussions->first()));

            return response()->json($discussions, 200);
        } catch (\Exception $e) {
            Log::error("Failed to fetch product discussions: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'error' => 'Failed to fetch product discussions: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'ID_BALASANDISKUSI' => 'nullable|integer|exists:diskusis,ID_DISKUSI',
            'KODE_PRODUK' => 'required|string|max:10|exists:barangtitipans,KODE_PRODUK',
            'PESAN' => 'required|string',
            'TANGGAL_DIBUAT' => 'required|date_format:Y-m-d H:i:s',
        ]);

        try {
            // Identitas penulis selalu diambil dari token, bukan dari body request.
            $data = $validated;
            $data['ID_PEMBELI'] = Auth::guard('pembeli')->id();
            $data['ID_PEGAWAI'] = null;

            $diskusi = Diskusi::create($data);

            Log::info("Discussion created successfully: ID_DISKUSI {$diskusi->ID_DISKUSI}, ID_PEMBELI {$diskusi->ID_PEMBELI}");
            return response()->json($diskusi, 201);
        } catch (\Exception $e) {
            Log::error("Failed to create discussion: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to create discussion: ' . $e->getMessage()], 500);
        }
    }

    public function reply(Request $request, $id)
    {
        $request->validate([
            'BALASAN' => 'required|string',
            'TANGGAL_BALASAN' => 'required|date_format:Y-m-d',
            'ID_CS' => 'required|string|max:10|exists:pegawais,ID_PEGAWAI',
        ]);

        try {
            Log::debug("Attempting to submit reply for discussion ID {$id} with ID_CS {$request->ID_CS}");

            $diskusi = Diskusi::findOrFail($id);

            // Check for existing reply
            $existingReply = Diskusi::where('ID_BALASANDISKUSI', $id)
                ->whereNotNull('ID_PEGAWAI')
                ->first();

            if ($existingReply) {
                // Update existing reply
                $existingReply->update([
                    'PESAN' => $request->BALASAN,
                    'TANGGAL_DIBUAT' => $request->TANGGAL_BALASAN,
                    'ID_PEGAWAI' => $request->ID_CS,
                ]);
                $reply = $existingReply;
                Log::info("Updated existing reply for discussion ID {$id} by ID_CS {$request->ID_CS}", [
                    'reply_id' => $reply->ID_DISKUSI,
                ]);
            } else {
                // Create new reply
                $reply = Diskusi::create([
                    'ID_BALASANDISKUSI' => $id,
                    'ID_PEGAWAI' => $request->ID_CS,
                    'ID_PEMBELI' => null,
                    'KODE_PRODUK' => $diskusi->KODE_PRODUK,
                    'PESAN' => $request->BALASAN,
                    'TANGGAL_DIBUAT' => $request->TANGGAL_BALASAN,
                ]);
                Log::info("Created new reply for discussion ID {$id} by ID_CS {$request->ID_CS}", [
                    'reply_id' => $reply->ID_DISKUSI,
                ]);
            }

            // Verify pegawai exists
            $pegawai = Pegawai::find($request->ID_CS);
            Log::info("Reply processed for discussion ID {$id} by ID_CS {$request->ID_CS}", [
                'pegawai_exists' => !is_null($pegawai),
                'pegawai_name' => $pegawai ? $pegawai->NAMA : 'Not found',
                'reply_id' => $reply->ID_DISKUSI,
            ]);

            return response()->json([
                'message' => 'Reply submitted successfully',
                'data' => $reply
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error("Discussion not found for ID {$id}");
            return response()->json(['error' => 'Discussion not found'], 404);
        } catch (\Exception $e) {
            Log::error("Failed to submit reply for discussion ID {$id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'ID_CS' => $request->ID_CS,
            ]);
            return response()->json(['error' => 'Failed to submit reply: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        return Diskusi::with(['balasan.pegawai', 'balasan.pembeli', 'pegawai', 'pembeli'])
            ->where('ID_PEMBELI', Auth::guard('pembeli')->id())
            ->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $diskusi = Diskusi::where('ID_PEMBELI', Auth::guard('pembeli')->id())
            ->findOrFail($id);

        $validated = $request->validate([
            'PESAN' => 'required|string',
        ]);

        // Hanya isi pesan yang boleh diubah; identitas dan relasi tetap.
        $diskusi->update(['PESAN' => $validated['PESAN']]);
        return $diskusi;
    }

    public function destroy($id)
    {
        $diskusi = Diskusi::where('ID_PEMBELI', Auth::guard('pembeli')->id())
            ->findOrFail($id);
        $diskusi->delete();
        return response()->noContent();
    }

    public function storePublic(Request $request)
{
    $validated = $request->validate([
        'KODE_PRODUK' => 'required',
        'PESAN' => 'required|string',
        'TANGGAL_DIBUAT' => 'required|date',
        'NAMA' => 'nullable|string|default:Anonymous',
    ]);

    $diskusi = Diskusi::create([
        'KODE_PRODUK' => $validated['KODE_PRODUK'],
        'PESAN' => $validated['PESAN'],
        'TANGGAL_DIBUAT' => $validated['TANGGAL_DIBUAT'],
        'NAMA' => $validated['NAMA'] ?? 'Anonymous',
    ]);

    return response()->json($diskusi, 201);
}
}

