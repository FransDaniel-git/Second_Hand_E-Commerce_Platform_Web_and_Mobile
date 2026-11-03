<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\BarangTitipan;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class UpdateExpiredConsignments extends Command
{
    protected $signature = 'consignments:update-expired';
    protected $description = 'Update status of BarangTitipan to Kadaluarsa if past TANGGAL_KADALUARSA';

    public function __construct()
    {
        parent::__construct();
    }

    public function handle()
    {
        try {
            Log::info('Starting consignments:update-expired command');

            // Ambil barang titipan dengan status 'Tersedia' yang sudah melewati tanggal kadaluarsa
            $expiredItems = BarangTitipan::where('STATUS', 'Tersedia')
                ->where('TANGGAL_KADALUARSA', '<', Carbon::now())
                ->get();

            if ($expiredItems->isEmpty()) {
                Log::info('No expired consignments found');
                $this->info('No expired consignments found');
                return 0;
            }

            $updatedCount = 0;
            foreach ($expiredItems as $item) {
                $item->update(['STATUS' => 'Kadaluarsa']);
                Log::info("Updated KODE_PRODUK: {$item->KODE_PRODUK} to Kadaluarsa");
                $updatedCount++;
            }

            Log::info("Successfully updated {$updatedCount} consignments to Kadaluarsa");
            $this->info("Successfully updated {$updatedCount} consignments to Kadaluarsa");

            return 0;
        } catch (\Exception $e) {
            Log::error("Failed to update expired consignments: " . $e->getMessage());
            $this->error("Failed to update expired consignments: " . $e->getMessage());
            return 1;
        }
    }
}