<?php

namespace App\Listeners;

use App\Events\BarangTitipanExpiryReminder;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Log;

class SendBarangTitipanExpiryReminderNotification
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function handle(BarangTitipanExpiryReminder $event)
    {
        $barang = $event->barangTitipan;
        $penitip = $barang->penitipan ? $barang->penitipan->penitip : null;

        if (!$penitip || !$penitip->fcm_token) {
            Log::warning("Expiry reminder not sent for KODE_PRODUK: {$barang->KODE_PRODUK}. Penitip: " . ($penitip ? 'found' : 'not found') . ", FCM_TOKEN: " . ($penitip && $penitip->fcm_token ? 'exists' : 'null'));
            return;
        }

        Log::info("Sending expiry reminder notification to penitip ID: {$penitip->ID_PENITIP} for KODE_PRODUK: {$barang->KODE_PRODUK}");
        $result = $this->notificationService->sendNotification(
            $penitip->fcm_token,
            'Pengingat Barang Akan Kadaluarsa',
            "Barang Anda '{$barang->NAMA}' akan kadaluarsa dalam 3 hari. Segera perpanjang atau ambil kembali.",
            ['barang_id' => $barang->KODE_PRODUK]
        );
        Log::info("Expiry reminder notification result for penitip ID: {$penitip->ID_PENITIP}", ['result' => $result]);
    }
}