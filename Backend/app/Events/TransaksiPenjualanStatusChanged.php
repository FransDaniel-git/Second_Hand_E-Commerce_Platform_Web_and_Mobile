<?php

namespace App\Events;

use App\Models\TransaksiPenjualan;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TransaksiPenjualanStatusChanged
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $transaksiPenjualan;
    public $newStatus;

    public function __construct(TransaksiPenjualan $transaksiPenjualan, string $newStatus)
    {
        $this->transaksiPenjualan = $transaksiPenjualan;
        $this->newStatus = $newStatus;
    }
}