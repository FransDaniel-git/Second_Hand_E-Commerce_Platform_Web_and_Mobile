<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTopsellersTable extends Migration
{
    public function up()
    {
        Schema::create('topsellers', function (Blueprint $table) {
            $table->increments('ID_TOPSELLER');
            $table->string('ID_PENITIP', 10);
            $table->dateTime('TANGGAL_MULAI', 6)->nullable();
            $table->dateTime('TANGGAL_SELESAI', 6)->nullable();
            $table->foreign('ID_PENITIP')->references('ID_PENITIP')->on('penitips')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('topsellers');
    }
}