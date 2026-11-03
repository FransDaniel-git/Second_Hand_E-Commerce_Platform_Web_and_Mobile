<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Komisi extends Model
{
    use HasFactory;

    protected $table = 'komisis';
    protected $primaryKey = 'KODE_PRODUK';
    public $incrementing = false;
    public $timestamps = true;

    protected $fillable = [
        'KODE_PRODUK',
        'ID_PEGAWAI',
        'ID_PENITIP',
        'KOMISI_PENITIP',
        'KOMISI_HUNTER',
        'KOMISI_REUSEMART',
        'BONUS',
    ];

    public function barangTitipan()
    {
        return $this->belongsTo(BarangTitipan::class, 'KODE_PRODUK');
    }

    public function penitip()
    {
        return $this->belongsTo(Penitip::class, 'ID_PENITIP');
    }

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class, 'ID_PEGAWAI');
    }
}