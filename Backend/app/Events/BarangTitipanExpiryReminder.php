<?php

namespace App\Events;

use App\Models\BarangTitipan;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BarangTitipanExpiryReminder
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $barangTitipan;

    public function __construct(BarangTitipan $barangTitipan)
    {
        $this->barangTitipan = $barangTitipan;
    }
}