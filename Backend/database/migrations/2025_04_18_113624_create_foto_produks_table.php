<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFotoProduksTable extends Migration
{
    public function up()
    {
        Schema::create('foto_produk', function (Blueprint $table) {
            $table->increments('ID_FOTO');
            $table->string('KODE_PRODUK', 10);
            $table->longtext('URL_FOTO')->nullable();
            $table->boolean('IS_UTAMA')->default(0);
            $table->foreign('KODE_PRODUK')->references('KODE_PRODUK')->on('barangtitipans')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('foto_produk');
    }
}