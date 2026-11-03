<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrganisasisTable extends Migration
{
    public function up()
    {
        Schema::create('organisasis', function (Blueprint $table) {
            $table->string('ID_ORGANISASI', 10);
            $table->string('NAMA', 250)->nullable();
            $table->longtext('ALAMAT')->nullable();
            $table->string('TELEPON', 20)->nullable();
            $table->longtext('DESKRIPSI')->nullable();
            $table->string('EMAIL', 250)->nullable();
            $table->string('PASSWORD', 250)->nullable();
            $table->enum('STATUS', ['active', 'inactive'])->nullable();
            $table->longtext('FOTO_ORGANISASI')->nullable();
            $table->primary('ID_ORGANISASI');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('organisasis');
    }
}