<?php

namespace App\Observers;

use App\Models\BarangTitipan;
use App\Events\BarangTitipanStatusChanged;
use Illuminate\Support\Facades\Cache;

class BarangTitipanObserver
{
    public function updated(BarangTitipan $barangTitipan)
    {
        if ($barangTitipan->isDirty('STATUS')) {
            // Trigger status change event
            event(new BarangTitipanStatusChanged($barangTitipan, $barangTitipan->STATUS));

            // Clear expiry reminder cache to allow future reminders if item becomes Tersedia again
            $cacheKey = "expiry_reminder_{$barangTitipan->KODE_PRODUK}";
            Cache::forget($cacheKey);
        }
    }
}