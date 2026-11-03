// register.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { Eye, EyeOff } from "lucide-react";
import Swal from "sweetalert2";
import HeroBg from "../../assets/hero-bg.png";
import logo from "../../assets/logo.png"; // Adjust path based on your folder structure

const Register = () => {
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    password: "",
    confirmPassword: "",
    notlp: "",
  });
  const [formErrors, setFormErrors] = useState({
    nama: "",
    email: "",
    password: "",
    confirmPassword: "",
    notlp: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};
    if (!formData.nama.trim()) {
      errors.nama = "Nama wajib diisi.";
    }
    if (!formData.email.trim()) {
      errors.email = "Email wajib diisi.";
    } else if (!/@/.test(formData.email)) {
      errors.email = "Email harus mengandung simbol @.";
    }
    if (!formData.password.trim()) {
      errors.password = "Password wajib diisi.";
    } else if (formData.password.length < 6) {
      errors.password = "Password harus minimal 6 karakter.";
    }
    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = "Konfirmasi password wajib diisi.";
    } else if (formData.confirmPassword !== formData.password) {
      errors.confirmPassword = "Konfirmasi password tidak cocok.";
    }
    if (!formData.notlp.trim()) {
      errors.notlp = "Nomor telepon wajib diisi.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormErrors({ nama: "", email: "", password: "", confirmPassword: "", notlp: "" }); // Clear previous errors
    if (!validateForm()) {
      await Swal.fire({
        icon: "warning",
        title: "Validasi Gagal",
        text: "Harap isi semua kolom dengan benar.",
        confirmButtonText: "OK",
        confirmButtonColor: "#4b7b6b",
      });
      setLoading(false);
      return;
    }
    try {
      const response = await axiosInstance.post("/auth/register/pembeli", {
        NAMA: formData.nama,
        EMAIL: formData.email,
        PASSWORD: formData.password,
        TELEPON: formData.notlp,
      });
      if (response.status === 201) {
        await Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Registrasi berhasil. Silakan login.",
          confirmButtonText: "OK",
          confirmButtonColor: "#4b7b6b",
        });
        navigate("/login");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Terjadi kesalahan saat registrasi.";
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: errorMessage,
        confirmButtonText: "OK",
        confirmButtonColor: "#4b7b6b",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[url('/src/assets/hero-bg.png')] bg-center bg-cover flex items-center justify-center p-20 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-olive-500/80 via-olive-500/80 to-olive-500/80"></div>
      <div className="bg-white rounded-4xl shadow-lg overflow-hidden flex w-full md:min-h-[85vh] relative">
        {/* Left Side - Register Form */}
        <div className="w-1/2 p-10 flex flex-col justify-center ml-10">
          <div className="flex flex-row items-center justify-center mb-7">
            <img src={logo} alt="Logo" className="h-14 w-14" />
          </div>
          <form onSubmit={handleSubmit} className="md:min-w-lg mx-auto">
            <p className="text-olive-900 text-2xl text-center mb-10">
              Daftar ke ReuseMart
            </p>
            <div className="mb-4">
              <label className="block text-olive-900 text-lg font-medium mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 ${
                  formErrors.nama ? "border-red-500" : "border-olive-500"
                }`}
                placeholder="Masukkan nama lengkap"
                aria-describedby={formErrors.nama ? "nama-error" : undefined}
              />
              {formErrors.nama && (
                <p id="nama-error" className="text-red-500 text-sm mt-1" aria-live="polite">
                  {formErrors.nama}
                </p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-olive-900 text-lg font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 ${
                  formErrors.email ? "border-red-500" : "border-olive-500"
                }`}
                placeholder="name@email.com"
                aria-describedby={formErrors.email ? "email-error" : undefined}
              />
              {formErrors.email && (
                <p id="email-error" className="text-red-500 text-sm mt-1" aria-live="polite">
                  {formErrors.email}
                </p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-olive-900 text-lg font-medium mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 ${
                    formErrors.password ? "border-red-500" : "border-olive-500"
                  }`}
                  placeholder="••••••••"
                  aria-describedby={formErrors.password ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-olive-500 hover:text-olive-700"
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
              {formErrors.password && (
                <p id="password-error" className="text-red-500 text-sm mt-1" aria-live="polite">
                  {formErrors.password}
                </p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-olive-900 text-lg font-medium mb-1">
                Konfirmasi Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 ${
                    formErrors.confirmPassword ? "border-red-500" : "border-olive-500"
                  }`}
                  placeholder="••••••••"
                  aria-describedby={formErrors.confirmPassword ? "confirmPassword-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-olive-500 hover:text-olive-700"
                >
                  {showConfirmPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p id="confirmPassword-error" className="text-red-500 text-sm mt-1" aria-live="polite">
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>
            <div className="mb-6">
              <label className="block text-olive-900 text-lg font-medium mb-1">
                Nomor Telepon
              </label>
              <input
                type="text"
                name="notlp"
                value={formData.notlp}
                onChange={handleChange}
                className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 ${
                  formErrors.notlp ? "border-red-500" : "border-olive-500"
                }`}
                placeholder="08XXXXXXXX"
                aria-describedby={formErrors.notlp ? "notlp-error" : undefined}
              />
              {formErrors.notlp && (
                <p id="notlp-error" className="text-red-500 text-sm mt-1" aria-live="polite">
                  {formErrors.notlp}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white text-lg py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 focus:ring-offset-2 ${
                loading ? "bg-stone-300 cursor-not-allowed" : "bg-olive-500 hover:bg-olive-900"
              }`}
            >
              {loading ? "Mendaftar..." : "Daftar"}
            </button>
          </form>
          <div className="text-center mt-6">
            Sudah punya akun?{" "}
            <Link
              to="/login"
              className="text-olive-500 font-bold hover:underline"
            >
              Masuk
            </Link>
          </div>
          <div className="text-center mt-2">
            <Link
              to="/register-selection"
              className="text-olive-500 hover:underline"
            >
              Kembali ke pemilihan jenis akun
            </Link>
          </div>
        </div>
        {/* Right Side - Image */}
        <div className="w-4/5 p-10 relative rounded-4xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-white/0"></div>
          <img
            src={HeroBg}
            alt="Hero"
            className="object-cover w-full h-full rounded-4xl"
          />
        </div>
      </div>
    </div>
  );
};

export default Register;