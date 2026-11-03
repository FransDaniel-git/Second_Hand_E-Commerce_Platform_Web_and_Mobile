<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class JabatanSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('jabatans')->insert([
            ['nama' => 'Owner'],
            ['nama' => 'Customer Service'],
            ['nama' => 'Gudang'],
            ['nama' => 'Kurir'],
            ['nama' => 'Hunter'],
            ['nama' => 'Admin'],
            ['nama' => 'Admin Biasa'],
        ]);
    }
}