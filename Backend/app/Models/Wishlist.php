<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Wishlist extends Model
{
    use HasFactory;

    protected $table = 'wishlists';
    protected $primaryKey = 'ID_WISHLIST';
    public $timestamps = true;

    protected $fillable = [
        'KODE_PRODUK',
        'ID_PEMBELI',
    ];

    public function barangTitipan()
    {
        return $this->belongsTo(BarangTitipan::class, 'KODE_PRODUK', 'KODE_PRODUK');
    }

    public function pembeli()
    {
        return $this->belongsTo(Pembeli::class, 'ID_PEMBELI', 'ID_PEMBELI');
    }
}