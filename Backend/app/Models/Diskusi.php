<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Diskusi extends Model
{
    use HasFactory;

    protected $table = 'diskusis';
    protected $primaryKey = 'ID_DISKUSI';
    public $timestamps = false;

    protected $fillable = [
        'ID_BALASANDISKUSI',
        'ID_PEGAWAI',
        'ID_PEMBELI',
        'KODE_PRODUK',
        'PESAN',
        'TANGGAL_DIBUAT',
    ];

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class, 'ID_PEGAWAI');
    }

    public function pembeli()
    {
        return $this->belongsTo(Pembeli::class, 'ID_PEMBELI');
    }

    public function barangTitipan()
    {
        return $this->belongsTo(BarangTitipan::class, 'KODE_PRODUK');
    }

    public function balasan()
    {
        return $this->hasMany(Diskusi::class, 'ID_BALASANDISKUSI');
    }
}