<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pegawai;
use App\Models\Pembeli;
use App\Models\Organisasi;
use App\Models\Penitip;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;
use App\Mail\ResetPasswordMail;
use App\Mail\OtpMail;
use Illuminate\Support\Facades\Crypt;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function registerPegawai(Request $request)
    {
        // Endpoint ini tidak boleh dipakai tanpa login admin. Route publiknya
        // sudah dihapus; guard ini mencegah bila route ditambahkan kembali.
        if (!auth('pegawai')->check() || !auth('pegawai')->user()->hasAnyRole(['admin', 'adminbiasa'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'ID_JABATAN' => 'required|integer|exists:jabatans,ID_JABATAN',
            'NAMA' => 'required|string|max:50',
            'TELEPON' => 'nullable|string|max:20',
            'ALAMAT' => 'nullable|string|max:250',
            'TGL_LAHIR' => 'nullable|date',
            'EMAIL' => 'required|string|max:50|email|unique:pegawais,EMAIL',
            'PASSWORD' => 'required|string|min:6',
        ]);

        $jabatan = \App\Models\Jabatan::find($request->ID_JABATAN);
        if (!$jabatan) {
            return response()->json(['error' => 'Jabatan tidak ditemukan'], 404);
        }

        $pegawai = new Pegawai();
        $pegawai->ID_PEGAWAI = Pegawai::generateIdPegawai();
        $pegawai->ID_JABATAN = $request->ID_JABATAN;
        $pegawai->NAMA = $request->NAMA;
        $pegawai->TELEPON = $request->TELEPON;
        $pegawai->ALAMAT = $request->ALAMAT;
        $pegawai->TGL_LAHIR = $request->TGL_LAHIR;
        $pegawai->EMAIL = $request->EMAIL;
        $pegawai->PASSWORD = bcrypt($request->PASSWORD);
        $pegawai->STATUS = 'active';
        $pegawai->save();

        $pegawai->assignRoleByJabatan();

        return response()->json(['message' => 'Registrasi pegawai berhasil!'], 201);
    }

    public function registerPembeli(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'NAMA' => 'required|string|max:50',
            'TELEPON' => 'nullable|string|max:20',
            'EMAIL' => 'required|string|max:50|email|unique:pembelis,EMAIL',
            'PASSWORD' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $pembeli = new Pembeli();
        $pembeli->NAMA = $request->NAMA;
        $pembeli->TELEPON = $request->TELEPON;
        $pembeli->EMAIL = $request->EMAIL;
        $pembeli->PASSWORD = bcrypt($request->PASSWORD);
        $pembeli->POIN_LOYALITAS = 0;
        $pembeli->STATUS = 'active';
        $pembeli->save();

        $pembeli->assignRole('pembeli');

        return response()->json(['message' => 'Registrasi pembeli berhasil!'], 201);
    }

    public function registerOrganisasi(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'NAMA' => 'required|string|max:250',
            'ALAMAT' => 'nullable|string',
            'TELEPON' => 'nullable|string|max:20',
            'DESKRIPSI' => 'nullable|string',
            'EMAIL' => 'required|string|max:250|email|unique:organisasis,EMAIL',
            'PASSWORD' => 'required|string|min:6',
            'FOTO_ORGANISASI' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();
            
            $organisasi = new Organisasi();
            $organisasi->ID_ORGANISASI = Organisasi::generateIdOrganisasi();
            $organisasi->NAMA = $request->NAMA;
            $organisasi->ALAMAT = $request->ALAMAT;
            $organisasi->TELEPON = $request->TELEPON;
            $organisasi->DESKRIPSI = $request->DESKRIPSI;
            $organisasi->EMAIL = $request->EMAIL;
            $organisasi->PASSWORD = bcrypt($request->PASSWORD);
            $organisasi->STATUS = 'active';

            if ($request->hasFile('FOTO_ORGANISASI')) {
                try {
                    $file = $request->file('FOTO_ORGANISASI');
                    $path = $file->store('organisasi_logos', 'public');
                    $organisasi->FOTO_ORGANISASI = $path;
                    \Log::info("File uploaded successfully: " . $path);
                } catch (\Exception $e) {
                    \Log::error("File upload failed: " . $e->getMessage());
                    DB::rollBack();
                    return response()->json(['error' => 'File upload failed: ' . $e->getMessage()], 500);
                }
            }

            $organisasi->save();
            $organisasi->assignRole('organisasi');
            DB::commit();

            return response()->json(['message' => 'Registrasi organisasi berhasil!'], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Organisation registration failed: " . $e->getMessage());
            return response()->json(['error' => 'Registration failed: ' . $e->getMessage()], 500);
        }
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'EMAIL' => 'required|email',
            'PASSWORD' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Check Pegawai
        $pegawai = Pegawai::where('EMAIL', $request->EMAIL)->first();
        if ($pegawai) {
            if ($pegawai->STATUS !== 'active') {
                return response()->json(['error' => 'Akun tidak aktif'], 403);
            }
            if (!Hash::check($request->PASSWORD, $pegawai->PASSWORD)) {
                return response()->json(['error' => 'Email atau Password salah'], 401);
            }
            if (!$token = auth('pegawai')->login($pegawai)) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }
            return response()->json([
                'token' => $token,
                'user_type' => 'pegawai',
                'user' => [
                    'id' => $pegawai->ID_PEGAWAI,
                    'nama' => $pegawai->NAMA,
                    'email' => $pegawai->EMAIL,
                    'role' => $pegawai->getRoleNames()->toArray(),
                    'permissions' => $pegawai->getAllPermissions()->pluck('name')->toArray()
                ]
            ]);
        }

        // Check Pembeli
        $pembeli = Pembeli::where('EMAIL', $request->EMAIL)->first();
        if ($pembeli) {
            if ($pembeli->STATUS !== 'active') {
                return response()->json(['error' => 'Akun tidak aktif'], 403);
            }
            if (!Hash::check($request->PASSWORD, $pembeli->PASSWORD)) {
                return response()->json(['error' => 'Email atau Password salah'], 401);
            }
            if (!$token = auth('pembeli')->login($pembeli)) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }
            return response()->json([
                'token' => $token,
                'user_type' => 'pembeli',
                'user' => [
                    'id' => $pembeli->ID_PEMBELI,
                    'nama' => $pembeli->NAMA,
                    'email' => $pembeli->EMAIL,
                    'poin' => $pembeli->POIN_LOYALITAS,
                    'role' => $pembeli->getRoleNames()->toArray(),
                    'permissions' => $pembeli->getAllPermissions()->pluck('name')->toArray()
                ]
            ]);
        }

        // Check Penitip
        $penitip = Penitip::where('EMAIL', $request->EMAIL)->first();
        if ($penitip) {
            if ($penitip->STATUS !== 'active') {
                return response()->json(['error' => 'Akun tidak aktif'], 403);
            }
            if (!Hash::check($request->PASSWORD, $penitip->PASSWORD)) {
                return response()->json(['error' => 'Email atau Password salah'], 401);
            }
            if (!$token = auth('penitip')->login($penitip)) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }
            return response()->json([
                'token' => $token,
                'user_type' => 'penitip',
                'user' => [
                    'id' => $penitip->ID_PENITIP,
                    'nama' => $penitip->NAMA,
                    'email' => $penitip->EMAIL,
                    'poin' => $penitip->POIN_LOYALITAS,
                    'saldo' => $penitip->SALDO,
                    'role' => $penitip->getRoleNames()->toArray(),
                    'permissions' => $penitip->getAllPermissions()->pluck('name')->toArray()
                ]
            ]);
        }

        // Check Organisasi
        $organisasi = Organisasi::where('EMAIL', $request->EMAIL)->first();
        if ($organisasi) {
            if ($organisasi->STATUS !== 'active') {
                return response()->json(['error' => 'Akun tidak aktif'], 403);
            }
            if (!Hash::check($request->PASSWORD, $organisasi->PASSWORD)) {
                return response()->json(['error' => 'Email atau Password salah'], 401);
            }
            if (!$token = auth('organisasi')->login($organisasi)) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }
            return response()->json([
                'token' => $token,
                'user_type' => 'organisasi',
                'user' => [
                    'id' => $organisasi->ID_ORGANISASI,
                    'nama' => $organisasi->NAMA,
                    'email' => $organisasi->EMAIL,
                    'role' => $organisasi->getRoleNames()->toArray(),
                    'permissions' => $organisasi->getAllPermissions()->pluck('name')->toArray()
                ]
            ]);
        }

        return response()->json(['error' => 'Email atau Password salah'], 401);
    }

    // public function login(Request $request) //(SEMUA 2FA)
    // {
    //     $validator = Validator::make($request->all(), [
    //         'EMAIL' => 'required|email',
    //         'PASSWORD' => 'required|string|min:6',
    //     ]);

    //     if ($validator->fails()) {
    //         return response()->json($validator->errors(), 422);
    //     }

    //     // --- Fungsi helper untuk mengirim OTP ---
    //     $sendOtp = function ($userType, $email) {
    //         $otp = random_int(100000, 999999);
    //         // Simpan OTP di cache, berlaku 5 menit
    //         Cache::put('otp_' . $email, $otp, now()->addMinutes(5));
    //         try {
    //             Mail::to($email)->send(new OtpMail($otp));
    //         } catch (\Exception $e) {
    //             // Log error jika perlu: \Log::error("Email sending failed: " . $e->getMessage());
    //             return response()->json([
    //                 'error' => 'Gagal mengirim email OTP.',
    //                 'exception_message' => $e->getMessage() 
    //             ], 500);
    //         }
    //         return response()->json([
    //             'message' => 'OTP telah dikirim ke email Anda. Silakan verifikasi.',
    //             'user_type' => $userType
    //         ]);
    //     };

    //     // Check Pegawai
    //     $pegawai = Pegawai::where('EMAIL', $request->EMAIL)->first();
    //     if ($pegawai && Hash::check($request->PASSWORD, $pegawai->PASSWORD)) {
    //         if ($pegawai->STATUS !== 'active') return response()->json(['error' => 'Akun tidak aktif'], 403);
    //         return $sendOtp('pegawai', $request->EMAIL);
    //     }

    //     // Check Pembeli
    //     $pembeli = Pembeli::where('EMAIL', $request->EMAIL)->first();
    //     if ($pembeli && Hash::check($request->PASSWORD, $pembeli->PASSWORD)) {
    //         if ($pembeli->STATUS !== 'active') return response()->json(['error' => 'Akun tidak aktif'], 403);
    //         return $sendOtp('pembeli', $request->EMAIL);
    //     }

    //     // Check Penitip
    //     $penitip = Penitip::where('EMAIL', $request->EMAIL)->first();
    //     if ($penitip && Hash::check($request->PASSWORD, $penitip->PASSWORD)) {
    //         if ($penitip->STATUS !== 'active') return response()->json(['error' => 'Akun tidak aktif'], 403);
    //         return $sendOtp('penitip', $request->EMAIL);
    //     }

    //     // Check Organisasi
    //     $organisasi = Organisasi::where('EMAIL', $request->EMAIL)->first();
    //     if ($organisasi && Hash::check($request->PASSWORD, $organisasi->PASSWORD)) {
    //         if ($organisasi->STATUS !== 'active') return response()->json(['error' => 'Akun tidak aktif'], 403);
    //         return $sendOtp('organisasi', $request->EMAIL);
    //     }
    //     Log::warning('Login attempt failed (Invalid credentials).', [
    //         'email_attempted' => $request->EMAIL, 
    //         'ip_address' => $request->ip()
    //     ]);

    //     return response()->json(['error' => 'Email atau Password salah'], 401);
    // }

    // public function login(Request $request)
    // {
    //     $validator = Validator::make($request->all(), [
    //         'EMAIL' => 'required|email',
    //         'PASSWORD' => 'required|string|min:6',
    //     ]);

    //     if ($validator->fails()) {
    //         return response()->json($validator->errors(), 422);
    //     }

    //     // Check Pegawai (Login Langsung)
    //     $pegawai = Pegawai::where('EMAIL', $request->EMAIL)->first();
    //     if ($pegawai && Hash::check($request->PASSWORD, $pegawai->PASSWORD)) {
    //         if ($pegawai->STATUS !== 'active') {
    //             return response()->json(['error' => 'Akun tidak aktif'], 403);
    //         }
    //         if (!$token = auth('pegawai')->login($pegawai)) {
    //             return response()->json(['error' => 'Unauthorized'], 401);
    //         }
    //         return response()->json([
    //             'token' => $token,
    //             'user_type' => 'pegawai',
    //             'user' => [ 'id' => $pegawai->ID_PEGAWAI, 'nama' => $pegawai->NAMA, /* ...data lainnya */ ]
    //         ]);
    //     }

    //     // Check Pembeli (Login dengan OTP)
    //     $pembeli = Pembeli::where('EMAIL', $request->EMAIL)->first();
    //     if ($pembeli && Hash::check($request->PASSWORD, $pembeli->PASSWORD)) {
    //         if ($pembeli->STATUS !== 'active') {
    //             return response()->json(['error' => 'Akun tidak aktif'], 403);
    //         }
            
    //         // --- HANYA PEMBELI YANG MASUK KE LOGIKA OTP ---
    //         $otp = random_int(100000, 999999);
    //         Cache::put('otp_' . $request->EMAIL, $otp, now()->addMinutes(5));
    //         try {
    //             Mail::to($request->EMAIL)->send(new OtpMail($otp));
    //         } catch (\Exception $e) {
    //             return response()->json(['error' => 'Gagal mengirim email OTP.', 'exception_message' => $e->getMessage()], 500);
    //         }
    //         return response()->json([
    //             'message' => 'OTP telah dikirim ke email Anda. Silakan verifikasi.',
    //             'user_type' => 'pembeli'
    //         ]);
    //     }

    //     // Check Penitip (Login Langsung)
    //     $penitip = Penitip::where('EMAIL', $request->EMAIL)->first();
    //     if ($penitip && Hash::check($request->PASSWORD, $penitip->PASSWORD)) {
    //         if ($penitip->STATUS !== 'active') {
    //             return response()->json(['error' => 'Akun tidak aktif'], 403);
    //         }
    //         if (!$token = auth('penitip')->login($penitip)) {
    //             return response()->json(['error' => 'Unauthorized'], 401);
    //         }
    //         return response()->json([
    //             'token' => $token,
    //             'user_type' => 'penitip',
    //             'user' => [ 'id' => $penitip->ID_PENITIP, 'nama' => $penitip->NAMA, /* ...data lainnya */ ]
    //         ]);
    //     }

    //     // Check Organisasi (Login Langsung)
    //     $organisasi = Organisasi::where('EMAIL', $request->EMAIL)->first();
    //     if ($organisasi && Hash::check($request->PASSWORD, $organisasi->PASSWORD)) {
    //         if ($organisasi->STATUS !== 'active') {
    //             return response()->json(['error' => 'Akun tidak aktif'], 403);
    //         }
    //         if (!$token = auth('organisasi')->login($organisasi)) {
    //             return response()->json(['error' => 'Unauthorized'], 401);
    //         }
    //         return response()->json([
    //             'token' => $token,
    //             'user_type' => 'organisasi',
    //             'user' => [ 'id' => $organisasi->ID_ORGANISASI, 'nama' => $organisasi->NAMA, /* ...data lainnya */ ]
    //         ]);
    //     }

    //     return response()->json(['error' => 'Email atau Password salah'], 401);
    // }
    // FUNGSI BARU UNTUK VERIFIKASI OTP & LOGIN
    // public function verifyOtpAndLogin(Request $request)
    // {
    //     $validator = Validator::make($request->all(), [
    //         'EMAIL' => 'required|email',
    //         'OTP' => 'required|string|digits:6',
    //         'user_type' => 'required|string|in:pegawai,pembeli,penitip,organisasi'
    //     ]);

    //     if ($validator->fails()) {
    //         return response()->json($validator->errors(), 422);
    //     }

    //     // 1. Cek OTP di cache
    //     $cachedOtp = Cache::get('otp_' . $request->EMAIL);
    //     dd([
    //         'otp_yang_diharapkan_server_(dari_cache)' => $cachedOtp,
    //         'otp_yang_anda_masukkan' => $request->OTP,
    //         'apakah_cocok?' => (string) $cachedOtp === (string) $request->OTP
    //     ]);
    //     if (!$cachedOtp || $cachedOtp != $request->OTP) {
    //         Log::warning('OTP verification failed.', [
    //             'email' => $request->EMAIL,
    //             'ip_address' => $request->ip()
    //         ]);
    //         return response()->json(['error' => 'OTP tidak valid atau sudah kedaluwarsa.'], 401);
    //     }

    //     // 2. Jika OTP benar, HAPUS OTP dan lanjutkan proses login
    //     Cache::forget('otp_' . $request->EMAIL);

    //     $user = null;
    //     $token = null;
    //     $userData = [];

    //     switch ($request->user_type) {
    //         case 'pegawai':
    //             $user = Pegawai::where('EMAIL', $request->EMAIL)->first();
    //             if ($user) $token = auth('pegawai')->login($user);
    //             break;
    //         case 'pembeli':
    //             $user = Pembeli::where('EMAIL', $request->EMAIL)->first();
    //             if ($user) $token = auth('pembeli')->login($user);
    //             break;
    //         case 'penitip':
    //             $user = Penitip::where('EMAIL', $request->EMAIL)->first();
    //             if ($user) $token = auth('penitip')->login($user);
    //             break;
    //         case 'organisasi':
    //             $user = Organisasi::where('EMAIL', $request->EMAIL)->first();
    //             if ($user) $token = auth('organisasi')->login($user);
    //             break;
    //     }

    //     if (!$user || !$token) {
            
    //         return response()->json(['error' => 'Gagal melakukan autentikasi.'], 500);
    //     }
    //     Log::info('User login successful (2FA passed).', [
    //         'user_id' => $user->getKey(),
    //         'email' => $user->EMAIL,
    //         'ip_address' => $request->ip()
    //     ]);
        
    //     // 3. Kembalikan respons sukses dengan token
    //     return response()->json([
    //         'message' => 'Login berhasil!',
    //         'token' => $token,
    //         'user_type' => $request->user_type,
    //         'user' => [
    //             'id' => $user->getKey(), 'nama' => $user->NAMA, 'email' => $user->EMAIL,
    //             'role' => $user->getRoleNames()->toArray(), 'permissions' => $user->getAllPermissions()->pluck('name')->toArray()
    //         ]
    //     ]);
    // }

    // public function verifyOtpAndLogin(Request $request)
    // {
    //     $validator = Validator::make($request->all(), [
    //         'EMAIL' => 'required|email',
    //         'OTP' => 'required|string|digits:6',
    //         'user_type' => 'required|string|in:pegawai,pembeli,penitip,organisasi'
    //     ]);

    //     if ($validator->fails()) {
    //         return response()->json($validator->errors(), 422);
    //     }

    //     // 1. Cek OTP di cache
    //     $cachedOtp = Cache::get('otp_' . $request->EMAIL);
    //     if (!$cachedOtp || (string) $cachedOtp !== (string) $request->OTP) {
            
    //         // ▼▼▼ TAMBAHKAN LOG UNTUK VERIFIKASI OTP GAGAL ▼▼▼
    //         Log::warning('OTP verification failed (Invalid or expired).', [
    //             'email_attempted' => $request->EMAIL,
    //             'ip_address' => $request->ip()
    //         ]);
    //         // ▲▲▲ LOG DITAMBAHKAN ▲▲▲

    //         return response()->json(['error' => 'OTP tidak valid atau sudah kedaluwarsa.'], 401);
    //     }

    //     // 2. Jika OTP benar, HAPUS OTP dan lanjutkan proses login
    //     Cache::forget('otp_' . $request->EMAIL);

    //     $user = null;
    //     $token = null;

    //     switch ($request->user_type) {
    //         case 'pegawai':
    //             $user = Pegawai::where('EMAIL', $request->EMAIL)->first();
    //             if ($user) $token = auth('pegawai')->login($user);
    //             break;
    //         case 'pembeli':
    //             $user = Pembeli::where('EMAIL', $request->EMAIL)->first();
    //             if ($user) $token = auth('pembeli')->login($user);
    //             break;
    //         case 'penitip':
    //             $user = Penitip::where('EMAIL', $request->EMAIL)->first();
    //             if ($user) $token = auth('penitip')->login($user);
    //             break;
    //         case 'organisasi':
    //             $user = Organisasi::where('EMAIL', $request->EMAIL)->first();
    //             if ($user) $token = auth('organisasi')->login($user);
    //             break;
    //     }

    //     if (!$user || !$token) {
    //         return response()->json(['error' => 'Gagal melakukan autentikasi.'], 500);
    //     }

    //     // ▼▼▼ TAMBAHKAN LOG UNTUK LOGIN SUKSES SETELAH 2FA ▼▼▼
    //     Log::info('User login successful (2FA passed).', [
    //         'user_id' => $user->getKey(),
    //         'email' => $user->EMAIL,
    //         'ip_address' => $request->ip()
    //     ]);
    //     // ▲▲▲ LOG DITAMBAHKAN ▲▲▲
        
    //     // 3. Kembalikan respons sukses dengan token
    //     return response()->json([
    //         'message' => 'Login berhasil!',
    //         'token' => $token,
    //         'user_type' => $request->user_type,
    //         'user' => [
    //             'id' => $user->getKey(), 'nama' => $user->NAMA, 'email' => $user->EMAIL,
    //             'role' => $user->getRoleNames()->toArray(), 'permissions' => $user->getAllPermissions()->pluck('name')->toArray()
    //         ]
    //     ]);
    // }

    public function verifyOtpAndLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'EMAIL' => 'required|email',
            'OTP' => 'required|string|digits:6',
            'user_type' => 'required|string|in:pegawai,pembeli,penitip,organisasi'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // 🔹 Ambil data OTP dari cache
        $cachedData = Cache::get('otp_' . $request->EMAIL);

        // 🔸 Jika OTP tidak ada di cache, artinya sudah expired
        if (!$cachedData) {
            Log::warning('OTP expired (cache cleared).', [
                'email_attempted' => $request->EMAIL,
                'ip_address' => $request->ip()
            ]);
            return response()->json(['error' => 'OTP sudah kedaluwarsa.'], 401);
        }

        // 🔸 Deteksi format data (lama = angka langsung, baru = array)
        if (is_numeric($cachedData)) {
            // Format lama, disimpan langsung sebagai angka
            $cachedOtpCode = (string) $cachedData;
            $expired = false; // Cache sudah atur TTL, jadi otomatis expired
        } elseif (is_array($cachedData)) {
            // Format baru: ['code' => 123456, 'expires_at' => timestamp]
            $cachedOtpCode = (string) ($cachedData['code'] ?? '');
            $expired = isset($cachedData['expires_at']) && now()->greaterThan($cachedData['expires_at']);
        } else {
            // Format tidak dikenali
            Cache::forget('otp_' . $request->EMAIL);
            Log::error('Invalid OTP format detected.', ['email_attempted' => $request->EMAIL]);
            return response()->json(['error' => 'Format OTP tidak valid.'], 500);
        }

        // 🔸 Cek apakah OTP sudah kedaluwarsa
        if ($expired) {
            Cache::forget('otp_' . $request->EMAIL);
            Log::warning('OTP expired (time exceeded).', [
                'email_attempted' => $request->EMAIL,
                'ip_address' => $request->ip()
            ]);
            return response()->json(['error' => 'OTP sudah kedaluwarsa.'], 401);
        }

        // 🔸 Cek apakah OTP salah
        if ($cachedOtpCode !== (string) $request->OTP) {
            Log::warning('OTP invalid.', [
                'email_attempted' => $request->EMAIL,
                'ip_address' => $request->ip()
            ]);
            return response()->json(['error' => 'OTP tidak valid.'], 401);
        }

        // ✅ OTP benar, hapus cache dan lanjut login
        Cache::forget('otp_' . $request->EMAIL);

        $user = null;
        $token = null;

        switch ($request->user_type) {
            case 'pegawai':
                $user = Pegawai::where('EMAIL', $request->EMAIL)->first();
                if ($user) $token = auth('pegawai')->login($user);
                break;
            case 'pembeli':
                $user = Pembeli::where('EMAIL', $request->EMAIL)->first();
                if ($user) $token = auth('pembeli')->login($user);
                break;
            case 'penitip':
                $user = Penitip::where('EMAIL', $request->EMAIL)->first();
                if ($user) $token = auth('penitip')->login($user);
                break;
            case 'organisasi':
                $user = Organisasi::where('EMAIL', $request->EMAIL)->first();
                if ($user) $token = auth('organisasi')->login($user);
                break;
        }

        if (!$user || !$token) {
            return response()->json(['error' => 'Gagal melakukan autentikasi.'], 500);
        }

        // 🔹 Log login sukses
        Log::info('User login successful (2FA passed).', [
            'user_id' => $user->getKey(),
            'email' => $user->EMAIL,
            'ip_address' => $request->ip()
        ]);

        // 🔹 Return response sukses
        return response()->json([
            'message' => 'Login berhasil!',
            'token' => $token,
            'user_type' => $request->user_type,
            'user' => [
                'id' => $user->getKey(),
                'nama' => $user->NAMA,
                'email' => $user->EMAIL,
                'role' => $user->getRoleNames()->toArray(),
                'permissions' => $user->getAllPermissions()->pluck('name')->toArray()
            ]
        ]);
    }

    private function createPasswordResetToken(string $email): string
    {
        $token = Str::random(10);

        Cache::put('password_reset:' . strtolower($email), [
            'hash' => hash('sha256', $token),
            'expires_at' => now()->addMinutes(15)->timestamp,
        ], now()->addMinutes(15));

        return $token;
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $cacheKey = 'password_reset:' . strtolower($request->email);
        $reset = Cache::get($cacheKey);

        // Token harus pernah diterbitkan, belum kedaluwarsa, dan cocok.
        if (!$reset || !is_array($reset) || !isset($reset['hash'], $reset['expires_at'])
            || now()->timestamp > (int) $reset['expires_at']
            || !hash_equals((string) $reset['hash'], hash('sha256', (string) $request->token))) {
            return response()->json(['message' => 'Token tidak valid atau sudah kedaluwarsa'], 400);
        }

        $pembeli = Pembeli::where('EMAIL', $request->email)->first();
        if ($pembeli) {
            $pembeli->PASSWORD = Hash::make($request->password);
            $pembeli->save();
            Cache::forget($cacheKey);
            return response()->json(['message' => 'Password berhasil direset (pembeli)']);
        }

        $organisasi = Organisasi::where('EMAIL', $request->email)->first();
        if ($organisasi) {
            $organisasi->PASSWORD = Hash::make($request->password);
            $organisasi->save();
            Cache::forget($cacheKey);
            return response()->json(['message' => 'Password berhasil direset (organisasi)']);
        }

        $penitip = Penitip::where('EMAIL', $request->email)->first();
        if ($penitip) {
            $penitip->PASSWORD = Hash::make($request->password);
            $penitip->save();
            Cache::forget($cacheKey);
            return response()->json(['message' => 'Password berhasil direset (penitip)']);
        }

        return response()->json(['message' => 'User tidak ditemukan'], 404);
    }

    public function forgotPasswordGabungan(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $pegawai = Pegawai::where('EMAIL', $request->email)->first();
        if ($pegawai) {
            // Reset pegawai ke tanggal lahir hanya boleh dilakukan admin/owner
            // yang sedang login, bukan oleh siapa pun yang mengetahui email.
            if (!auth('pegawai')->check() || !auth('pegawai')->user()->hasAnyRole(['admin', 'adminbiasa', 'owner'])) {
                return response()->json(['message' => 'Email tidak ditemukan'], 404);
            }

            $tanggalLahir = date('Y-m-d', strtotime($pegawai->TGL_LAHIR));
            $pegawai->PASSWORD = Hash::make($tanggalLahir);
            $pegawai->save();

            return response()->json([
                'message' => 'Password pegawai telah direset ke tanggal lahir (format YYYY-MM-DD)'
            ]);
        }

        $pembeli = Pembeli::where('email', $request->email)->first();
        if ($pembeli) {
            $token = $this->createPasswordResetToken($request->email);
            $resetUrl = "http://localhost:5173/reset-password?email={$request->email}&token=" . urlencode($token);
            Mail::to($request->email)->send(new ResetPasswordMail($resetUrl));

            return response()->json([
                'message' => 'Link reset password telah dikirim ke email Anda'
            ]);
        }

        $organisasi = Organisasi::where('email', $request->email)->first();
        if ($organisasi) {
            $token = $this->createPasswordResetToken($request->email);
            $resetUrl = "http://localhost:5173/reset-password?email={$request->email}&token=" . urlencode($token);
            Mail::to($request->email)->send(new ResetPasswordMail($resetUrl));

            return response()->json([
                'message' => 'Link reset password telah dikirim ke email Anda'
            ]);
        }

        $penitip = Penitip::where('email', $request->email)->first();
        if ($penitip) {
            $token = $this->createPasswordResetToken($request->email);
            $resetUrl = "http://localhost:5173/reset-password?email={$request->email}&token=" . urlencode($token);
            Mail::to($request->email)->send(new ResetPasswordMail($resetUrl));

            return response()->json([
                'message' => 'Link reset password telah dikirim ke email Anda'
            ]);
        }

        return response()->json(['message' => 'Email tidak ditemukan'], 404);
    }

    public function logout(Request $request)
    {
        try {
            // $user = $request->user(); // Ambil data user SEBELUM logout
            // if ($user) {
            //     Log::info('User logout successful.', [
            //         'user_id'    => $user->getKey(),
            //         'email'      => $user->EMAIL,
            //         'ip_address' => $request->ip()
            //     ]);
            // }
            if (auth('pegawai')->check()) {
                $user = auth('pegawai')->user();
                Log::info('User logout successful.', [
                    'user_id'    => $user->getKey(),
                    'email'      => $user->EMAIL,
                    'ip_address' => $request->ip()
                ]);
                if ($user->fcm_token) {
                    $user->fcm_token = null;
                    $user->save();
                }
                auth('pegawai')->logout();
            } elseif (auth('pembeli')->check()) {
                $user = auth('pembeli')->user();
                Log::info('User logout successful.', [
                    'user_id'    => $user->getKey(),
                    'email'      => $user->EMAIL,
                    'ip_address' => $request->ip()
                ]);
                if ($user->fcm_token) {
                    $user->fcm_token = null;
                    $user->save();
                }
                auth('pembeli')->logout();
            } elseif (auth('penitip')->check()) {
                $user = auth('penitip')->user();
                Log::info('User logout successful.', [
                    'user_id'    => $user->getKey(),
                    'email'      => $user->EMAIL,
                    'ip_address' => $request->ip()
                ]);
                if ($user->fcm_token) {
                    $user->fcm_token = null;
                    $user->save();
                }
                auth('penitip')->logout();
            } elseif (auth('organisasi')->check()) {
                $user = auth('organisasi')->user();
                Log::info('User logout successful.', [
                    'user_id'    => $user->getKey(),
                    'email'      => $user->EMAIL,
                    'ip_address' => $request->ip()
                ]);
                $user->fcm_token = null;
                $user->save();
                auth('organisasi')->logout();
            }
            return response()->json(['message' => 'Logout berhasil']);
        } catch (JWTException $e) {
            return response()->json(['error' => 'Gagal logout'], 500);
        }
    }

    public function profile(Request $request)
    {
        if (auth('pegawai')->check()) {
            $user = auth('pegawai')->user();
            return response()->json([
                'user_type' => 'pegawai',
                'user' => [
                    'id' => $user->ID_PEGAWAI,
                    'nama' => $user->NAMA,
                    'email' => $user->EMAIL,
                    'telepon' => $user->TELEPON,
                    'alamat' => $user->ALAMAT,
                    'role' => $user->getRoleNames()->toArray(),
                    'permissions' => $user->getAllPermissions()->pluck('name')->toArray()
                ]
            ]);
        }

        if (auth('pembeli')->check()) {
            $user = auth('pembeli')->user();
            return response()->json([
                'user_type' => 'pembeli',
                'user' => [
                    'id' => $user->ID_PEMBELI,
                    'nama' => $user->NAMA,
                    'email' => $user->EMAIL,
                    'telepon' => $user->TELEPON,
                    'poin' => $user->POIN_LOYALITAS,
                    'foto_pembeli' => $user->FOTO_PEMBELI,
                    'role' => $user->getRoleNames()->toArray(),
                    'permissions' => $user->getAllPermissions()->pluck('name')->toArray()
                ]
            ]);
        }

        if (auth('penitip')->check()) {
            $user = auth('penitip')->user();
            return response()->json([
                'user_type' => 'penitip',
                'user' => [
                    'id' => $user->ID_PENITIP,
                    'nama' => $user->NAMA,
                    'email' => $user->EMAIL,
                    'telepon' => $user->TELEPON,
                    'foto_ktp' => $user->FOTO_KTP ? asset('storage/' . $user->FOTO_KTP) : null,
                    'no_ktp' => $user->NO_KTP,
                    'alamat' => $user->ALAMAT,
                    'rating' => $user->RATING,
                    'badge' => $user->BADGE,
                    'jlh_penjualan' => $user->JLH_PENJUALAN,
                    'poin' => $user->POIN_LOYALITAS,
                    'saldo' => $user->SALDO,
                    'status' => $user->STATUS,
                    'role' => $user->getRoleNames()->toArray(),
                    'permissions' => $user->getAllPermissions()->pluck('name')->toArray()
                ]
            ]);
        }

        if (auth('organisasi')->check()) {
            $user = auth('organisasi')->user();
            return response()->json([
                'user_type' => 'organisasi',
                'user' => [
                    'id' => $user->ID_ORGANISASI,
                    'nama' => $user->NAMA,
                    'alamat' => $user->ALAMAT,
                    'telepon' => $user->TELEPON,
                    'deskripsi' => $user->DESKRIPSI,
                    'foto_organisasi' => $user->FOTO_ORGANISASI,
                    'email' => $user->EMAIL,
                    'role' => $user->getRoleNames()->toArray(),
                    'permissions' => $user->getAllPermissions()->pluck('name')->toArray()
                ]
            ]);
        }

        return response()->json(['error' => 'Unauthorized'], 401);
    }

    public function updateFcmToken(Request $request)
{
    $validator = Validator::make($request->all(), [
        'fcm_token' => 'required|string',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    if (auth('pegawai')->check()) {
        $user = auth('pegawai')->user();
        $user->fcm_token = $request->fcm_token;
        $user->save();
        return response()->json(['message' => 'FCM token updated for pegawai']);
    }

    if (auth('pembeli')->check()) {
        $user = auth('pembeli')->user();
        $user->fcm_token = $request->fcm_token;
        $user->save();
        return response()->json(['message' => 'FCM token updated for pembeli']);
    }

    if (auth('penitip')->check()) {
        $user = auth('penitip')->user();
        $user->fcm_token = $request->fcm_token;
        $user->save();
        return response()->json(['message' => 'FCM token updated for penitip']);
    }

    return response()->json(['error' => 'Unauthorized'], 401);
}
}