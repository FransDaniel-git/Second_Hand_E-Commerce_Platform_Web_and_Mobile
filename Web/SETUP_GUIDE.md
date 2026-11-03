# 🚀 Panduan Setup E-Commerce Frontend

## ✅ Konfirmasi Keamanan

**TIDAK ADA OTP atau 2FA** dalam proyek ini. Sistem autentikasi menggunakan:

- ✔️ Login dengan email & password
- ✔️ Forgot password dengan token reset (via email)
- ✔️ Register tanpa verifikasi OTP

---

## 📋 Prerequisites

Pastikan sudah terinstall:

- Node.js (v16 atau lebih tinggi)
- npm atau yarn
- Backend Laravel sudah berjalan di `http://localhost:8000`

---

## 🛠️ Instalasi

### 1. Install Dependencies

```bash
npm install
```

### 2. Konfigurasi Backend URL

Pastikan backend Laravel Anda berjalan di:

- **API URL**: `http://localhost:8000/api`

Jika menggunakan port berbeda, ubah di file berikut:

- `src/services/authService.js` (line 4)
- `src/utils/axiosInstance.js` (line 4)
- `src/auth/login/forgotPass.jsx` (line 14)
- `src/auth/login/resetPass.jsx` (line 70)

### 3. Jalankan Development Server

```bash
npm run dev
```

Frontend akan berjalan di: `http://localhost:5173` (atau port yang ditampilkan di terminal)

---

## 🔐 Fitur Autentikasi

### Login

- **Endpoint**: `POST /api/auth/login`
- **Data**: `EMAIL`, `PASSWORD`
- **Response**: `token`, `user_type`, `user`

### Register (Pembeli)

- **Endpoint**: `POST /api/auth/register/pembeli`
- **Data**: `NAMA`, `EMAIL`, `PASSWORD`, `TELEPON`
- **Response**: Status 201 jika sukses

### Register (Organisasi)

- **Endpoint**: `POST /api/auth/register/organisasi`
- **Data yang dibutuhkan sesuai form**

### Forgot Password

- **Endpoint**: `POST /api/auth/forgot-password-gabungan`
- **Data**: `email`
- **Proses**: Kirim email dengan link reset password

### Reset Password

- **Endpoint**: `POST /api/auth/reset-password`
- **Data**: `email`, `token`, `password`, `password_confirmation`
- **Proses**: Reset password dengan token dari email

---

## 👤 User Types & Routes

### 1. **Pembeli** (Customer)

- Homepage: `/`
- Catalogue: `/catalogue`
- Cart: `/cart`
- Checkout: `/checkout`
- Profile: `/profile`

### 2. **Penitip** (Consignor)

- Dashboard: `/penitip/dashboard`
- Daftar Barang: `/penitip/daftar-barang`
- History Penjualan: `/penitip/history-penjualan`

### 3. **Pegawai** (Admin/Staff)

- Dashboard: `/admin/dashboard`
- Manage Pegawai: `/admin/manage-pegawai`
- Manage Penitip: `/admin/manage-penitip`
- Manage Barang: `/admin/manage-barang-penitipan`
- Dan lain-lain...

### 4. **Organisasi**

- Manage Request Donasi: `/admin/manage-request-donasi`

---

## 🔧 Perbaikan yang Sudah Dilakukan

### ✅ 1. Fixed `axiosInstance.js`

- Memperbaiki response interceptor untuk 401 error
- Menggunakan `window.location.href` untuk redirect
- Import `AuthService` dengan benar

### ✅ 2. Fixed `forgotPass.jsx`

- Perbaiki API URL dari relative ke absolute
- Perbaiki path logo

### ✅ 3. Fixed `authService.js`

- Hapus kode yang di-comment
- Hapus unnecessary try/catch
- Bersihkan kode

### ✅ 4. Fixed ESLint Warnings

- Hapus unused variable `dummyImages`
- Hapus unused parameter `totalReviews`

---

## 🚨 Troubleshooting

### Error: "Network Error" saat login

**Solusi**:

- Pastikan backend Laravel berjalan di `http://localhost:8000`
- Jalankan `php artisan serve` di folder backend

### Error: "CORS"

**Solusi Backend**:

```php
// Di backend Laravel, pastikan cors.php allow:
'allowed_origins' => ['http://localhost:5173'],
```

### Token expired / Unauthorized

**Solusi**:

- Logout dan login ulang
- Clear localStorage: `localStorage.clear()`

### Cart tidak berfungsi

**Solusi**:

- Pastikan sudah login sebagai `pembeli`
- Pastikan backend endpoint `/pembeli/cart/add/{kode_produk}` tidak memvalidasi request body
- Backend harus mengambil `ID_PEMBELI` dari authenticated user

---

## 📁 Struktur Folder Penting

```
src/
├── auth/              # Login, Register, Forgot/Reset Password
├── services/          # authService.js
├── utils/             # axiosInstance.js
├── layouts/
│   ├── user/          # Layout untuk customer
│   ├── Administrator/ # Layout untuk admin
│   └── Penitip/       # Layout untuk penitip
└── App.jsx            # Routes
```

---

## 🎯 Cara Menjalankan Project

1. **Start Backend** (Laravel):

```bash
cd e-commerce_backend
php artisan serve
```

2. **Start Frontend** (React + Vite):

```bash
cd e-commerce_frontend
npm run dev
```

3. **Akses aplikasi**:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api`

---

## 🔒 Security Notes

- ✅ **TIDAK** menggunakan OTP/2FA
- ✅ Password di-hash di backend
- ✅ Token JWT untuk autentikasi
- ✅ Protected routes untuk setiap user type
- ✅ Axios interceptor untuk handle 401

---

## 📝 Testing

### Test Login

1. Buka `http://localhost:5173/login`
2. Masukkan email & password yang sudah terdaftar
3. Klik "Masuk"

### Test Register

1. Buka `http://localhost:5173/register-selection`
2. Pilih "Pembeli" atau "Organisasi"
3. Isi form dan submit

### Test Forgot Password

1. Buka `http://localhost:5173/forgotPass`
2. Masukkan email terdaftar
3. Cek email untuk link reset password

---

## 💡 Tips

- Gunakan browser DevTools (F12) untuk debug
- Cek Console untuk error messages
- Cek Network tab untuk request/response
- Cek Application > Local Storage untuk token

---

## 🆘 Contact & Support

Jika ada masalah, periksa:

1. Console browser untuk error
2. Network tab untuk failed requests
3. Backend Laravel logs: `storage/logs/laravel.log`

---

**Created**: November 28, 2025
**Last Updated**: November 28, 2025
