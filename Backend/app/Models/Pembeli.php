<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;

class Pembeli extends Authenticatable implements JWTSubject
{
    use HasFactory, HasApiTokens, HasRoles;

    protected $table = 'pembelis';
    protected $primaryKey = 'ID_PEMBELI';
    public $timestamps = false;

    protected $fillable = [
        'NAMA',
        'FOTO_PEMBELI',
        'TELEPON',
        'POIN_LOYALITAS',
        'EMAIL',
        'PASSWORD',
        'STATUS',
    ];
    protected $hidden = [
        'PASSWORD',
    ];

    public function alamat()
    {
        return $this->hasMany(Alamat::class, 'ID_PEMBELI');
    }

    public function diskusi()
    {
        return $this->hasMany(Diskusi::class, 'ID_PEMBELI');
    }

    public function penukaran()
    {
        return $this->hasMany(Penukaran::class, 'ID_PEMBELI');
    }

    public function transaksiPenjualan()
    {
        return $this->hasMany(TransaksiPenjualan::class, 'ID_PEMBELI');
    }

    public function wishlist()
    {
        return $this->hasMany(Wishlist::class, 'ID_PEMBELI');
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

    public function getFotoPembeliAttribute($value)
    {
        if ($value) {
            return Storage::disk('public')->url($value);
        }
        return asset('images/default-profile.png'); // Default image from assets
    }

}