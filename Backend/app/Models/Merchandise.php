<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Merchandise extends Model
{
    use HasFactory;

    protected $table = 'merchandises';
    protected $primaryKey = 'ID_MERCHANDISE';
    public $timestamps = true;

    protected $fillable = [
        'NAMA',
        'DESKRIPSI',
        'POIN_DIBUTUHKAN',
        'STOK',
        'URL_GAMBAR',
    ];
}
