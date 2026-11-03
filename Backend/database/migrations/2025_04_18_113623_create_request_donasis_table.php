<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRequestDonasisTable extends Migration
{
    public function up()
    {
        Schema::create('requestdonasis', function (Blueprint $table) {
            $table->increments('ID_REQUEST');
            $table->string('ID_ORGANISASI', 10);
            $table->string('ID_PEGAWAI', 10)->nullable();
            $table->longText('DESKRIPSI_PERMINTAAN')->nullable();
            $table->dateTime('TANGGAL_PERMINTAAN', 6)->nullable();
            $table->string('STATUS', 20)->nullable();
            $table->foreign('ID_ORGANISASI')->references('ID_ORGANISASI')->on('organisasis')->onDelete('cascade');
            $table->foreign('ID_PEGAWAI')->references('ID_PEGAWAI')->on('pegawais')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('requestdonasis');
    }
}