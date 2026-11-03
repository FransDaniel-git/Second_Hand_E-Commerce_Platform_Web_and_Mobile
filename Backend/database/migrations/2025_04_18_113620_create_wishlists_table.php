<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateWishlistsTable extends Migration
{
    public function up()
    {
        Schema::create('wishlists', function (Blueprint $table) {
            $table->increments('ID_WISHLIST');
            $table->unsignedInteger('ID_PEMBELI');
            $table->string('KODE_PRODUK', 10);
            $table->foreign('ID_PEMBELI')->references('ID_PEMBELI')->on('pembelis')->onDelete('cascade');
            $table->foreign('KODE_PRODUK')->references('KODE_PRODUK')->on('barangtitipans')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('wishlists');
    }
}