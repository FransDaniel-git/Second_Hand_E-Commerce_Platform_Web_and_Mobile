<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Penukaran extends Model
{
    use HasFactory;

    protected $table = 'penukarans';
    protected $primaryKey = 'ID_PENUKARAN';
    public $timestamps = true;

    protected $fillable = [
        'ID_PEMBELI',
        'ID_PENITIP',
        'ID_MERCHANDISE',
        'ID_PEGAWAI',
        'POIN_DIGUNAKAN',
        'KODE_PENUKARAN',
        'TANGGAL_PENUKARAN',
        'TANGGAL_DIKLAIM',
    ];

    public function pembeli()
    {
        return $this->belongsTo(Pembeli::class, 'ID_PEMBELI');
    }

    public function merchandise()
    {
        return $this->belongsTo(Merchandise::class, 'ID_MERCHANDISE');
    }

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class, 'ID_PEGAWAI');
    }

    public function penitip()
    {
        return $this->belongsTo(Penitip::class, 'ID_PENITIP');
    }
}
