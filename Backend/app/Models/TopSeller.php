<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TopSeller extends Model
{
    use HasFactory;

    protected $table = 'topsellers';
    protected $primaryKey = 'ID_TOPSELLER';
    public $timestamps = true;

    protected $fillable = [
        'ID_PENITIP',
        'TANGGAL_MULAI',
        'TANGGAL_SELESAI',
    ];

    public function penitip()
    {
        return $this->belongsTo(Penitip::class, 'ID_PENITIP');
    }
}