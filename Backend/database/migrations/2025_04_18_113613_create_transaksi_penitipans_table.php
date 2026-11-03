<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTransaksiPenitipansTable extends Migration
{
    public function up()
    {
        Schema::create('transaksipenitipans', function (Blueprint $table) {
            $table->increments('ID_PENITIPAN');
            $table->string('ID_PENITIP', 10);
            $table->string('ID_PEGAWAI_HUNTER', 10)->nullable();
            $table->string('ID_PEGAWAI_QC', 10);
            $table->string('NO_NOTA_PENITIPAN', 20)->nullable();
            $table->dateTime('TANGGAL_PENITIPAN', 6)->nullable();
            $table->integer('TOTAL_NILAI_BARANG')->nullable();
            $table->string('CATATAN', 250)->nullable();
            $table->foreign('ID_PENITIP')->references('ID_PENITIP')->on('penitips')->onDelete('cascade');
            $table->foreign('ID_PEGAWAI_HUNTER')->references('ID_PEGAWAI')->on('pegawais')->onDelete('cascade');
            $table->foreign('ID_PEGAWAI_QC')->references('ID_PEGAWAI')->on('pegawais')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('transaksipenitipans');
    }
}