<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDiskusisTable extends Migration
{
    public function up()
    {
        Schema::create('diskusis', function (Blueprint $table) {
            $table->increments('ID_DISKUSI');
            $table->unsignedInteger('ID_BALASANDISKUSI')->nullable();
            $table->string('ID_PEGAWAI', 10)->nullable();
            $table->unsignedInteger('ID_PEMBELI')->nullable();
            $table->string('KODE_PRODUK', 10);
            $table->longText('PESAN')->nullable();
            $table->dateTime('TANGGAL_DIBUAT', 6)->nullable();
            $table->primary('ID_DISKUSI');
            $table->foreign('ID_BALASANDISKUSI')->references('ID_DISKUSI')->on('diskusis')->onDelete('cascade');
            $table->foreign('ID_PEGAWAI')->references('ID_PEGAWAI')->on('pegawais')->onDelete('cascade');
            $table->foreign('ID_PEMBELI')->references('ID_PEMBELI')->on('pembelis')->onDelete('cascade');
            $table->foreign('KODE_PRODUK')->references('KODE_PRODUK')->on('barangtitipans')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('diskusis');
    }
}