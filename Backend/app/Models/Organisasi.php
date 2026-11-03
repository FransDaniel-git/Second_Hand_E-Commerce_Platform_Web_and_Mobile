<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;
use Spatie\Permission\Traits\HasRoles;

class Organisasi extends Authenticatable implements JWTSubject
{
    use HasFactory, HasApiTokens, HasRoles;

    protected $table = 'organisasis';
    protected $primaryKey = 'ID_ORGANISASI';
    public $incrementing = false;
    public $timestamps = true;

    protected $fillable = [
        'ID_ORGANISASI',
        'NAMA',
        'ALAMAT',
        'TELEPON',
        'DESKRIPSI',
        'EMAIL',
        'PASSWORD',
        'STATUS',
        'FOTO_ORGANISASI',
    ];

    protected $hidden = [
        'PASSWORD',
    ];

    public function requestDonasi()
    {
        return $this->hasMany(RequestDonasi::class, 'ID_ORGANISASI');
    }

    public static function generateIdOrganisasi()
    {
        // Find the highest numeric ID currently in use
        $maxId = self::orderBy('ID_ORGANISASI', 'desc')->first();
        
        if ($maxId) {
            // Extract the numeric part
            $lastIdNumber = (int) substr($maxId->ID_ORGANISASI, 3);
        } else {
            $lastIdNumber = 0;
        }
        
        // Increment to get the next ID
        $nextIdNumber = $lastIdNumber + 1;
        
        // Generate the new ID
        $newId = 'ORG' . $nextIdNumber;
        
        // Check if this ID already exists (rare case but possible)
        while (self::where('ID_ORGANISASI', $newId)->exists()) {
            $nextIdNumber++;
            $newId = 'ORG' . $nextIdNumber;
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