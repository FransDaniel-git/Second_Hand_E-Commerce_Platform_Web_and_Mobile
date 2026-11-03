<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePenukaransTable extends Migration
{
    public function up()
    {
        Schema::create('penukarans', function (Blueprint $table) {
            $table->increments('ID_PENUKARAN');
            $table->unsignedInteger('ID_PEMBELI');
            $table->unsignedInteger('ID_MERCHANDISE');
            $table->string('ID_PEGAWAI', 10);
            $table->integer('POIN_DIGUNAKAN')->nullable();
            $table->integer('KODE_PENUKARAN')->nullable();
            $table->dateTime('TANGGAL_PENUKARAN', 6)->nullable();
            $table->dateTime('TANGGAL_DIKLAIM', 6)->nullable();
            $table->foreign('ID_PEMBELI')->references('ID_PEMBELI')->on('pembelis')->onDelete('cascade');
            $table->foreign('ID_MERCHANDISE')->references('ID_MERCHANDISE')->on('merchandises')->onDelete('cascade');
            $table->foreign('ID_PEGAWAI')->references('ID_PEGAWAI')->on('pegawais')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('penukarans');
    }
}