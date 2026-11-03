<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\BarangTitipan;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use App\Events\BarangTitipanExpiryReminder;
use Illuminate\Support\Facades\Cache;

class SendExpiryReminder extends Command
{
    protected $signature = 'consignments:send-expiry-reminder';
    protected $description = 'Send reminder notifications for BarangTitipan nearing expiry (within 72 hours)';

    public function __construct()
    {
        parent::__construct();
    }

    public function handle()
    {
        try {
            Log::info('Starting consignments:send-expiry-reminder command');

            // Calculate the time 72 hours from now
            $expiryThreshold = Carbon::now()->addHours(72);

            // Fetch items that are Tersedia, not yet extended, and within 72 hours of expiry
            $nearingExpiryItems = BarangTitipan::where('STATUS', 'Tersedia')
                ->where('TANGGAL_KADALUARSA', '<=', $expiryThreshold)
                ->where('TANGGAL_KADALUARSA', '>', Carbon::now())
                ->whereNull('TANGGAL_PERPANJANGAN')
                ->get();

            if ($nearingExpiryItems->isEmpty()) {
                Log::info('No items nearing expiry found within 72 hours');
                $this->info('No items nearing expiry found within 72 hours');
                return 0;
            }

            $notifiedCount = 0;
            foreach ($nearingExpiryItems as $item) {
                // Create a unique cache key for this item's reminder
                $cacheKey = "expiry_reminder_{$item->KODE_PRODUK}";

                // Check if a reminder has already been sent
                if (Cache::has($cacheKey)) {
                    Log::info("Skipping reminder for KODE_PRODUK: {$item->KODE_PRODUK}, already notified");
                    continue;
                }

                // Trigger the expiry reminder event
                event(new BarangTitipanExpiryReminder($item));
                Log::info("Triggered expiry reminder for KODE_PRODUK: {$item->KODE_PRODUK}");

                // Store in cache to prevent future notifications
                Cache::put($cacheKey, true, now()->addDays(7)); // Cache for 7 days
                $notifiedCount++;
            }

            Log::info("Successfully triggered {$notifiedCount} expiry reminder notifications");
            $this->info("Successfully triggered {$notifiedCount} expiry reminder notifications");

            return 0;
        } catch (\Exception $e) {
            Log::error("Failed to send expiry reminders: " . $e->getMessage());
            $this->error("Failed to send expiry reminders: " . $e->getMessage());
            return 1;
        }
    }
}