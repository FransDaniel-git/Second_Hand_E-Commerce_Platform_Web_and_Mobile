<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePenitipsTable extends Migration
{
    public function up()
    {
        Schema::create('penitips', function (Blueprint $table) {
            $table->string('ID_PENITIP', 10);
            $table->string('ID_PEGAWAI', 10);
            $table->string('NAMA', 50)->nullable();
            $table->string('ALAMAT', 250)->nullable();
            $table->string('TELEPON', 20)->nullable();
            $table->double('SALDO')->nullable();
            $table->integer('POIN_LOYALITAS')->nullable();
            $table->double('RATING')->nullable();
            $table->boolean('BADGE')->nullable();
            $table->string('NO_KTP', 20)->nullable();
            $table->string('EMAIL', 250)->nullable();
            $table->string('PASSWORD', 250)->nullable();
            $table->enum('STATUS', ['active', 'inactive'])->nullable();
            $table->integer('JLH_PENJUALAN')->nullable();
            $table->string('FOTO_KTP', 100)->nullable();
            $table->primary('ID_PENITIP');
            $table->foreign('ID_PEGAWAI')->references('ID_PEGAWAI')->on('pegawais')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('penitips');
    }
}