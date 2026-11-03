<?php

namespace App\Http\Controllers;

use App\Models\Subkategori;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class SubkategoriController extends Controller
{
    public function index(Request $request)
    {
        try {
            $search = $request->input('search');
            $query = Subkategori::query();

            if ($search) {
                $query->where('NAMASUB', 'LIKE', "%{$search}%");
            }

            $subkategoris = $query->select('ID_SUBKATEGORI', 'NAMASUB', 'ID_KATEGORI')->get()->toArray();
            return response()->json([
                'success' => true,
                'data' => $subkategoris
            ], 200);
        } catch (\Exception $e) {
            Log::error("Failed to fetch subkategoris: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch subkategoris: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'ID_KATEGORI' => 'required|integer',
            'NAMASUB' => 'nullable|string|max:70',
        ]);

        try {
            $subkategori = Subkategori::create($request->all());
            return response()->json([
                'success' => true,
                'data' => $subkategori
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create subcategory'
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $subkategori = Subkategori::findOrFail($id);
            return response()->json([
                'success' => true,
                'data' => $subkategori
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Subcategory not found'
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $subkategori = Subkategori::findOrFail($id);
            $subkategori->update($request->all());
            return response()->json([
                'success' => true,
                'data' => $subkategori
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Subcategory not found'
            ], 404);
        }
    }

    public function destroy($id)
    {
        try {
            Subkategori::destroy($id);
            return response()->json([
                'success' => true,
                'message' => 'Subcategory deleted successfully'
            ], 204);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete subcategory'
            ], 500);
        }
    }
}