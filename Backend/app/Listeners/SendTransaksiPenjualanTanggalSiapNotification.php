<?php

namespace App\Listeners;

use App\Events\TransaksiPenjualanTanggalSiapSet;
use App\Services\NotificationService;
use App\Models\Pegawai;
use App\Models\Pembeli;
use App\Models\Penitip;
use Carbon\Carbon;

class SendTransaksiPenjualanTanggalSiapNotification
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handle(TransaksiPenjualanTanggalSiapSet $event)
    {
        $transaksi = $event->transaksiPenjualan;
        \Log::info("SendTransaksiPenjualanTanggalSiapNotification handling ID_PENJUALAN: {$transaksi->ID_PENJUALAN}");

        // Validate TANGGAL_SIAP
        if (!$transaksi->TANGGAL_SIAP) {
            \Log::warning("TANGGAL_SIAP is null for ID_PENJUALAN: {$transaksi->ID_PENJUALAN}");
            return;
        }

        try {
            $tanggalSiap = Carbon::createFromFormat('Y-m-d H:i:s', $transaksi->TANGGAL_SIAP, 'Asia/Jakarta');
            $scheduleDate = $tanggalSiap->format('Y-m-d');
            $sessionTime = $tanggalSiap->format('H:i');
        } catch (\Exception $e) {
            \Log::error("Invalid TANGGAL_SIAP format for ID_PENJUALAN: {$transaksi->ID_PENJUALAN}, Value: {$transaksi->TANGGAL_SIAP}, Error: {$e->getMessage()}");
            return;
        }

        // Common notification data
        $notificationData = [
            'transaksi_id' => (string)$transaksi->ID_PENJUALAN,
            'schedule_date' => $scheduleDate,
            'session_time' => $sessionTime,
            'no_nota' => $transaksi->NO_NOTA_PENJUALAN
        ];

        // Check METODE_PENGIRIMAN
        $isSelfPickup = strtolower($transaksi->METODE_PENGIRIMAN) === 'diambil sendiri';

        // Notify Kurir (only for 'dikirim')
        if (!$isSelfPickup) {
            $kurir = $transaksi->pegawaiKurir;
            if ($kurir && $kurir->fcm_token && $kurir->hasRole('kurir')) {
                \Log::info("Kurir found: ID_PEGAWAI: {$kurir->ID_PEGAWAI}, FCM_TOKEN: {$kurir->fcm_token}");
                $result = $this->notificationService->sendNotification(
                    $kurir->fcm_token,
                    'Jadwal Pengiriman Baru',
                    "Pengiriman dijadwalkan pada {$scheduleDate} jam {$sessionTime} (Nota: {$transaksi->NO_NOTA_PENJUALAN}).",
                    $notificationData
                );
                \Log::info("Kurir notification result for ID_PENJUALAN: {$transaksi->ID_PENJUALAN}", $result);
            } else {
                \Log::warning("Kurir notification skipped: FCM_TOKEN: " . ($kurir->fcm_token ?? 'null') . ", Role: " . ($kurir->hasRole('kurir') ? 'kurir' : 'not kurir'));
            }
        } else {
            \Log::info("Kurir notification skipped: METODE_PENGIRIMAN is 'diambil sendiri' for ID_PENJUALAN: {$transaksi->ID_PENJUALAN}");
        }

        // Notify Pembeli
        $pembeli = $transaksi->pembeli;
        if ($pembeli && $pembeli->fcm_token) {
            \Log::info("Pembeli found: ID_PEMBELI: {$pembeli->ID_PEMBELI}, FCM_TOKEN: {$pembeli->fcm_token}");
            $title = $isSelfPickup ? 'Jadwal Pengambilan Pesanan' : 'Pembaruan Jadwal Pengiriman';
            $message = $isSelfPickup
                ? "Pesanan Anda (Nota: {$transaksi->NO_NOTA_PENJUALAN}) dapat diambil pada {$scheduleDate} jam {$sessionTime}."
                : "Pesanan Anda (Nota: {$transaksi->NO_NOTA_PENJUALAN}) dijadwalkan untuk dikirim pada {$scheduleDate} jam {$sessionTime}.";
            $result = $this->notificationService->sendNotification(
                $pembeli->fcm_token,
                $title,
                $message,
                $notificationData
            );
            \Log::info("Pembeli notification result for ID_PENJUALAN: {$transaksi->ID_PENJUALAN}", $result);
        } else {
            \Log::warning("Pembeli notification skipped: FCM_TOKEN: " . ($pembeli->fcm_token ?? 'null'));
        }

        // Notify Penitip (all consignors for items in the transaction)
        $barangTitipans = $transaksi->barangTitipan;
        $notifiedPenitips = []; // Track notified penitips to avoid duplicates
        foreach ($barangTitipans as $barang) {
            $penitip = $barang->penitipan ? $barang->penitipan->penitip : null;
            if ($penitip && $penitip->fcm_token && !in_array($penitip->ID_PENITIP, $notifiedPenitips)) {
                \Log::info("Penitip found: ID_PENITIP: {$penitip->ID_PENITIP}, FCM_TOKEN: {$penitip->fcm_token}, KODE_PRODUK: {$barang->KODE_PRODUK}");
                $title = $isSelfPickup ? 'Barang Titipan Anda Siap Diambil Pembeli' : 'Barang Anda Akan Dikirim kepada Pembeli';
                $message = $isSelfPickup
                    ? "Barang Anda (Kode: {$barang->KODE_PRODUK}, Nota: {$transaksi->NO_NOTA_PENJUALAN}) siap diambil pada {$scheduleDate} jam {$sessionTime}."
                    : "Barang Anda (Kode: {$barang->KODE_PRODUK}, Nota: {$transaksi->NO_NOTA_PENJUALAN}) dijadwalkan untuk dikirim pada {$scheduleDate} jam {$sessionTime}.";
                $result = $this->notificationService->sendNotification(
                    $penitip->fcm_token,
                    $title,
                    $message,
                    array_merge($notificationData, ['barang_id' => $barang->KODE_PRODUK])
                );
                \Log::info("Penitip notification result for ID_PENJUALAN: {$transaksi->ID_PENJUALAN}, KODE_PRODUK: {$barang->KODE_PRODUK}", $result);
                $notifiedPenitips[] = $penitip->ID_PENITIP;
            } else {
                \Log::warning("Penitip notification skipped: ID_PENITIP: " . ($penitip->ID_PENITIP ?? 'null') . ", FCM_TOKEN: " . ($penitip->fcm_token ?? 'null') . ", KODE_PRODUK: {$barang->KODE_PRODUK}");
            }
        }
    }
}