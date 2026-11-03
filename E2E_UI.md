# ReUseMart UI E2E

Dua suite UI yang tersedia:

## Web (Playwright)
Lokasi:
- `Web/playwright.config.js`
- `Web/e2e/web-e2e.spec.js`

Menjalankan:
```bash
cd Web
npm install
npm run test:e2e
```

Playwright otomatis menyalakan backend (`php artisan serve --port=8000`) dan Vite (`http://localhost:5173`) jika belum berjalan. Pastikan MySQL Laragon aktif.

Yang diuji: login UI dan navigasi halaman untuk Owner, CS, Gudang, Admin, Pembeli 1, Pembeli 2, Penitip, dan Organisasi.

## Mobile (Flutter integration_test)
Lokasi:
- `Mobile/integration_test/app_test.dart`

Prasyarat:
- Emulator Android aktif (`emulator-5554`)
- Backend berjalan di `http://localhost:8000`
- MySQL aktif

Menjalankan:
```bash
cd Mobile
flutter pub get
flutter test integration_test -d emulator-5554
```

Yang diuji: login UI, dashboard, dan navigasi tab untuk Kurir, Hunter, Pembeli 2, dan Penitip.

## Catatan
- Login API memakai throttle; test Playwright membersihkan cache Laravel sebelum setiap login.
- Reset password via email dan pengiriman push FCM nyata tidak termasuk dalam suite ini; keduanya memerlukan Mailpit/SMTP dan Firebase/device.
