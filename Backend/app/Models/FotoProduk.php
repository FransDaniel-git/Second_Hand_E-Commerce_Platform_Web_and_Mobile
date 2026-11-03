<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FotoProduk extends Model
{
    use HasFactory;

    protected $table = 'foto_produk';
    protected $primaryKey = 'ID_FOTO';
    public $timestamps = true;

    protected $fillable = [
        'KODE_PRODUK',
        'URL_FOTO',
        'IS_UTAMA',
    ];

    public function barangTitipan()
    {
        return $this->belongsTo(BarangTitipan::class, 'KODE_PRODUK');
    }
}