<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\Pegawai;
use App\Models\Pembeli;
use App\Models\Organisasi;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates or updates roles and permissions for all user types
     *
     * @return void
     */
    public function run()
    {
        $this->createOrUpdateRoles();
        $this->createOrUpdatePermissions();
        $this->assignPermissionsToRoles();
    }

    /**
     * Create or update all roles
     *
     * @return void
     */
    private function createOrUpdateRoles()
    {
        // Staff roles (pegawai guard)
        $pegawaiRoles = [
            'owner',
            'admin',
            'cs',
            'gudang',
            'kurir',
            'hunter',
            'adminbiasa'
        ];

        foreach ($pegawaiRoles as $roleName) {
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'pegawai']);
        }

        // Other user type roles with their specific guards
        $otherRoles = [
            ['name' => 'pembeli', 'guard_name' => 'pembeli'],
            ['name' => 'organisasi', 'guard_name' => 'organisasi'],
            ['name' => 'penitip', 'guard_name' => 'penitip'],
            ['name' => 'guest', 'guard_name' => 'guest'],
        ];

        foreach ($otherRoles as $role) {
            Role::firstOrCreate($role);
        }
    }

    /**
     * Create or update all permissions
     *
     * @return void
     */
    private function createOrUpdatePermissions()
    {
        // Permissions for staff (pegawai guard)
        $pegawaiPermissions = [
            'manage-pegawai',
            'manage-jabatan',
            'manage-organisasi',
            'manage-merchandise',
            'manage-penitip',
            'manage-diskusi-pegawai',
            'manage-donasi',
            'history-donasi',
            'manage-transaksi-penitipan',
            'manage-barang-penitipan',
            'pilih-barang-donasi',
            'request-donasi',
        ];

        foreach ($pegawaiPermissions as $permissionName) {
            Permission::firstOrCreate(['name' => $permissionName, 'guard_name' => 'pegawai']);
        }

        // Permissions for buyers (pembeli guard)
        $pembeliPermissions = [
            'manage-wishlist',
            'manage-transaksi',
            'manage-diskusi-pembeli',
            'manage-alamat',
            'view-history-pembelian'
        ];

        foreach ($pembeliPermissions as $permissionName) {
            Permission::firstOrCreate(['name' => $permissionName, 'guard_name' => 'pembeli']);
        }

        // Permissions for organizations (organisasi guard)
        Permission::firstOrCreate(['name' => 'manage-request-donasi', 'guard_name' => 'organisasi']);

        // Commented out but ready to be enabled if needed
        Permission::firstOrCreate(['name' => 'view-history-penitipan', 'guard_name' => 'penitip']);

        // Permissions for guest users
        Permission::firstOrCreate(
            ['name' => 'show-barang', 'guard_name' => 'guest']
        );
    }

    /**
     * Assign permissions to roles
     *
     * @return void
     */
    private function assignPermissionsToRoles()
    {
        // Find all roles
        $roleAdmin = Role::findByName('admin', 'pegawai');
        $roleAdminBiasa = Role::findByName('adminbiasa', 'pegawai');
        $roleCS = Role::findByName('cs', 'pegawai');
        $roleOwner = Role::findByName('owner', 'pegawai');
        $roleGudang = Role::findByName('gudang', 'pegawai');
        $rolePembeli = Role::findByName('pembeli', 'pembeli');
        $roleOrganisasi = Role::findByName('organisasi', 'organisasi');
        $rolePenitip = Role::findByName('penitip', 'penitip');
        $roleGuest = Role::findByName('guest', 'guest');

        // Admin permissions
        $roleAdmin->syncPermissions([
            'manage-pegawai',
            'manage-jabatan',
            'manage-organisasi',
            'manage-merchandise'
        ]);

        $roleAdminBiasa = Role::findByName('adminbiasa', 'pegawai');
        $roleAdminBiasa->syncPermissions([
            'manage-pegawai', 'manage-organisasi', 'manage-merchandise'
        ]);
        
        // CS permissions
        $roleCS->syncPermissions([
            'manage-penitip',
            'manage-diskusi-pegawai'
        ]);

        // Owner permissions
        $roleOwner->syncPermissions([
            'manage-donasi',
            'history-donasi',
            'pilih-barang-donasi',
            'request-donasi'
        ]);

        // Gudang permissions
        $roleGudang->syncPermissions([
            'manage-barang-penitipan',
            'manage-transaksi-penitipan'
        ]);

        // Buyer permissions
        $rolePembeli->syncPermissions([
            'manage-wishlist',
            'manage-transaksi',
            'manage-diskusi-pembeli',
            'manage-alamat',
            'view-history-pembelian'
        ]);

        // Organization permissions
        $roleOrganisasi->syncPermissions([
            'manage-request-donasi'
        ]);

        // Consignor permissions - currently commented out
        $rolePenitip->syncPermissions([
            'view-history-penitipan'
        ]);

        // Guest permissions
        $roleGuest->syncPermissions([
            'show-barang'
        ]);
    }
}