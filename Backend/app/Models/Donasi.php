<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Donasi extends Model
{
    use HasFactory;

    protected $table = 'donasis';
    protected $primaryKey = 'ID_REQUEST';
    public $timestamps = true;

    protected $fillable = [
        'KODE_PRODUK',
        'ID_REQUEST',
        'NAMA_PENERIMA',
        'TANGGAL_DONASI',
    ];

    public function requestDonasi()
    {
        return $this->belongsTo(RequestDonasi::class, 'ID_REQUEST');
    }

    public function barangTitipan()
    {
        return $this->belongsTo(BarangTitipan::class, 'KODE_PRODUK');
    }
}
