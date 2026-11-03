# 🐛 Bug Fix: Bukti Pembayaran Image Not Loading

## 📋 Problem

Setelah upload bukti pembayaran, muncul error:

```
Failed to load payment proof: http://localhost:5173/api/placeholder/200/200
GET http://localhost:5173/api/placeholder/200/200 404 (Not Found)
```

## 🔍 Root Cause

Backend mengembalikan **path relatif** untuk gambar bukti pembayaran (contoh: `storage/bukti_pembayaran/xxx.jpg`), tetapi frontend tidak menambahkan **base URL backend**.

## ✅ Solution

### 1. **Tambahkan Konstanta Base URL**

File: `src/utils/axiosInstance.js`

```javascript
export const API_BASE_URL = "http://localhost:8000/api";
export const STORAGE_BASE_URL = "http://localhost:8000";
```

### 2. **Update DetailPembelian.jsx**

- Import `STORAGE_BASE_URL`
- Gunakan saat fetch data transaksi:
  ```javascript
  buktiPembayaran: tx.bukti_pembayaran
    ? `${STORAGE_BASE_URL}/${tx.bukti_pembayaran}`
    : null;
  ```
- Gunakan saat update setelah upload:
  ```javascript
  buktiPembayaran: response.data.data.bukti_pembayaran
    ? `${STORAGE_BASE_URL}/${response.data.data.bukti_pembayaran}`
    : null;
  ```
- Perbaiki error handling untuk image load failure

### 3. **Update ManageBuktiPembayaran.jsx**

- Tambahkan konstanta `STORAGE_BASE_URL`
- Map data transaksi untuk menambahkan base URL:
  ```javascript
  const mappedTransactions = response.data.data.map((tx) => ({
    ...tx,
    bukti_pembayaran: tx.bukti_pembayaran
      ? `${STORAGE_BASE_URL}/${tx.bukti_pembayaran}`
      : null,
  }));
  ```

## 📝 Files Changed

1. ✅ `src/utils/axiosInstance.js` - Tambah konstanta base URL
2. ✅ `src/layouts/user/components/DetailPembelian.jsx` - Fix URL bukti pembayaran
3. ✅ `src/layouts/Administrator/pages/ManageBuktiPembayaran.jsx` - Fix URL bukti pembayaran

## 🧪 Testing

1. Login sebagai pembeli
2. Lakukan checkout
3. Upload bukti pembayaran
4. ✅ Gambar bukti pembayaran sekarang muncul dengan benar
5. ✅ URL gambar: `http://localhost:8000/storage/bukti_pembayaran/xxx.jpg`

## 🎯 Result

- ✅ Bukti pembayaran berhasil ditampilkan setelah upload
- ✅ Tidak ada lagi error 404 untuk placeholder image
- ✅ URL gambar konsisten di seluruh aplikasi
- ✅ Mudah di-maintain dengan konstanta terpusat

## 📌 Note

Jika menggunakan domain/port berbeda untuk backend, cukup ubah di satu tempat: `src/utils/axiosInstance.js`

---

**Fixed Date**: November 28, 2025
