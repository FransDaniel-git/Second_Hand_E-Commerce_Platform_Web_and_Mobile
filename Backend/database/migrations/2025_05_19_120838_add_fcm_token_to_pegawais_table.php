<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddFcmTokenToPegawaisTable extends Migration
{
    public function up()
    {
        // Tambahkan kondisi ini
        if (!Schema::hasColumn('pegawais', 'fcm_token')) {
            Schema::table('pegawais', function (Blueprint $table) {
                $table->string('fcm_token')->nullable()->after('PASSWORD');
            });
        }
    }

    public function down()
    {
        // Tambahkan kondisi ini
        if (Schema::hasColumn('pegawais', 'fcm_token')) {
            Schema::table('pegawais', function (Blueprint $table) {
                $table->dropColumn('fcm_token');
            });
        }
    }
}