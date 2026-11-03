<?php

namespace App\Http\Controllers;

use App\Models\Merchandise;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MerchandiseController extends Controller
{
    public function index()
    {
        $merchandise = Merchandise::all();
        $merchandise->each(function ($item) {
            if ($item->URL_GAMBAR) {
                $item->URL_GAMBAR = asset('storage/' . $item->URL_GAMBAR);
            }
        });
        return $merchandise;
    }

    public function store(Request $request)
    {
        $request->validate([
            'NAMA' => 'required|string|max:50',
            'DESKRIPSI' => 'nullable|string',
            'POIN_DIBUTUHKAN' => 'required|integer',
            'STOK' => 'required|integer',
            'URL_GAMBAR' => 'nullable|image|mimes:jpg,png,jpeg|max:2048',
        ]);

        $data = $request->all();

        if ($request->hasFile('URL_GAMBAR')) {
            $path = $request->file('URL_GAMBAR')->store('merchandise_images', 'public');
            $data['URL_GAMBAR'] = $path;
        }

        return Merchandise::create($data);
    }

    public function show($id)
    {
        return Merchandise::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $merchandise = Merchandise::findOrFail($id);

        // Validasi data, tetapi buat URL_GAMBAR opsional saat edit
        $request->validate([
            'NAMA' => 'required|string|max:50',
            'DESKRIPSI' => 'nullable|string',
            'POIN_DIBUTUHKAN' => 'required|integer',
            'STOK' => 'required|integer',
            'URL_GAMBAR' => 'nullable|image|mimes:jpg,png,jpeg|max:2048',
        ]);

        $data = $request->all();

        // Jika ada file gambar baru yang diupload
        if ($request->hasFile('URL_GAMBAR')) {
            // Hapus gambar lama jika ada
            if ($merchandise->URL_GAMBAR) {
                Storage::disk('public')->delete($merchandise->URL_GAMBAR);
            }
            $path = $request->file('URL_GAMBAR')->store('merchandise_images', 'public');
            $data['URL_GAMBAR'] = $path;
        } else {
            // Jika tidak ada file baru, pertahankan URL gambar yang ada
            $data['URL_GAMBAR'] = $merchandise->URL_GAMBAR;
        }

        $merchandise->update($data);
        return $merchandise;
    }

    public function destroy($id)
    {
        $merchandise = Merchandise::findOrFail($id);
        
        if ($merchandise->URL_GAMBAR) {
            Storage::disk('public')->delete($merchandise->URL_GAMBAR);
        }
        
        $merchandise->delete();
        return response()->noContent();
    }
}