<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule)
    {
        // Run expiry status update daily at midnight
        $schedule->command('consignments:update-expired')
                 ->everyTwoMinutes();

        // Run expiry reminder notification daily at midnight
        $schedule->command('consignments:send-expiry-reminder')
                 ->everyTwoMinutes();
        
        $schedule->call(function () {
                    $deadline = now()->subMinute();
                    $transactions = TransaksiPenjualan::where('STATUS', 'Menunggu Pembayaran')
                        ->where('TANGGAL_PESANAN', '<', $deadline)
                        ->get();
            
                    foreach ($transactions as $transaction) {
                        DB::transaction(function () use ($transaction) {
                            // Refund poin jika digunakan
                            if ($transaction->POIN_TERPAKAI > 0) {
                                $pembeli = Pembeli::findOrFail($transaction->ID_PEMBELI);
                                $pembeli->POIN_LOYALITAS += $transaction->POIN_TERPAKAI;
                                $pembeli->save();
                                Log::info("Refunded {$transaction->POIN_TERPAKAI} points to pembeli ID: {$transaction->ID_PEMBELI}");
                            }
            
                            // Update status transaksi
                            $transaction->STATUS = 'Dibatalkan';
                            $transaction->save();
            
                            // Kembalikan status produk ke 'Tersedia'
                            $updated = BarangTitipan::where('ID_PENJUALAN', $transaction->ID_PENJUALAN)
                                ->update([
                                    'STATUS' => 'Tersedia',
                                    'ID_PENJUALAN' => null
                                ]);
                            Log::info("Updated {$updated} products to 'Tersedia' for transaction ID_PENJUALAN: {$transaction->ID_PENJUALAN}");
                        });
                    }
                })->everyMinute();

        $schedule->command('topseller:calculate')
                 ->monthlyOn(1, '00:00');
    }

    protected function commands()
    {
        $this->load(__DIR__.'/Commands');
        require base_path('routes/console.php');
    }
}