<?php

namespace App\Http\Controllers;

use App\Models\FotoProduk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class FotoProdukController extends Controller
{
    public function index()
    {
        return FotoProduk::all();
    }

    public function store(Request $request)
    {
        $request->validate([
            'KODE_PRODUK' => 'required|string|max:10',
            'URL_FOTO' => 'required|string|max:100',
            'IS_UTAMA' => 'required|boolean',
        ]);

        return FotoProduk::create($request->all());
    }

    public function show($id)
    {
        return FotoProduk::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $fotoProduk = FotoProduk::findOrFail($id);
        $fotoProduk->update($request->all());
        return $fotoProduk;
    }

    public function destroy($id)
    {
        FotoProduk::destroy($id);
        return response()->noContent();
    }

    public function getThumbnail($kode_produk)
    {
        try {
            $fotoProduk = FotoProduk::where('KODE_PRODUK', $kode_produk)
                ->where('IS_UTAMA', true)
                ->firstOrFail();

            $originalPath = $fotoProduk->URL_FOTO;
            $thumbnailPath = "thumbnails/{$kode_produk}_thumbnail.jpg";

            if (Storage::disk('public')->exists($thumbnailPath)) {
                return response()->file(Storage::disk('public')->path($thumbnailPath), [
                    'Cache-Control' => 'public, max-age=604800',
                ]);
            }

            if (!Storage::disk('public')->exists($originalPath)) {
                throw new \Exception("Original image not found: {$originalPath}");
            }

            $fullPath = Storage::disk('public')->path($originalPath);
            $imageType = @exif_imagetype($fullPath);
            if ($imageType === false) {
                throw new \Exception("Invalid or unsupported image format: {$originalPath}");
            }

            switch ($imageType) {
                case IMAGETYPE_JPEG:
                    $image = @imagecreatefromjpeg($fullPath);
                    break;
                case IMAGETYPE_PNG:
                    $image = @imagecreatefrompng($fullPath);
                    break;
                case IMAGETYPE_GIF:
                    $image = @imagecreatefromgif($fullPath);
                    break;
                default:
                    throw new \Exception("Unsupported image format: {$imageType}");
            }

            if ($image === false) {
                throw new \Exception("Failed to create image resource from: {$originalPath}");
            }

            $originalWidth = imagesx($image);
            $originalHeight = imagesy($image);

            $thumbnailSize = 300;
            $ratio = min($thumbnailSize / $originalWidth, $thumbnailSize / $originalHeight);
            $newWidth = (int)($originalWidth * $ratio);
            $newHeight = (int)($originalHeight * $ratio);

            $thumbnail = imagecreatetruecolor($thumbnailSize, $thumbnailSize);
            if ($thumbnail === false) {
                imagedestroy($image);
                throw new \Exception("Failed to create thumbnail image resource");
            }

            $white = imagecolorallocate($thumbnail, 255, 255, 255);
            imagefill($thumbnail, 0, 0, $white);

            $destX = (int)(($thumbnailSize - $newWidth) / 2);
            $destY = (int)(($thumbnailSize - $newHeight) / 2);
            $resampled = imagecopyresampled(
                $thumbnail,
                $image,
                $destX,
                $destY,
                0,
                0,
                $newWidth,
                $newHeight,
                $originalWidth,
                $originalHeight
            );

            if (!$resampled) {
                imagedestroy($image);
                imagedestroy($thumbnail);
                throw new \Exception("Failed to resample image");
            }

            ob_start();
            $saved = imagejpeg($thumbnail, null, 85);
            $thumbnailData = ob_get_clean();

            if (!$saved) {
                imagedestroy($image);
                imagedestroy($thumbnail);
                throw new \Exception("Failed to generate JPEG thumbnail");
            }

            Storage::disk('public')->put($thumbnailPath, $thumbnailData);

            imagedestroy($image);
            imagedestroy($thumbnail);

            return response()->file(Storage::disk('public')->path($thumbnailPath), [
                'Cache-Control' => 'public, max-age=604800',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error("Primary photo not found for KODE_PRODUK: {$kode_produk}");
            return response()->json([
                'success' => false,
                'message' => 'Primary photo not found for product'
            ], 404);
        } catch (\Exception $e) {
            Log::error("Failed to generate thumbnail for KODE_PRODUK: {$kode_produk}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate thumbnail: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getOptimizedImage($id)
    {
        try {
            $fotoProduk = FotoProduk::findOrFail($id);
            $originalPath = $fotoProduk->URL_FOTO;
            $optimizedPath = "optimized/{$id}_optimized.jpg";

            if (Storage::disk('public')->exists($optimizedPath)) {
                return response()->file(Storage::disk('public')->path($optimizedPath), [
                    'Cache-Control' => 'public, max-age=604800',
                ]);
            }

            if (!Storage::disk('public')->exists($originalPath)) {
                throw new \Exception("Original image not found: {$originalPath}");
            }

            $fullPath = Storage::disk('public')->path($originalPath);
            $imageType = @exif_imagetype($fullPath);
            if ($imageType === false) {
                throw new \Exception("Invalid or unsupported image format: {$originalPath}");
            }

            switch ($imageType) {
                case IMAGETYPE_JPEG:
                    $image = @imagecreatefromjpeg($fullPath);
                    break;
                case IMAGETYPE_PNG:
                    $image = @imagecreatefrompng($fullPath);
                    break;
                case IMAGETYPE_GIF:
                    $image = @imagecreatefromgif($fullPath);
                    break;
                default:
                    throw new \Exception("Unsupported image format: {$imageType}");
            }

            if ($image === false) {
                throw new \Exception("Failed to create image resource from: {$originalPath}");
            }

            $originalWidth = imagesx($image);
            $originalHeight = imagesy($image);

            $optimizedSize = 800;
            $ratio = min($optimizedSize / $originalWidth, $optimizedSize / $originalHeight);
            $newWidth = (int)($originalWidth * $ratio);
            $newHeight = (int)($originalHeight * $ratio);

            $optimized = imagecreatetruecolor($optimizedSize, $optimizedSize);
            if ($optimized === false) {
                imagedestroy($image);
                throw new \Exception("Failed to create optimized image resource");
            }

            $white = imagecolorallocate($optimized, 255, 255, 255);
            imagefill($optimized, 0, 0, $white);

            $destX = (int)(($optimizedSize - $newWidth) / 2);
            $destY = (int)(($optimizedSize - $newHeight) / 2);
            $resampled = imagecopyresampled(
                $optimized,
                $image,
                $destX,
                $destY,
                0,
                0,
                $newWidth,
                $newHeight,
                $originalWidth,
                $originalHeight
            );

            if (!$resampled) {
                imagedestroy($image);
                imagedestroy($optimized);
                throw new \Exception("Failed to resample image");
            }

            ob_start();
            $saved = imagejpeg($optimized, null, 85);
            $optimizedData = ob_get_clean();

            if (!$saved) {
                imagedestroy($image);
                imagedestroy($optimized);
                throw new \Exception("Failed to generate JPEG optimized image");
            }

            Storage::disk('public')->put($optimizedPath, $optimizedData);

            imagedestroy($image);
            imagedestroy($optimized);

            return response()->file(Storage::disk('public')->path($optimizedPath), [
                'Cache-Control' => 'public, max-age=604800',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error("Photo not found for ID: {$id}");
            return response()->json([
                'success' => false,
                'message' => 'Photo not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error("Failed to generate optimized image for ID: {$id}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate optimized image: ' . $e->getMessage()
            ], 500);
        }
    }
}