<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateBarangTitipansTable extends Migration
{
    public function up()
    {
        Schema::create('barangtitipans', function (Blueprint $table) {
            $table->string('KODE_PRODUK', 10);
            $table->unsignedInteger('ID_SUBKATEGORI');
            $table->unsignedInteger('ID_PENITIPAN');
            $table->unsignedInteger('ID_PENJUALAN')->nullable();
            $table->string('NAMA', 50)->nullable();
            $table->integer('HARGA_JUAL')->nullable();
            $table->double('BERAT')->nullable();
            $table->dateTime('TANGGAL_KADALUARSA', 6)->nullable();
            $table->dateTime('TANGGAL_PERPANJANGAN', 6)->nullable();
            $table->string('STATUS', 20)->nullable();
            $table->boolean('TERJUAL_CEPAT')->nullable();
            $table->string('KONDISI', 20)->nullable();
            $table->dateTime('TANGGAL_GARANSI', 6)->nullable();
            $table->integer('rating')->nullable();
            $table->longtext('DESKRIPSI')->nullable();
            $table->primary('KODE_PRODUK');
            $table->foreign('ID_SUBKATEGORI')->references('ID_SUBKATEGORI')->on('subkategoris')->onDelete('cascade');
            $table->foreign('ID_PENITIPAN')->references('ID_PENITIPAN')->on('transaksipenitipans')->onDelete('cascade');
            $table->foreign('ID_PENJUALAN')->references('ID_PENJUALAN')->on('transaksipenjualans')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('barangtitipans');
    }
}