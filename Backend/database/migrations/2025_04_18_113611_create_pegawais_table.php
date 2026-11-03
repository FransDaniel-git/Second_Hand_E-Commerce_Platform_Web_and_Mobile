<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePegawaisTable extends Migration
{
    public function up()
    {
        Schema::create('pegawais', function (Blueprint $table) {
            $table->string('ID_PEGAWAI', 10);
            $table->unsignedInteger('ID_JABATAN');
            $table->string('NAMA', 50)->nullable();
            $table->string('TELEPON', 20)->nullable();
            $table->string('ALAMAT', 250)->nullable();
            $table->date('TGL_LAHIR')->nullable();
            $table->string('EMAIL', 250)->nullable();
            $table->string('PASSWORD', 250)->nullable();
            $table->enum('STATUS', ['active', 'inactive'])->nullable();
            $table->primary('ID_PEGAWAI');
            $table->foreign('ID_JABATAN')->references('ID_JABATAN')->on('jabatans')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('pegawais');
    }
}