<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMerchandisesTable extends Migration
{
    public function up()
    {
        Schema::create('merchandises', function (Blueprint $table) {
            $table->increments('ID_MERCHANDISE');
            $table->string('NAMA', 50)->nullable();
            $table->string('DESKRIPSI', 250)->nullable();
            $table->integer('POIN_DIBUTUHKAN')->nullable();
            $table->integer('STOK')->nullable();
            $table->string('URL_GAMBAR')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('merchandises');
    }
}
