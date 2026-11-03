<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSubkategorisTable extends Migration
{
    public function up()
    {
        Schema::create('subkategoris', function (Blueprint $table) {
            $table->increments('ID_SUBKATEGORI');
            $table->unsignedInteger('ID_KATEGORI');
            $table->string('NAMASUB', 70)->nullable();
            $table->foreign('ID_KATEGORI')->references('ID_KATEGORI')->on('kategoris')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('subkategoris');
    }
}