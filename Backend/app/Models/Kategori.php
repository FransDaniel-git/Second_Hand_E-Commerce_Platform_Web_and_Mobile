<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kategori extends Model
{
    use HasFactory;

    protected $table = 'kategoris';
    protected $primaryKey = 'ID_KATEGORI';
    public $timestamps = true;

    protected $fillable = [
        'NAMA',
    ];

    public function subkategori()
    {
        return $this->hasMany(Subkategori::class, 'ID_KATEGORI');
    }
}
