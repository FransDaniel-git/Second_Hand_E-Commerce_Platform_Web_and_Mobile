<?php

namespace App\Observers;

use App\Models\TransaksiPenjualan;
use App\Models\Penitip;
use App\Models\Pembeli;
use App\Events\TransaksiPenjualanStatusChanged;
use App\Events\TransaksiPenjualanTanggalSiapSet;
use App\Services\CommissionService;
use Illuminate\Support\Facades\Log;

class TransaksiPenjualanObserver
{
    public function updated(TransaksiPenjualan $transaksiPenjualan)
    {
        \Log::info("TransaksiPenjualanObserver triggered for ID_PENJUALAN: {$transaksiPenjualan->ID_PENJUALAN}");
        
        // Get the original attributes before the update
        $originalAttributes = $transaksiPenjualan->getOriginal();
        
        \Log::info("Original STATUS: " . ($originalAttributes['STATUS'] ?? 'null') . ", New STATUS: " . $transaksiPenjualan->STATUS);
        \Log::info("Original TANGGAL_SIAP: " . ($originalAttributes['TANGGAL_SIAP'] ?? 'null') . ", New TANGGAL_SIAP: " . $transaksiPenjualan->TANGGAL_SIAP);
        \Log::info("Original ID_PEGAWAI_KURIR: " . ($originalAttributes['ID_PEGAWAI_KURIR'] ?? 'null') . ", New ID_PEGAWAI_KURIR: " . $transaksiPenjualan->ID_PEGAWAI_KURIR);

        // Check if STATUS changed
        if (isset($originalAttributes['STATUS']) && (string)$originalAttributes['STATUS'] !== (string)$transaksiPenjualan->STATUS) {
            \Log::info("STATUS changed for ID_PENJUALAN: {$transaksiPenjualan->ID_PENJUALAN}, Old: {$originalAttributes['STATUS']}, New: {$transaksiPenjualan->STATUS}");
            event(new TransaksiPenjualanStatusChanged($transaksiPenjualan, $transaksiPenjualan->STATUS));
        }

        // Check if TANGGAL_SIAP or ID_PEGAWAI_KURIR changed
        $tanggalSiapChanged = (string)($originalAttributes['TANGGAL_SIAP'] ?? '') !== (string)($transaksiPenjualan->TANGGAL_SIAP ?? '');
        $kurirChanged = (string)($originalAttributes['ID_PEGAWAI_KURIR'] ?? '') !== (string)($transaksiPenjualan->ID_PEGAWAI_KURIR ?? '');
        
        if ($tanggalSiapChanged || $kurirChanged) {
            \Log::info("TANGGAL_SIAP or ID_PEGAWAI_KURIR changed for ID_PENJUALAN: {$transaksiPenjualan->ID_PENJUALAN}, TANGGAL_SIAP: {$transaksiPenjualan->TANGGAL_SIAP}, ID_PEGAWAI_KURIR: {$transaksiPenjualan->ID_PEGAWAI_KURIR}");
            if ($transaksiPenjualan->TANGGAL_SIAP && $transaksiPenjualan->ID_PEGAWAI_KURIR) {
                \Log::info("Triggering TransaksiPenjualanTanggalSiapSet for ID_PENJUALAN: {$transaksiPenjualan->ID_PENJUALAN}");
                event(new TransaksiPenjualanTanggalSiapSet($transaksiPenjualan));
            } else {
                \Log::warning("Event not triggered: TANGGAL_SIAP or ID_PEGAWAI_KURIR missing for ID_PENJUALAN: {$transaksiPenjualan->ID_PENJUALAN}");
            }
        }

        if ($transaksiPenjualan->wasChanged('STATUS') &&
        in_array($transaksiPenjualan->STATUS, ['Sudah Diambil', 'Sudah Diterima', 'Hangus'])) {
        Log::info("TransaksiPenjualan status changed to {$transaksiPenjualan->STATUS} for ID_PENJUALAN: {$transaksiPenjualan->ID_PENJUALAN}");

        // Get all BarangTitipan for this transaction
        $barangTitipans = $transaksiPenjualan->barangTitipan;

        if ($barangTitipans->isEmpty()) {
            Log::warning("No BarangTitipan found for ID_PENJUALAN: {$transaksiPenjualan->ID_PENJUALAN}");
            return;
        }

        // Calculate commissions for each BarangTitipan
        $commissionService = app(CommissionService::class);
        foreach ($barangTitipans as $barangTitipan) {
            $commissionService->calculateAndStoreCommission($barangTitipan);
        }

        // Update Penitip SALDO and Pembeli POIN_LOYALITAS
        foreach ($barangTitipans as $barangTitipan) {
            $komisi = $barangTitipan->komisi;
            if ($komisi) {
                // Update Penitip SALDO
                $penitip = Penitip::find($komisi->ID_PENITIP);
                if ($penitip) {
                    $saldoToAdd = $komisi->KOMISI_PENITIP + $komisi->BONUS;
                    $penitip->SALDO += $saldoToAdd;
                    $penitip->save();
                    Log::info("Updated SALDO for Penitip ID: {$penitip->ID_PENITIP}, Added: {$saldoToAdd}, New SALDO: {$penitip->SALDO}");
                } else {
                    Log::warning("Penitip not found for ID_PENITIP: {$komisi->ID_PENITIP}");
                }
            }
        }

        // Update Pembeli POIN_LOYALITAS
        $pembeli = Pembeli::find($transaksiPenjualan->ID_PEMBELI);
        if ($pembeli && $transaksiPenjualan->POIN_DIPEROLEH) {
            $pembeli->POIN_LOYALITAS += $transaksiPenjualan->POIN_DIPEROLEH;
            $pembeli->save();
            Log::info("Updated POIN_LOYALITAS for Pembeli ID: {$pembeli->ID_PEMBELI}, Added: {$transaksiPenjualan->POIN_DIPEROLEH}, New POIN_LOYALITAS: {$pembeli->POIN_LOYALITAS}");
        } else {
            Log::warning("Pembeli not found for ID_PEMBELI: {$transaksiPenjualan->ID_PEMBELI} or POIN_DIPEROLEH is null");
        }
    }
    }
}