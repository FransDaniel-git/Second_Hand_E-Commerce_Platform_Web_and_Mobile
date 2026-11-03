<?php

namespace App\Events;

use App\Models\TransaksiPenjualan;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TransaksiPenjualanTanggalSiapSet
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $transaksiPenjualan;

    public function __construct(TransaksiPenjualan $transaksiPenjualan)
    {
        $this->transaksiPenjualan = $transaksiPenjualan;
    }
}