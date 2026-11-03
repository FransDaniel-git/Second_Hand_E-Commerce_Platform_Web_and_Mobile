<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use App\Models\Subkategori;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class KategoriController extends Controller
{
    public function index()
    {
        try {
            $categories = Kategori::all();
            return response()->json([
                'success' => true,
                'data' => $categories
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch categories'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'NAMA' => 'required|string|max:50',
        ]);

        try {
            $kategori = Kategori::create($request->all());
            return response()->json([
                'success' => true,
                'data' => $kategori
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create category'
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $kategori = Kategori::findOrFail($id);
            return response()->json([
                'success' => true,
                'data' => $kategori
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found'
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $kategori = Kategori::findOrFail($id);
            $kategori->update($request->all());
            return response()->json([
                'success' => true,
                'data' => $kategori
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found'
            ], 404);
        }
    }

    public function destroy($id)
    {
        try {
            Kategori::destroy($id);
            return response()->json([
                'success' => true,
                'message' => 'Category deleted successfully'
            ], 204);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete category'
            ], 500);
        }
    }
    
    /**
     * Get all subcategories for a specific category
     * 
     * @param int $id
     * @return \Illuminate\Http\Response
     */
    public function getSubcategories($id)
    {
        try {
            $subcategories = Subkategori::where('ID_KATEGORI', $id)
                ->select('ID_SUBKATEGORI', 'NAMASUB')
                ->get();
            return response()->json([
                'success' => true,
                'data' => $subcategories
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch subcategories'
            ], 500);
        }
    }
}