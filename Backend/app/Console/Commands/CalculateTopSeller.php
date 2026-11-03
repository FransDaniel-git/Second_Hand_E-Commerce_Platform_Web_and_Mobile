<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Penitip;
use App\Models\TopSeller;
use App\Models\TransaksiPenjualan;
use App\Models\BarangTitipan;
use App\Models\Komisi;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class CalculateTopSeller extends Command
{
    protected $signature = 'topseller:calculate';
    protected $description = 'Calculate the top seller from the previous month based on total sales value and manage badges and bonuses';

    public function handle()
    {
        DB::beginTransaction();
        try {
            // Step 1: Determine the previous month
            $now = Carbon::now();
            $previousMonthStart = $now->copy()->subMonth()->startOfMonth();
            $previousMonthEnd = $now->copy()->subMonth()->endOfMonth();
            $currentMonthStart = $now->startOfMonth();
            $currentMonthEnd = $now->endOfMonth();

            // Step 2: Calculate the top seller based on total HARGA_JUAL
            $topSellerData = TransaksiPenjualan::whereIn('transaksipenjualans.STATUS', ['Sudah Diambil', 'Sudah Diterima'])
                ->whereBetween('transaksipenjualans.TANGGAL_PEMBAYARAN', [
                    $previousMonthStart->toDateTimeString(),
                    $previousMonthEnd->toDateTimeString()
                ])
                ->join('barangtitipans', 'transaksipenjualans.ID_PENJUALAN', '=', 'barangtitipans.ID_PENJUALAN')
                ->join('transaksipenitipans', 'barangtitipans.ID_PENITIPAN', '=', 'transaksipenitipans.ID_PENITIPAN')
                ->groupBy('transaksipenitipans.ID_PENITIP')
                ->select(
                    'transaksipenitipans.ID_PENITIP',
                    DB::raw('SUM(barangtitipans.HARGA_JUAL) as total_sales_value')
                )
                ->orderBy('total_sales_value', 'desc')
                ->first();

            if ($topSellerData) {
                $topPenitipId = $topSellerData->ID_PENITIP;

                // Step 3: Calculate bonus based on 1% of total HARGA_JUAL
                $totalSalesValue = $topSellerData->total_sales_value;
                $bonus = $totalSalesValue * 0.01;

                $penitip = Penitip::find($topPenitipId);
                if ($penitip) {
                    $penitip->SALDO += $bonus;
                    $penitip->BADGE = 1;
                    $penitip->save();

                    TopSeller::create([
                        'ID_PENITIP' => $topPenitipId,
                        'TANGGAL_MULAI' => $currentMonthStart,
                        'TANGGAL_SELESAI' => $currentMonthEnd,
                    ]);

                    Log::info("Top seller updated: ID_PENITIP = {$topPenitipId}, Total Sales Value = {$totalSalesValue}, Bonus added = {$bonus}");
                } else {
                    Log::warning("Penitip not found: ID_PENITIP = {$topPenitipId}");
                }
            } else {
                Log::info("No transactions found for the previous month.");
            }

            // Step 4: Handle expired top sellers
            $expiredTopSellers = TopSeller::where('TANGGAL_SELESAI', '<', $now->startOfDay())->get();
            foreach ($expiredTopSellers as $expired) {
                $penitip = Penitip::find($expired->ID_PENITIP);
                if ($penitip && $penitip->BADGE == 1) {
                    $penitip->BADGE = 0;
                    $penitip->save();
                    Log::info("Expired top seller badge reset: ID_PENITIP = {$expired->ID_PENITIP}");
                }
            }

            DB::commit();
            $this->info('Top seller calculation completed successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error in CalculateTopSeller: ' . $e->getMessage());
            $this->error('An error occurred while calculating the top seller.');
        }
    }
}