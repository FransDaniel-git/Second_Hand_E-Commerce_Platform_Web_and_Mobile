<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Laravel\Sanctum\HasApiTokens;


class Pegawai extends Authenticatable implements JWTSubject
{
    use HasFactory, HasApiTokens, Notifiable, HasRoles;

    protected $table = 'pegawais';
    protected $primaryKey = 'ID_PEGAWAI';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = true;

    protected $fillable = [
        'ID_PEGAWAI', 'ID_JABATAN', 'NAMA', 'TELEPON', 'ALAMAT', 'TGL_LAHIR', 'EMAIL', 'PASSWORD', 'STATUS',
    ];

    protected $hidden = [
        'PASSWORD',
    ];

    public function jabatan()
    {
        return $this->belongsTo(Jabatan::class, 'ID_JABATAN');
    }

    // Fungsi untuk assign role berdasarkan jabatan
    public function assignRoleByJabatan()
    {
        $jabatan = $this->jabatan; // Ambil jabatan pegawai
        if ($jabatan) {
            // Tentukan role berdasarkan jabatan
            switch ($jabatan->ID_JABATAN) {
                case 1:
                    $this->assignRole('owner');
                    break;
                case 2:
                    $this->assignRole('cs');
                    break;
                case 3:
                    $this->assignRole('gudang');
                    break;
                case 4:
                    $this->assignRole('kurir');
                    break;
                case 5:
                    $this->assignRole('hunter');
                    break;
                case 6:
                    $this->assignRole('admin');
                    break;
                case 7:
                    $this->assignRole('adminbiasa');
                    break;
                default:
                    break;
            }
        }
    }

    // JWTSubject methods
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

    public function diskusi()
    {
        return $this->hasMany(Diskusi::class, 'ID_PEGAWAI');
    }

    public function penitip()
    {
        return $this->hasMany(Penitip::class, 'ID_PEGAWAI');
    }

    public function requestDonasi()
    {
        return $this->hasMany(RequestDonasi::class, 'ID_PEGAWAI');
    }

    public function komisi()
    {
        return $this->hasMany(Komisi::class, 'ID_PEGAWAI');
    }

    public function transaksiPenitipan()
    {
        return $this->hasMany(TransaksiPenitipan::class, 'ID_PEGAWAI_HUNTER');
    }

    public function transaksiPenjualan()
    {
        return $this->hasMany(TransaksiPenjualan::class, 'ID_PEGAWAI_GUDANG');
    }

    public static function generateIdPegawai() 
{
    // Gunakan database transaction untuk mencegah race condition
    return \DB::transaction(function() {
        // Ambil ID pegawai tertinggi saat ini
        $lastId = self::max('ID_PEGAWAI');
        
        if (!$lastId) {
            // Jika tidak ada data, mulai dari P1
            return 'P1';
        }
        
        // Ambil angka dari ID terakhir
        $lastNumber = (int) substr($lastId, 1);
        
        // Buat ID baru dengan menambahkan 1
        $newNumber = $lastNumber + 1;
        $newId = 'P' . $newNumber;
        
        // Periksa apakah ID baru sudah ada untuk memastikan keunikan
        while (self::where('ID_PEGAWAI', $newId)->exists()) {
            $newNumber++;
            $newId = 'P' . $newNumber;
        }
        
        return $newId;
    });
}
}
