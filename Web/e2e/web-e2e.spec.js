import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(here, "..", "..", "Backend");

async function clearLoginThrottle() {
  execFileSync("php", ["artisan", "cache:clear"], {
    cwd: backendDir,
    stdio: "ignore",
  });
}

async function login(page, email, expectedPath) {
  await page.goto("/login");
  await expect(page.getByText("Masuk ke Akun Anda")).toBeVisible();

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill("123456");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();

  await page.waitForURL(
    (url) => new URL(url).pathname === expectedPath,
    { timeout: 30_000 }
  );
}

async function expectHeading(page, name, exact = true) {
  await expect(
    page.getByRole("heading", { name, exact }).first()
  ).toBeVisible();
}

test.beforeEach(async () => {
  // Login route memakai throttle 5/menit; reset agar 8 role bisa diuji berurutan.
  await clearLoginThrottle();
});

test("OWNER - dashboard dan halaman donasi", async ({ page }) => {
  await login(page, "sinclaircollins123@gmail.com", "/admin/dashboard");
  await expect(page.getByText("Manage Donasi", { exact: true }).first()).toBeVisible();

  await page.goto("/admin/laporan-owner");
  await expectHeading(page, "Laporan");
  await expect(
    page.getByText("Penjualan Bulanan Keseluruhan", { exact: true }).first()
  ).toBeVisible();

  await page.goto("/admin/daftar-request-donasi");
  await expectHeading(page, "Daftar Request Donasi");

  await page.goto("/admin/history-donasi");
  await expectHeading(page, "History Donasi ke Organisasi");
});

test("CS - penitip, diskusi, pembayaran, klaim", async ({ page }) => {
  await login(page, "rina.cs1@email.com", "/admin/dashboard");
  await expect(page.getByText("Manage Penitip", { exact: true }).first()).toBeVisible();

  await page.goto("/admin/manage-penitip");
  await expectHeading(page, "Manage Penitip");
  await expect(page.getByText("Mega Ayu Lestari").first()).toBeVisible();

  await page.goto("/admin/manage-diskusi");
  await expectHeading(page, "Manajemen Diskusi Produk");

  await page.goto("/admin/verifikasi-pembayaran");
  await expectHeading(page, "Verifikasi Pembayaran");

  await page.goto("/admin/daftar-claim-merchandise");
  await expectHeading(page, "Daftar Klaim Merchandise");
});

test("GUDANG - penitipan, barang, pengambilan, pesanan", async ({ page }) => {
  await login(page, "yoga.gudang4@email.com", "/admin/dashboard");
  await expect(
    page.getByText("Manage Barang Titipan", { exact: true }).first()
  ).toBeVisible();

  await page.goto("/admin/manage-transaksi-penitipan");
  await expectHeading(page, "Manage Transaksi Penitipan");

  await page.goto("/admin/manage-barang-penitipan");
  await expectHeading(page, "Daftar Barang Titipan");
  await expect(page.getByText("Baju Metallica").first()).toBeVisible();

  await page.goto("/admin/manage-pengambilan-barang");
  await expectHeading(page, "Manage Pengambilan Barang Titipan");

  await page.goto("/admin/manage-order-list");
  await expectHeading(page, "Manajemen Daftar Pesanan");
});

test("ADMIN - pegawai, jabatan, organisasi, merchandise, logs", async ({ page }) => {
  await login(page, "admin.reusemart@example.test", "/admin/dashboard");
  await expect(page.getByText("Manage Pegawai", { exact: true }).first()).toBeVisible();

  await page.goto("/admin/manage-pegawai");
  await expectHeading(page, "Manage Pegawai");
  await expect(page.getByText("P24").first()).toBeVisible();

  await page.goto("/admin/manage-jabatan");
  await expectHeading(page, "Manage Jabatan");

  await page.goto("/admin/manage-organisasi");
  await expectHeading(page, "Manage Organisasi");
  await expect(page.getByText("EcoLab").first()).toBeVisible();

  await page.goto("/admin/manage-merchandise");
  await expectHeading(page, "Manage Merchandise");

  await page.goto("/admin/monitoring-logs");
  await expectHeading(page, "System Monitoring Logs");
});

test("PEMBELI 1 - home, katalog, detail, cart, profil, riwayat", async ({ page }) => {
  await login(page, "kalilinux404404404@gmail.com", "/");
  await expect(page.getByText("Kesempatan Baru", { exact: true })).toBeVisible();

  await page.goto("/catalogue");
  await expectHeading(page, "Katalog Produk");
  await expect(page.getByText("Handy Mandy Tool Box").first()).toBeVisible();

  await page.goto("/detail-product/H15");
  await expect(page.getByText("Handy Mandy Tool Box").first()).toBeVisible();
  await expect(page.getByText("Diskusi Produk")).toBeVisible();

  await page.goto("/cart");
  await expectHeading(page, "WISHLIST");

  await page.goto("/profile");
  await expect(page.getByText("Profil Pengguna")).toBeVisible();
  await page.getByText("Transaksi Pembelian", { exact: true }).click();
  await expectHeading(page, "Riwayat Pembelian");
});

test("PEMBELI 2 - profil dan detail transaksi", async ({ page }) => {
  await login(page, "sinclaircollins17@gmail.com", "/");
  await expect(page.getByText("Kesempatan Baru", { exact: true })).toBeVisible();

  await page.goto("/profile");
  await expect(page.getByText("Profil Pengguna")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "sinclair", exact: true })
  ).toBeVisible();

  await page.goto("/transaksi/2025.12.84");
  await expect(page.getByText("2025.12.84").first()).toBeVisible();
  await expect(page.getByText("Electric Guitar").first()).toBeVisible();
});

test("PENITIP - dashboard, barang, penjualan, profil, kadaluarsa", async ({ page }) => {
  await login(page, "mega10@mail.com", "/penitip/dashboard");
  await expect(page.getByText("Daftar Barang", { exact: true }).first()).toBeVisible();

  await page.goto("/penitip/daftar-barang");
  await expectHeading(page, "Daftar Barang Titipan");
  await expect(page.getByText("Baju Metallica").first()).toBeVisible();

  await page.goto("/penitip/history-penjualan");
  await expectHeading(page, "Riwayat Penjualan");

  await page.goto("/penitip/profile");
  await expect(page.getByText("Mega Ayu Lestari").first()).toBeVisible();

  await page.goto("/penitip/daftar-barang-kadaluarsa");
  await expectHeading(page, "Daftar Barang Titipan Kadaluarsa");
});

test("ORGANISASI - request donasi", async ({ page }) => {
  await login(page, "ecolab@gmail.com", "/admin/manage-request-donasi");
  await expectHeading(page, "Manage Request Donasi");
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByText("dikonfirmasi").first()).toBeVisible();
});
