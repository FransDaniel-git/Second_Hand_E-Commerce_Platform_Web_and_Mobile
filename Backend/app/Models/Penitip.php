<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;
use Spatie\Permission\Traits\HasRoles;

class Penitip extends Authenticatable implements JWTSubject
{
    use HasFactory, HasApiTokens, HasRoles;

    protected $table = 'penitips';
    protected $primaryKey = 'ID_PENITIP';
    public $incrementing = false;
    public $timestamps = true;

    protected $fillable = [
        'ID_PEGAWAI',
        'NAMA',
        'ALAMAT',
        'TELEPON',
        'SALDO',
        'POIN_LOYALITAS',
        'RATING',
        'BADGE',
        'NO_KTP',
        'EMAIL',
        'PASSWORD',
        'STATUS',
        'JLH_PENJUALAN',
        'FOTO_KTP',
    ];

    protected $hidden = [
        'PASSWORD',
    ];

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class, 'ID_PEGAWAI');
    }

    public function barangTitipan()
    {
        return $this->hasMany(BarangTitipan::class, 'ID_PENITIPAN');
    }

    public function transaksiPenitipan()
    {
        return $this->hasMany(TransaksiPenitipan::class, 'ID_PENITIP');
    }

    public function komisi()
    {
        return $this->hasMany(Komisi::class, 'ID_PENITIP');
    }

    public function topseller()
    {
        return $this->hasMany(Topseller::class, 'ID_PENITIP');
    }

    public static function generateIdPenitip()
    {
        // Start from the highest existing ID to ensure uniqueness
        $maxId = self::max('ID_PENITIP');
        
        if ($maxId) {
            // Extract the numeric part and increment
            $numericPart = (int) substr($maxId, 1);
            $nextNumericPart = $numericPart + 1;
        } else {
            $nextNumericPart = 1; // Start from 1 if no records exist
        }
        
        $newId = 'T' . $nextNumericPart;
        
        // Check if the generated ID already exists (to be extra safe)
        while (self::where('ID_PENITIP', $newId)->exists()) {
            $nextNumericPart++;
            $newId = 'T' . $nextNumericPart;
        }
        
        return $newId;
    }

    /**
    * Get the identifier that will be stored in the subject claim of the JWT.
    *
    * @return mixed
    */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
    * Return a key value array, containing any custom claims to be added to the JWT.
    *
    * @return array
    */
    public function getJWTCustomClaims()
    {
        return [];
    }
}