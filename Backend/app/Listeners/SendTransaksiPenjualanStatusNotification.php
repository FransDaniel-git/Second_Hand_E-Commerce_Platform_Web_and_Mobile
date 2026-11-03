<?php

namespace App\Listeners;

use App\Events\TransaksiPenjualanStatusChanged;
use App\Services\NotificationService;
use App\Models\Penitip;
use App\Models\Pegawai;
use App\Models\Pembeli;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class SendTransaksiPenjualanStatusNotification
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handle(TransaksiPenjualanStatusChanged $event)
    {
        $transaksi = $event->transaksiPenjualan;
        $status = $event->newStatus;
        Log::info("SendTransaksiPenjualanStatusNotification handling ID_PENJUALAN: {$transaksi->ID_PENJUALAN}, STATUS: {$status}");

        // Common notification data
        $notificationData = [
            'transaksi_id' => (string)$transaksi->ID_PENJUALAN,
            'no_nota' => $transaksi->NO_NOTA_PENJUALAN
        ];

        // Handle "Sedang Dikemas" status
        if ($status === 'Sedang Dikemas') {
            // Notify Pembeli
            $pembeli = $transaksi->pembeli;
            if ($pembeli && $pembeli->fcm_token) {
                Log::info("Pembeli found: ID_PEMBELI: {$pembeli->ID_PEMBELI}, FCM_TOKEN: {$pembeli->fcm_token}");
                $result = $this->notificationService->sendNotification(
                    $pembeli->fcm_token,
                    'Pembayaran Anda Telah Diverifikasi',
                    "Pesanan Anda (Nota: {$transaksi->NO_NOTA_PENJUALAN}) sedang dikemas.",
                    $notificationData
                );
                Log::info("Pembeli notification result for ID_PENJUALAN: {$transaksi->ID_PENJUALAN}", ['result' => $result]);
            } else {
                Log::warning("Pembeli notification skipped: Pembeli: " . ($pembeli ? 'found' : 'not found') . ", FCM_TOKEN: " . ($pembeli && $pembeli->fcm_token ? 'exists' : 'null'));
            }

            // Notify Penitip
            $barangTitipans = $transaksi->barangTitipan;
            $notifiedPenitips = [];
            foreach ($barangTitipans as $barang) {
                $penitip = $barang->penitipan ? $barang->penitipan->penitip : null;
                if ($penitip && $penitip->fcm_token && !in_array($penitip->ID_PENITIP, $notifiedPenitips)) {
                    Log::info("Penitip found: ID_PENITIP: {$penitip->ID_PENITIP}, FCM_TOKEN: {$penitip->fcm_token}, KODE_PRODUK: {$barang->KODE_PRODUK}");
                    $result = $this->notificationService->sendNotification(
                        $penitip->fcm_token,
                        'Barang Anda Sudah Laku',
                        "Barang Anda (Kode: {$barang->KODE_PRODUK}, Nota: {$transaksi->NO_NOTA_PENJUALAN}) sedang dikemas untuk pengiriman atau pengambilan.",
                        array_merge($notificationData, ['barang_id' => $barang->KODE_PRODUK])
                    );
                    Log::info("Penitip notification result for ID_PENJUALAN: {$transaksi->ID_PENJUALAN}, KODE_PRODUK: {$barang->KODE_PRODUK}", ['result' => $result]);
                    $notifiedPenitips[] = $penitip->ID_PENITIP;
                } else {
                    Log::warning("Penitip notification skipped: ID_PENITIP: " . ($penitip ? $penitip->ID_PENITIP : 'null') . ", FCM_TOKEN: " . ($penitip && $penitip->fcm_token ? 'exists' : 'null') . ", KODE_PRODUK: {$barang->KODE_PRODUK}");
                }
            }
        }

        // Handle "Sedang Dikirim" status
        if ($status === 'Sedang Dikirim') {
            // Notify Pembeli
            $pembeli = $transaksi->pembeli;
            if ($pembeli && $pembeli->fcm_token) {
                Log::info("Pembeli found: ID_PEMBELI: {$pembeli->ID_PEMBELI}, FCM_TOKEN: {$pembeli->fcm_token}");
                $result = $this->notificationService->sendNotification(
                    $pembeli->fcm_token,
                    'Pesanan Anda Sedang Dikirim',
                    "Pesanan Anda (Nota: {$transaksi->NO_NOTA_PENJUALAN}) sedang dalam proses pengiriman oleh kurir.",
                    $notificationData
                );
                Log::info("Pembeli notification result for ID_PENJUALAN: {$transaksi->ID_PENJUALAN}", ['result' => $result]);
            } else {
                Log::warning("Pembeli notification skipped: Pembeli: " . ($pembeli ? 'found' : 'not found') . ", FCM_TOKEN: " . ($pembeli && $pembeli->fcm_token ? 'exists' : 'null'));
            }

            // Notify Penitip
            $barangTitipans = $transaksi->barangTitipan;
            $notifiedPenitips = [];
            foreach ($barangTitipans as $barang) {
                $penitip = $barang->penitipan ? $barang->penitipan->penitip : null;
                if ($penitip && $pembeli->fcm_token && !in_array($penitip->ID_PENITIP, $notifiedPenitips)) {
                    Log::info("Penitip found: ID_PENITIP: {$penitip->ID_PENITIP}, FCM_TOKEN: {$penitip->fcm_token}, KODE_PRODUK: {$barang->KODE_PRODUK}");
                    $result = $this->notificationService->sendNotification(
                        $penitip->fcm_token,
                        'Barang Anda Sedang Dikirim kepada Pembeli',
                        "Barang Anda (Kode: {$barang->KODE_PRODUK}, Nota: {$transaksi->NO_NOTA_PENJUALAN}) sedang dalam proses pengiriman oleh kurir.",
                        array_merge($notificationData, ['barang_id' => $barang->KODE_PRODUK])
                    );
                    Log::info("Penitip notification result for ID_PENJUALAN: {$transaksi->ID_PENJUALAN}, KODE_PRODUK: {$barang->KODE_PRODUK}", ['result' => $result]);
                    $notifiedPenitips[] = $penitip->ID_PENITIP;
                } else {
                    Log::warning("Penitip notification skipped: ID_PENITIP: " . ($penitip ? $penitip->ID_PENITIP : 'null') . ", FCM_TOKEN: " . ($penitip && $penitip->fcm_token ? 'exists' : 'null') . ", KODE_PRODUK: {$barang->KODE_PRODUK}");
                }
            }
        }

        // Handle "Sudah Diterima" status
        if ($status === 'Sudah Diterima') {
            // Notify Pembeli
            $pembeli = $transaksi->pembeli;
            if ($pembeli && $pembeli->fcm_token) {
                Log::info("Pembeli found: ID_PEMBELI: {$pembeli->ID_PEMBELI}, FCM_TOKEN: {$pembeli->fcm_token}");
                $result = $this->notificationService->sendNotification(
                    $pembeli->fcm_token,
                    'Pesanan Anda Telah Diterima',
                    "Pesanan Anda (Nota: {$transaksi->NO_NOTA_PENJUALAN}) telah diterima. Terima kasih atas pembelian Anda!",
                    $notificationData
                );
                Log::info("Pembeli notification result for ID_PENJUALAN: {$transaksi->ID_PENJUALAN}", ['result' => $result]);
            } else {
                Log::warning("Pembeli notification skipped: Pembeli: " . ($pembeli ? 'found' : 'not found') . ", FCM_TOKEN: " . ($pembeli && $pembeli->fcm_token ? 'exists' : 'null'));
            }

            // Notify Penitip
            $barangTitipans = $transaksi->barangTitipan;
            $notifiedPenitips = [];
            foreach ($barangTitipans as $barang) {
                $penitip = $barang->penitipan ? $barang->penitipan->penitip : null;
                if ($penitip && $penitip->fcm_token && !in_array($penitip->ID_PENITIP, $notifiedPenitips)) {
                    Log::info("Penitip found: ID_PENITIP: {$penitip->ID_PENITIP}, FCM_TOKEN: {$penitip->fcm_token}, KODE_PRODUK: {$barang->KODE_PRODUK}");
                    $result = $this->notificationService->sendNotification(
                        $penitip->fcm_token,
                        'Barang Anda Telah Diterima Pembeli',
                        "Barang Anda (Kode: {$barang->KODE_PRODUK}, Nota: {$transaksi->NO_NOTA_PENJUALAN}) telah diterima oleh pembeli.",
                        array_merge($notificationData, ['barang_id' => $barang->KODE_PRODUK])
                    );
                    Log::info("Penitip notification result for ID_PENJUALAN: {$transaksi->ID_PENJUALAN}, KODE_PRODUK: {$barang->KODE_PRODUK}", ['result' => $result]);
                    $notifiedPenitips[] = $penitip->ID_PENITIP;
                } else {
                    Log::warning("Penitip notification skipped: ID_PENITIP: " . ($penitip ? $penitip->ID_PENITIP : 'null') . ", FCM_TOKEN: " . ($penitip && $penitip->fcm_token ? 'exists' : 'null') . ", KODE_PRODUK: {$barang->KODE_PRODUK}");
                }
            }
        }

        // Handle "Sudah Diambil" status
        if ($status === 'Sudah Diambil') {
            // Notify Pembeli
            $pembeli = $transaksi->pembeli;
            if ($pembeli && $pembeli->fcm_token) {
                Log::info("Pembeli found: ID_PEMBELI: {$pembeli->ID_PEMBELI}, FCM_TOKEN: {$pembeli->fcm_token}");
                $result = $this->notificationService->sendNotification(
                    $pembeli->fcm_token,
                    'Pesanan Anda Telah Diambil',
                    "Pesanan Anda (Nota: {$transaksi->NO_NOTA_PENJUALAN}) telah diambil.",
                    $notificationData
                );
                Log::info("Pembeli notification result for ID_PENJUALAN: {$transaksi->ID_PENJUALAN}", ['result' => $result]);
            } else {
                Log::warning("Pembeli notification skipped: Pembeli: " . ($pembeli ? 'found' : 'not found') . ", FCM_TOKEN: " . ($pembeli && $pembeli->fcm_token ? 'exists' : 'null'));
            }

            // Notify Penitip
            $barangTitipans = $transaksi->barangTitipan;
            $notifiedPenitips = [];
            foreach ($barangTitipans as $barang) {
                $penitip = $barang->penitipan ? $barang->penitipan->penitip : null;
                if ($penitip && $penitip->fcm_token && !in_array($penitip->ID_PENITIP, $notifiedPenitips)) {
                    Log::info("Penitip found: ID_PENITIP: {$penitip->ID_PENITIP}, FCM_TOKEN: {$penitip->fcm_token}, KODE_PRODUK: {$barang->KODE_PRODUK}");
                    $result = $this->notificationService->sendNotification(
                        $penitip->fcm_token,
                        'Barang Titipan Anda Telah Diambil Pembeli',
                        "Barang Anda (Kode: {$barang->KODE_PRODUK}, Nota: {$transaksi->NO_NOTA_PENJUALAN}) telah diambil oleh pembeli.",
                        array_merge($notificationData, ['barang_id' => $barang->KODE_PRODUK])
                    );
                    Log::info("Penitip notification result for ID_PENJUALAN: {$transaksi->ID_PENJUALAN}, KODE_PRODUK: {$barang->KODE_PRODUK}", ['result' => $result]);
                    $notifiedPenitips[] = $penitip->ID_PENITIP;
                } else {
                    Log::warning("Penitip notification skipped: ID_PENITIP: " . ($penitip ? $penitip->ID_PENITIP : 'null') . ", FCM_TOKEN: " . ($penitip && $penitip->fcm_token ? 'exists' : 'null') . ", KODE_PRODUK: {$barang->KODE_PRODUK}");
                }
            }
        }

        if ($status === 'Siap Diambil') {

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
            // Notify Pembeli
            $pembeli = $transaksi->pembeli;
            if ($pembeli && $pembeli->fcm_token) {
                Log::info("Pembeli found: ID_PEMBELI: {$pembeli->ID_PEMBELI}, FCM_TOKEN: {$pembeli->fcm_token}");
                $result = $this->notificationService->sendNotification(
                    $pembeli->fcm_token,
                    'Jadwal Pengambilan Pesanan',
                    "Pesanan Anda (Nota: {$transaksi->NO_NOTA_PENJUALAN}) dapat diambil pada {$scheduleDate} jam {$sessionTime}.",
                    $notificationData
                );
                Log::info("Pembeli notification result for ID_PENJUALAN: {$transaksi->ID_PENJUALAN}", ['result' => $result]);
            } else {
                Log::warning("Pembeli notification skipped: Pembeli: " . ($pembeli ? 'found' : 'not found') . ", FCM_TOKEN: " . ($pembeli && $pembeli->fcm_token ? 'exists' : 'null'));
            }

            // Notify Penitip
            $barangTitipans = $transaksi->barangTitipan;
            $notifiedPenitips = [];
            foreach ($barangTitipans as $barang) {
                $penitip = $barang->penitipan ? $barang->penitipan->penitip : null;
                if ($penitip && $penitip->fcm_token && !in_array($penitip->ID_PENITIP, $notifiedPenitips)) {
                    Log::info("Penitip found: ID_PENITIP: {$penitip->ID_PENITIP}, FCM_TOKEN: {$penitip->fcm_token}, KODE_PRODUK: {$barang->KODE_PRODUK}");
                    $result = $this->notificationService->sendNotification(
                        $penitip->fcm_token,
                        'Barang Titipan Anda Siap Diambil Pembeli',
                        "Barang Anda (Kode: {$barang->KODE_PRODUK}, Nota: {$transaksi->NO_NOTA_PENJUALAN}) dijadwalkan untuk dikirim pada {$scheduleDate} jam {$sessionTime}.",
                        array_merge($notificationData, ['barang_id' => $barang->KODE_PRODUK])
                    );
                    Log::info("Penitip notification result for ID_PENJUALAN: {$transaksi->ID_PENJUALAN}, KODE_PRODUK: {$barang->KODE_PRODUK}", ['result' => $result]);
                    $notifiedPenitips[] = $penitip->ID_PENITIP;
                } else {
                    Log::warning("Penitip notification skipped: ID_PENITIP: " . ($penitip ? $penitip->ID_PENITIP : 'null') . ", FCM_TOKEN: " . ($penitip && $penitip->fcm_token ? 'exists' : 'null') . ", KODE_PRODUK: {$barang->KODE_PRODUK}");
                }
            }
        }
    }
}