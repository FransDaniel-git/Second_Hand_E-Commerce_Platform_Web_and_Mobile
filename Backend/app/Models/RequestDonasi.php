<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RequestDonasi extends Model
{
    use HasFactory;

    protected $table = 'requestdonasis';
    protected $primaryKey = 'ID_REQUEST';
    public $timestamps = true;

    protected $fillable = [
        'ID_ORGANISASI',
        'ID_PEGAWAI',
        'DESKRIPSI_PERMINTAAN',
        'TANGGAL_PERMINTAAN',
        'STATUS',
    ];

    public function organisasi()
    {
        return $this->belongsTo(Organisasi::class, 'ID_ORGANISASI');
    }

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class, 'ID_PEGAWAI');
    }

    public function donasi()
    {
        return $this->hasMany(Donasi::class, 'ID_REQUEST');
    }
}
