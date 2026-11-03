<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BarangTitipan extends Model
{
    use HasFactory;

    protected $table = 'barangtitipans';
    protected $primaryKey = 'KODE_PRODUK';
    public $incrementing = false;
    public $timestamps = true;

    protected $fillable = [
        'KODE_PRODUK',
        'ID_SUBKATEGORI',
        'ID_PENITIPAN',
        'ID_PENJUALAN',
        'NAMA',
        'HARGA_JUAL',
        'BERAT',
        'TANGGAL_KADALUARSA',
        'TANGGAL_PERPANJANGAN',
        'STATUS',
        'TERJUAL_CEPAT',
        'KONDISI',
        'TANGGAL_GARANSI',
        'rating',
        'DESKRIPSI',
        'TANGGAL_KONFIRMASI',
    ];

    public function subkategori()
    {
        return $this->belongsTo(Subkategori::class, 'ID_SUBKATEGORI');
    }

    public function penitipan()
    {
        return $this->belongsTo(TransaksiPenitipan::class, 'ID_PENITIPAN');
    }

    public function penjualan()
    {
        return $this->belongsTo(TransaksiPenjualan::class, 'ID_PENJUALAN');
    }

    public function diskusi()
    {
        return $this->hasMany(Diskusi::class, 'KODE_PRODUK');
    }

    public function fotoProduk()
    {
        return $this->hasMany(FotoProduk::class, 'KODE_PRODUK');
    }

    public function komisi()
    {
        return $this->hasOne(Komisi::class, 'KODE_PRODUK', 'KODE_PRODUK');
    }

    public static function generateKodeProduk($namaBarang)
    {
        // Take the first letter of the item name and convert to uppercase
        $prefix = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $namaBarang), 0, 1));

        // Find the largest KODE_PRODUK number across all records
        $lastBarang = BarangTitipan::selectRaw('MAX(CAST(REGEXP_REPLACE(KODE_PRODUK, "[^0-9]", "") AS UNSIGNED)) as max_number')
            ->first();

        $newNumber = $lastBarang->max_number ? $lastBarang->max_number + 1 : 1;

        // Return the new KODE_PRODUK with prefix and incremented number
        return $prefix . $newNumber;
    }

    /**
 * Set the TERJUAL_CEPAT field based on the difference between transaction date and consignment date.
 *
 * @param \Carbon\Carbon $transactionDate
 * @return void
 */
public function setTerjualCepat($transactionDate)
{
    // Check if penitipan exists, TANGGAL_PENITIPAN is not null, and transactionDate is after TANGGAL_PENITIPAN
    if ($this->penitipan && $this->penitipan->TANGGAL_PENITIPAN && $transactionDate > $this->penitipan->TANGGAL_PENITIPAN) {
        $daysDifference = $this->penitipan->TANGGAL_PENITIPAN->diffInDays($transactionDate);
        $this->TERJUAL_CEPAT = $daysDifference < 7 ? 1 : 0;
    } else {
        $this->TERJUAL_CEPAT = 0; // Default to 0 if conditions are not met
    }
}
}