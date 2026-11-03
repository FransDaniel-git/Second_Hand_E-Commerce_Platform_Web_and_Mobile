<?php

namespace App\Http\Controllers;

use App\Models\Jabatan;
use Illuminate\Http\Request;

class JabatanController extends Controller
{
    public function index()
    {
        $jabatans = Jabatan::all();
        return response()->json($jabatans);
    }

    public function store(Request $request)
    {
        $request->validate([
            'NAMA' => 'required|string|max:50',
        ]);

        try {
            $jabatan = Jabatan::create($request->all());
            return response()->json($jabatan, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal menambahkan jabatan: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $jabatan = Jabatan::find($id);

        if (!$jabatan) {
            return response()->json(['error' => 'Jabatan tidak ditemukan'], 404);
        }

        return response()->json($jabatan);
    }

    public function update(Request $request, $id)
    {
        $jabatan = Jabatan::find($id);

        if (!$jabatan) {
            return response()->json(['error' => 'Jabatan tidak ditemukan'], 404);
        }

        $request->validate([
            'NAMA' => 'required|string|max:50',
        ]);

        try {
            $jabatan->update($request->all());
            return response()->json($jabatan);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal memperbarui jabatan: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $jabatan = Jabatan::find($id);

        if (!$jabatan) {
            return response()->json(['error' => 'Jabatan tidak ditemukan'], 404);
        }

        try {
            $jabatan->delete();
            return response()->json(['message' => 'Jabatan berhasil dihapus']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal menghapus jabatan: ' . $e->getMessage()], 500);
        }
    }
}
