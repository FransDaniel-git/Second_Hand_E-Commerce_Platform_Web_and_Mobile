<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Jabatan extends Model
{
    use HasFactory;

    protected $table = 'jabatans';
    protected $primaryKey = 'ID_JABATAN';
    public $timestamps = true;

    protected $fillable = [
        'NAMA',
    ];

    public function pegawai()
    {
        return $this->hasMany(Pegawai::class, 'ID_JABATAN');
    }
}
