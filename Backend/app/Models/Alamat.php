<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Alamat extends Model
{
    use HasFactory;

    protected $table = 'alamats';
    protected $primaryKey = 'ID_ALAMAT';
    public $timestamps = true;

    protected $fillable = [
        'ID_PEMBELI',
        'JALAN',
        'KECAMATAN',
        'KELURAHAN',
        'KOTA',
        'KODE_POS',
        'ALAMAT_UTAMA',
    ];

    public function pembeli()
    {
        return $this->belongsTo(Pembeli::class, 'ID_PEMBELI');
    }
}
