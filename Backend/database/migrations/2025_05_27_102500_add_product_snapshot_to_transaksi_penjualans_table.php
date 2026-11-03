<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddProductSnapshotToTransaksiPenjualansTable extends Migration
{
    public function up()
    {
        Schema::table('transaksipenjualans', function (Blueprint $table) {
            $table->json('PRODUCT_SNAPSHOT')->nullable()->after('BUKTI_PEMBAYARAN');
        });
    }

    public function down()
    {
        Schema::table('transaksipenjualans', function (Blueprint $table) {
            $table->dropColumn('PRODUCT_SNAPSHOT');
        });
    }
}