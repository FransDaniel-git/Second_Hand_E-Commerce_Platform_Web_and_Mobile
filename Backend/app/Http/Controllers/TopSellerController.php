<?php

namespace App\Http\Controllers;

use App\Models\TopSeller;
use Illuminate\Http\Request;

class TopSellerController extends Controller
{
    public function index()
    {
        return TopSeller::all();
    }

    public function store(Request $request)
    {
        $request->validate([
            'ID_PENITIP' => 'required|string|max:10',
            'TANGGAL_MULAI' => 'nullable|date',
            'TANGGAL_SELESAI' => 'nullable|date',
        ]);

        return TopSeller::create($request->all());
    }

    public function show($id)
    {
        return TopSeller::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $topSeller = TopSeller::findOrFail($id);
        $topSeller->update($request->all());
        return $topSeller;
    }

    public function destroy($id)
    {
        TopSeller::destroy($id);
        return response()->noContent();
    }
}