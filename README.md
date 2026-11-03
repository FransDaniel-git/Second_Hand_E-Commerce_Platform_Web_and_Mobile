# ReUseMart

Platform jual-beli barang bekas yang terdiri dari:

- **Backend**: Laravel REST API + MySQL
- **Web**: React + Vite
- **Mobile**: Flutter Android

Project ini digunakan untuk alur pembeli, penitip, organisasi, owner, CS, gudang, admin, kurir, dan hunter.

## Arsitektur

```text
Web (React/Vite) ------+
                       +--> Laravel API --> MySQL
Mobile (Flutter) ------+
```

## Struktur Repository

```text
Backend/   Laravel API, model, controller, migration, seeder
Web/       Aplikasi web React + Vite
Mobile/    Aplikasi mobile Flutter
E2E_UI.md  Panduan menjalankan UI E2E
```

## Fitur Utama

### Web

- **Owner**: dashboard, laporan penjualan/komisi/stok, request donasi, history donasi
- **CS**: manage penitip, diskusi produk, verifikasi pembayaran, klaim merchandise
- **Gudang**: transaksi penitipan, barang titipan, pengambilan barang, daftar pesanan
- **Admin**: pegawai, jabatan, organisasi, merchandise, monitoring logs
- **Pembeli**: katalog, detail produk, cart, checkout, pembayaran, riwayat, rating, diskusi, penukaran merchandise
- **Penitip**: dashboard, daftar barang, riwayat penjualan, profil, barang kadaluarsa
- **Organisasi**: pengajuan dan pengelolaan request donasi

### Mobile

- **Kurir**: daftar pengiriman, detail, update status pengiriman
- **Hunter**: dashboard, komisi, daftar barang titipan
- **Pembeli**: home, katalog, detail produk, diskusi, riwayat pesanan, merchandise, penukaran
- **Penitip**: dashboard, daftar barang titipan, detail barang, profil, penukaran

## Prasyarat

- PHP 8.x dan Composer
- MySQL/MariaDB (Laragon)
- Node.js dan npm
- Flutter SDK
- Android emulator atau device
- Google Chrome (untuk Playwright)

## Setup

### 1. Backend

```bash
cd Backend
composer install
cp .env.example .env
php artisan key:generate
```

Sesuaikan `.env` untuk MySQL:

```env
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=db_reusemart
DB_USERNAME=root
DB_PASSWORD=
```

Untuk database baru:

```bash
php artisan migrate --seed
```

Aktifkan penyimpanan file publik:

```bash
php artisan storage:link
```

Jalankan API:

```bash
php artisan serve --port=8000
```

API tersedia di `http://localhost:8000/api`.

### 2. Web

```bash
cd Web
npm install
npm run dev
```

Web tersedia di `http://localhost:5173`.

### 3. Mobile

```bash
cd Mobile
flutter pub get
flutter run
```

Mobile menggunakan base URL `http://10.0.2.2:8000/api` untuk emulator Android.

Untuk HP fisik, ganti base URL ke IP LAN komputer yang menjalankan backend.

File Firebase seperti `google-services.json` dan `firebase_options.dart` diperlukan untuk fitur notifikasi. File tersebut bersifat lokal dan tidak disimpan di repository publik.

## Akun Demo

Password semua akun demo: `123456`.

### Web

| Role | Email |
|---|---|
| Owner | sinclaircollins123@gmail.com |
| CS | rina.cs1@email.com |
| Gudang | yoga.gudang4@email.com |
| Admin | admin.reusemart@example.test |
| Pembeli | kalilinux404404404@gmail.com |
| Pembeli 2 | sinclaircollins17@gmail.com |
| Penitip | mega10@mail.com |
| Organisasi | ecolab@gmail.com |

### Mobile

| Role | Email |
|---|---|
| Kurir | ahmad.kurir1@email.com |
| Hunter | gilang.hunter1@email.com |
| Pembeli 2 | sinclaircollins17@gmail.com |
| Penitip | mega10@mail.com |

Gunakan akun ini hanya untuk local/UAT.

## Menjalankan Aplikasi

1. Aktifkan MySQL Laragon.
2. Jalankan backend di `http://localhost:8000`.
3. Jalankan web di `http://localhost:5173`.
4. Jalankan emulator, lalu jalankan aplikasi Flutter.

## Pengujian

### UI E2E Web - Playwright

```bash
cd Web
npm run test:e2e
```

Playwright otomatis menyalakan backend dan Vite jika belum berjalan. Pastikan MySQL aktif.

File:
- `Web/playwright.config.js`
- `Web/e2e/web-e2e.spec.js`

### UI E2E Mobile - Flutter integration_test

Prasyarat:
- Emulator Android aktif
- Backend berjalan di port 8000
- MySQL aktif

```bash
cd Mobile
flutter test integration_test -d emulator-5554
```

File:
- `Mobile/integration_test/app_test.dart`

Panduan lengkap: `E2E_UI.md`.

## Hasil Pengujian Terakhir

Per 2026-11-03:

| Suite | Hasil |
|---|---|
| API + Web E2E | 189/189 PASS |
| Mobile API E2E | 72/72 PASS |
| Playwright UI E2E | 8/8 PASS |
| Flutter integration_test | 4/4 PASS |

Build web dan `flutter analyze` juga berhasil tanpa error.
