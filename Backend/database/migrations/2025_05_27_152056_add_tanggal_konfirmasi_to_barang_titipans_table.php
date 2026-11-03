<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddTanggalKonfirmasiToBarangTitipansTable extends Migration
{
    public function up()
    {
        Schema::table('barangtitipans', function (Blueprint $table) {
            $table->dateTime('TANGGAL_KONFIRMASI', 6)->nullable()->after('DESKRIPSI');
        });
    }

    public function down()
    {
        Schema::table('barangtitipans', function (Blueprint $table) {
            $table->dropColumn('TANGGAL_KONFIRMASI');
        });
    }
}