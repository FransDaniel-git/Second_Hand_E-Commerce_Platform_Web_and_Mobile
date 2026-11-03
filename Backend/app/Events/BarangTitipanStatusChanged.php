<?php

namespace App\Events;

use App\Models\BarangTitipan;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BarangTitipanStatusChanged
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $barangTitipan;
    public $newStatus;

    public function __construct(BarangTitipan $barangTitipan, string $newStatus)
    {
        $this->barangTitipan = $barangTitipan;
        $this->newStatus = $newStatus;
    }
}