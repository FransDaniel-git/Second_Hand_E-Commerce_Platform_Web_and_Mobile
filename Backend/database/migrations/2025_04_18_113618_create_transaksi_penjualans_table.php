<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTransaksiPenjualansTable extends Migration
{
    public function up()
    {
        Schema::create('transaksipenjualans', function (Blueprint $table) {
            $table->increments('ID_PENJUALAN');
            $table->unsignedInteger('ID_PEMBELI');
            $table->string('ID_PEGAWAI_GUDANG', 10)->nullable();
            $table->string('ID_PEGAWAI_CS', 10)->nullable();
            $table->string('ID_PEGAWAI_KURIR', 10)->nullable();
            $table->string('NO_NOTA_PENJUALAN', 50)->nullable();
            $table->integer('TOTAL_BIAYA')->nullable();
            $table->integer('ONGKIR')->nullable();
            $table->integer('POIN_TERPAKAI')->nullable();
            $table->integer('TOTAL_AKHIR')->nullable();
            $table->integer('POIN_DIPEROLEH')->nullable();
            $table->dateTime('TANGGAL_PESANAN', 6)->nullable();
            $table->dateTime('TANGGAL_PEMBAYARAN', 6)->nullable();
            $table->longtext('BUKTI_PEMBAYARAN')->nullable();
            $table->string('METODE_PENGIRIMAN', 50)->nullable();
            $table->dateTime('TANGGAL_SIAP', 6)->nullable();
            $table->string('STATUS', 20)->nullable();
            $table->integer('TOTAL_POIN_PEMBELI')->nullable();
            $table->longText('ALAMAT_PENGIRIMAN')->nullable();
            $table->foreign('ID_PEMBELI')->references('ID_PEMBELI')->on('pembelis')->onDelete('cascade');
            $table->foreign('ID_PEGAWAI_GUDANG')->references('ID_PEGAWAI')->on('pegawais')->onDelete('cascade');
            $table->foreign('ID_PEGAWAI_CS')->references('ID_PEGAWAI')->on('pegawais')->onDelete('cascade');
            $table->foreign('ID_PEGAWAI_KURIR')->references('ID_PEGAWAI')->on('pegawais')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('transaksipenjualans');
    }
}