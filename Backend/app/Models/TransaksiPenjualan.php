<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TransaksiPenjualan extends Model
{
    use HasFactory;

    protected $table = 'transaksipenjualans';
    protected $primaryKey = 'ID_PENJUALAN';
    public $timestamps = true;

    protected $fillable = [
        'ID_PEMBELI',
        'ID_PEGAWAI_GUDANG',
        'ID_PEGAWAI_CS',
        'ID_PEGAWAI_KURIR',
        'NO_NOTA_PENJUALAN',
        'TOTAL_BIAYA',
        'ONGKIR',
        'POIN_TERPAKAI',
        'TOTAL_AKHIR',
        'POIN_DIPEROLEH',
        'TANGGAL_PESANAN',
        'TANGGAL_PEMBAYARAN',
        'BUKTI_PEMBAYARAN',
        'METODE_PENGIRIMAN',
        'TANGGAL_SIAP',
        'STATUS',
        'TOTAL_POIN_PEMBELI',
        'ALAMAT_PENGIRIMAN',
        'PRODUCT_SNAPSHOT',
    ];

    protected $casts = [
        'TANGGAL_PESANAN' => 'datetime',
        'TANGGAL_PEMBAYARAN' => 'datetime',
        'TANGGAL_SIAP' => 'datetime',
    ];

    public static function generateNoNotaPenjualan($idPenjualan)
    {
        try {
            $year = now()->format('Y'); // e.g., 2025
            $month = now()->format('m'); // e.g., 06

            // Format the invoice number using ID_PENJUALAN
            $invoiceNumber = sprintf('%s.%s.%d', $year, $month, $idPenjualan);
            Log::info("Generated NO_NOTA_PENJUALAN: {$invoiceNumber} for ID_PENJUALAN: {$idPenjualan}");

            return $invoiceNumber;
        } catch (\Exception $e) {
            Log::error('Failed to generate NO_NOTA_PENJUALAN: ' . $e->getMessage());
            return sprintf('%s.%s.%d', now()->format('Y'), now()->format('m'), $idPenjualan);
        }
    }

    public function pembeli()
    {
        return $this->belongsTo(Pembeli::class, 'ID_PEMBELI');
    }

    public function pegawaiGudang()
    {
        return $this->belongsTo(Pegawai::class, 'ID_PEGAWAI_GUDANG');
    }

    public function pegawaiCS()
    {
        return $this->belongsTo(Pegawai::class, 'ID_PEGAWAI_CS');
    }

    public function pegawaiKurir()
    {
        return $this->belongsTo(Pegawai::class, 'ID_PEGAWAI_KURIR');
    }

    public function barangTitipan()
    {
        return $this->hasMany(BarangTitipan::class, 'ID_PENJUALAN');
    }
}