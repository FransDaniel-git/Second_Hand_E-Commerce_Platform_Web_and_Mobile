<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subkategori extends Model
{
    use HasFactory;

    protected $table = 'subkategoris';
    protected $primaryKey = 'ID_SUBKATEGORI';
    public $timestamps = true;

    protected $fillable = [
        'ID_KATEGORI',
        'NAMASUB',
    ];

    public function kategori()
    {
        return $this->belongsTo(Kategori::class, 'ID_KATEGORI');
    }

    public function barangTitipan()
    {
        return $this->hasMany(BarangTitipan::class, 'ID_SUBKATEGORI');
    }
}