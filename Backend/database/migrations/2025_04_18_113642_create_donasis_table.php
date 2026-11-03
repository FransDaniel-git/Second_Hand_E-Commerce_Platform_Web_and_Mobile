<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDonasisTable extends Migration
{
    public function up()
    {
        Schema::create('donasis', function (Blueprint $table) {
            $table->string('KODE_PRODUK', 10);
            $table->unsignedInteger('ID_REQUEST');
            $table->string('NAMA_PENERIMA', 50)->nullable();
            $table->dateTime('TANGGAL_DONASI', 6)->nullable();
            $table->primary('ID_REQUEST');
            $table->foreign('ID_REQUEST')->references('ID_REQUEST')->on('requestdonasis')->onDelete('cascade');
            $table->foreign('KODE_PRODUK')->references('KODE_PRODUK')->on('barangtitipans')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('donasis');
    }
}