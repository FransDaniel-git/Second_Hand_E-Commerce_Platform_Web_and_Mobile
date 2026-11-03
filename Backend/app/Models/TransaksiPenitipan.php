<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransaksiPenitipan extends Model
{
    use HasFactory;

    protected $table = 'transaksipenitipans';
    protected $primaryKey = 'ID_PENITIPAN';
    public $timestamps = true;

    protected $fillable = [
        'ID_PENITIP',
        'ID_PEGAWAI_HUNTER',
        'ID_PEGAWAI_QC',
        'NO_NOTA_PENITIPAN',
        'TANGGAL_PENITIPAN',
        'TOTAL_NILAI_BARANG',
        'CATATAN',
    ];

    // Add this to cast TANGGAL_PENITIPAN to a Carbon instance
    protected $casts = [
        'TANGGAL_PENITIPAN' => 'datetime',
    ];

    public function penitip()
    {
        return $this->belongsTo(Penitip::class, 'ID_PENITIP');
    }

    public function pegawaiHunter()
    {
        return $this->belongsTo(Pegawai::class, 'ID_PEGAWAI_HUNTER');
    }

    public function pegawaiQC()
    {
        return $this->belongsTo(Pegawai::class, 'ID_PEGAWAI_QC');
    }

    public function barangTitipan()
    {
        return $this->hasMany(BarangTitipan::class, 'ID_PENITIPAN');
    }

    public static function generateNoNotaPenitipan($idPenitipan)
    {
        try {
            $year = date('Y');
            $month = date('m');
            return sprintf('%s.%s.%d', $year, $month, $idPenitipan);
        } catch (\Exception $e) {
            \Log::error('Gagal generate NO_NOTA_PENITIPAN: ' . $e->getMessage());
            return sprintf('%s.%s.%d', date('Y'), date('m'), $idPenitipan);
        }
    }
}