import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const ResetPass = () => {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get('token') || '');
    setEmail(params.get('email') || '');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi input password
    if (!password || !passwordConfirm) {
      await Swal.fire({
        icon: 'warning',
        title: 'Validasi Gagal',
        text: 'Harap isi kedua field password.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    if (password.length < 6) {
      await Swal.fire({
        icon: 'warning',
        title: 'Validasi Gagal',
        text: 'Password harus minimal 6 karakter.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    if (password !== passwordConfirm) {
      await Swal.fire({
        icon: 'warning',
        title: 'Validasi Gagal',
        text: 'Password dan konfirmasi password tidak cocok.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    // Confirmation prompt
    const result = await Swal.fire({
      icon: 'question',
      title: 'Konfirmasi',
      text: 'Apakah Anda yakin ingin mereset password?',
      showCancelButton: true,
      confirmButtonText: 'Ya, Reset',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
    });

    if (!result.isConfirmed) {
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/auth/reset-password', {
        email,
        token,
        password,
        password_confirmation: passwordConfirm,
      });

      await Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: res.data.message || 'Password berhasil direset!',
        confirmButtonText: 'OK',
        confirmButtonColor: '#2563eb',
      });
      navigate('/login'); // Navigate to login after success
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.response?.data?.message || 'Terjadi kesalahan saat reset password.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#2563eb',
      });
    } finally {
      setLoading(false);
    }
  };

  // Jika token tidak valid
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-10 rounded-xl shadow-xl w-full max-w-md">
          <h2 className="text-3xl font-semibold text-gray-800 text-center">
            Token tidak valid!
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300">
      <div className="bg-white p-10 rounded-xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/src/assets/logo.png"
            alt="Logo"
            className="h-16 w-16 mx-auto mb-4"
          />
          <h2 className="text-3xl font-semibold text-gray-800">Reset Password</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Masukkan Password Baru"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-4 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div className="mb-6">
            <label
              htmlFor="passwordConfirm"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Konfirmasi Password
            </label>
            <div className="relative">
              <input
                type={showPasswordConfirm ? 'text' : 'password'}
                id="passwordConfirm"
                placeholder="Konfirmasi Password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                className="w-full p-4 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswordConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition duration-200"
          >
            {loading ? 'Sedang memproses...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPass;