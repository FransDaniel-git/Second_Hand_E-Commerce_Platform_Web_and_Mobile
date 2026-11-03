<?php

namespace App\Services;

use App\Models\BarangTitipan;
use App\Models\Komisi;
use App\Models\TransaksiPenitipan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CommissionService
{
    /**
     * Calculate and store commissions for a BarangTitipan.
     *
     * @param BarangTitipan $barangTitipan
     * @return bool
     */
    public function calculateAndStoreCommission(BarangTitipan $barangTitipan): bool
    {
        try {
            // Check if commission already exists for this product
            if (Komisi::where('KODE_PRODUK', $barangTitipan->KODE_PRODUK)->exists()) {
                Log::warning("Commission already exists for KODE_PRODUK: {$barangTitipan->KODE_PRODUK}");
                return false;
            }
    
            // Get the associated TransaksiPenitipan
            $transaksiPenitipan = $barangTitipan->penitipan;
            if (!$transaksiPenitipan) {
                Log::error("No TransaksiPenitipan found for KODE_PRODUK: {$barangTitipan->KODE_PRODUK}");
                return false;
            }

            // Initialize commission values
            $hargaJual = $barangTitipan->HARGA_JUAL;
            $hasHunter = !is_null($transaksiPenitipan->ID_PEGAWAI_HUNTER);
            $isExtended = !is_null($barangTitipan->TANGGAL_PERPANJANGAN);
            $isFastSale = $barangTitipan->TERJUAL_CEPAT == 1;

            // Calculate Hunter Commission (5% if hunter exists)
            $komisiHunter = $hasHunter ? $hargaJual * 0.05 : 0;

            // Calculate ReUseMart Commission
            if (!$hasHunter && !$isExtended) {
                $komisiReUseMart = $hargaJual * 0.20; // 20%
            } elseif (!$hasHunter && $isExtended) {
                $komisiReUseMart = $hargaJual * 0.30; // 30%
            } elseif ($hasHunter && !$isExtended) {
                $komisiReUseMart = $hargaJual * 0.15; // 15%
            } else {
                $komisiReUseMart = $hargaJual * 0.25; // 25%
            }

            // Calculate Penitip Commission (100% - Hunter - ReUseMart)
            $komisiPenitip = $hargaJual - ($komisiHunter + $komisiReUseMart);

            // Calculate Bonus (10% of ReUseMart if fast sale)
            $bonus = $isFastSale ? $komisiReUseMart * 0.10 : 0;

            // Store the commission in a transaction
            DB::beginTransaction();

            Komisi::create([
                'KODE_PRODUK' => $barangTitipan->KODE_PRODUK,
                'ID_PEGAWAI' => $transaksiPenitipan->ID_PEGAWAI_HUNTER,
                'ID_PENITIP' => $transaksiPenitipan->ID_PENITIP,
                'KOMISI_PENITIP' => $komisiPenitip,
                'KOMISI_HUNTER' => $komisiHunter,
                'KOMISI_REUSEMART' => $komisiReUseMart,
                'BONUS' => $bonus,
            ]);

            DB::commit();
            Log::info("Commission stored for KODE_PRODUK: {$barangTitipan->KODE_PRODUK}", [
                'KOMISI_PENITIP' => $komisiPenitip,
                'KOMISI_HUNTER' => $komisiHunter,
                'KOMISI_REUSEMART' => $komisiReUseMart,
                'BONUS' => $bonus,
            ]);

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to calculate/store commission for KODE_PRODUK: {$barangTitipan->KODE_PRODUK}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return false;
        }
    }
}