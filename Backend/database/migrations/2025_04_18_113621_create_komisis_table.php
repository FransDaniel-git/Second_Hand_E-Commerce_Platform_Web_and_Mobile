<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateKomisisTable extends Migration
{
    public function up()
    {
        Schema::create('komisis', function (Blueprint $table) {
            $table->string('KODE_PRODUK', 10);
            $table->string('ID_PEGAWAI', 10)->nullable();
            $table->string('ID_PENITIP', 10);
            $table->integer('KOMISI_PENITIP')->nullable();
            $table->integer('KOMISI_HUNTER')->nullable();
            $table->integer('KOMISI_REUSEMART')->nullable();
            $table->integer('BONUS')->nullable();
            $table->primary('KODE_PRODUK');
            $table->foreign('KODE_PRODUK')->references('KODE_PRODUK')->on('barangtitipans')->onDelete('cascade');
            $table->foreign('ID_PEGAWAI')->references('ID_PEGAWAI')->on('pegawais')->onDelete('cascade');
            $table->foreign('ID_PENITIP')->references('ID_PENITIP')->on('penitips')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('komisis');
    }
}