<?php

namespace App\Listeners;

use App\Events\BarangTitipanStatusChanged;
use App\Services\NotificationService;
use App\Models\Penitip;
use Illuminate\Support\Facades\Log;

class SendBarangTitipanStatusNotification
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handle(BarangTitipanStatusChanged $event)
    {
        $barang = $event->barangTitipan;
        $newStatus = $event->newStatus;

        // Fetch penitip from the barang's penitipan relationship
        $penitip = $barang->penitipan ? $barang->penitipan->penitip : null;

        if (!$penitip || !$penitip->fcm_token) {
            Log::warning("Notification not sent for KODE_PRODUK: {$barang->KODE_PRODUK}. Penitip: " . ($penitip ? 'found' : 'not found') . ", FCM_TOKEN: " . ($penitip && $penitip->fcm_token ? 'exists' : 'null'));
            return;
        }

        // Handle different status changes
        if ($newStatus === 'Telah Didonasikan') {
            Log::info("Sending donation notification to penitip ID: {$penitip->ID_PENITIP} for KODE_PRODUK: {$barang->KODE_PRODUK}");
            $result = $this->notificationService->sendNotification(
                $penitip->fcm_token,
                'Barang Didonasikan',
                "Barang Anda '{$barang->NAMA}' Telah Didonasikan.",
                ['barang_id' => $barang->KODE_PRODUK]
            );
            Log::info("Notification result for penitip ID: {$penitip->ID_PENITIP}", ['result' => $result]);
        } elseif ($newStatus === 'Kadaluarsa') {
            Log::info("Sending expiration notification to penitip ID: {$penitip->ID_PENITIP} for KODE_PRODUK: {$barang->KODE_PRODUK}");
            $result = $this->notificationService->sendNotification(
                $penitip->fcm_token,
                'Barang Kadaluarsa',
                "Barang Anda '{$barang->NAMA}' telah melewati masa penitipan dan berstatus Kadaluarsa.",
                ['barang_id' => $barang->KODE_PRODUK]
            );
            Log::info("Notification result for penitip ID: {$penitip->ID_PENITIP}", ['result' => $result]);
        }
    }
}