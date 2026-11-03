<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePembelisTable extends Migration
{
    public function up()
    {
        Schema::create('pembelis', function (Blueprint $table) {
            $table->increments('ID_PEMBELI');
            $table->string('NAMA', 50)->nullable();
            $table->string('TELEPON', 20)->nullable();
            $table->integer('POIN_LOYALITAS')->nullable();
            $table->string('EMAIL', 250)->nullable();
            $table->string('PASSWORD', 250)->nullable();
            $table->longtext('FOTO_PEMBELI')->nullable();
            $table->enum('STATUS', ['active', 'inactive'])->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('pembelis');
    }
}