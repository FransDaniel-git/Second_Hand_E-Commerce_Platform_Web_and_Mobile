<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIdPenitipToPenukaransTable extends Migration
{
    public function up()
    {
        Schema::table('penukarans', function (Blueprint $table) {
            $table->string('ID_PENITIP', 10)->nullable()->after('ID_PEMBELI');
            $table->foreign('ID_PENITIP')->references('ID_PENITIP')->on('penitips')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::table('penukarans', function (Blueprint $table) {
            $table->dropForeign(['ID_PENITIP']);
            $table->dropColumn('ID_PENITIP');
        });
    }
}