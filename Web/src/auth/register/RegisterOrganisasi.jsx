// RegisterOrganisasi.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Upload, Eye, EyeOff } from "lucide-react";
import HeroBg from "../../assets/hero-bg.png";
import axiosInstance from "../../utils/axiosInstance";
import Swal from "sweetalert2";
import logo from "../../assets/logo.png"; // Adjust path based on your folder structure

const RegisterOrganization = () => {
  const [logoPreview, setLogoPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    namaOrganisasi: "",
    email: "",
    password: "",
    confirmPassword: "",
    alamat: "",
    notlp: "",
    deskripsi: "",
  });
  const [formErrors, setFormErrors] = useState({
    namaOrganisasi: "",
    email: "",
    password: "",
    confirmPassword: "",
    alamat: "",
    notlp: "",
    deskripsi: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};
    if (!formData.namaOrganisasi.trim()) {
      errors.namaOrganisasi = "Nama organisasi wajib diisi.";
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
    if (!formData.alamat.trim()) {
      errors.alamat = "Alamat wajib diisi.";
    }
    if (!formData.notlp.trim()) {
      errors.notlp = "Nomor telepon wajib diisi.";
    }
    if (!formData.deskripsi.trim()) {
      errors.deskripsi = "Deskripsi wajib diisi.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({
      namaOrganisasi: "",
      email: "",
      password: "",
      confirmPassword: "",
      alamat: "",
      notlp: "",
      deskripsi: "",
    }); // Clear previous errors
    setLoading(true);
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
    const formDataToSend = new FormData();
    formDataToSend.append("NAMA", formData.namaOrganisasi);
    formDataToSend.append("EMAIL", formData.email);
    formDataToSend.append("PASSWORD", formData.password);
    formDataToSend.append("ALAMAT", formData.alamat);
    formDataToSend.append("TELEPON", formData.notlp);
    formDataToSend.append("DESKRIPSI", formData.deskripsi);
    const logoInput = document.getElementById("logo");
    if (logoInput.files[0]) {
      formDataToSend.append("FOTO_ORGANISASI", logoInput.files[0]);
    }
    try {
      const response = await axiosInstance.post(
        "/auth/register/organisasi",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.status === 201) {
        await Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Registrasi berhasil! Mengarahkan ke login...",
          confirmButtonText: "OK",
          confirmButtonColor: "#4b7b6b",
        });
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        Object.entries(err.response?.data?.errors || {})
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n") ||
        "Terjadi kesalahan saat registrasi.";
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
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-20"
      style={{ backgroundImage: `url(${HeroBg})` }}
    >
      <div className="absolute inset-0 bg-olive-500/80 z-0" />
      <div className="relative z-10 w-full bg-white rounded-3xl shadow-lg overflow-hidden h-[85vh] flex flex-col md:flex-row p-10">
        {/* Form Section */}
        <div className="w-full md:w-2/5 p-8 md:p-10 overflow-y-auto">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Logo" className="h-14 w-14" />
          </div>
          <h1 className="text-2xl font-bold text-olive-900 text-center mb-6">
            Daftar sebagai Organisasi
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-olive-900 mb-1">
                Nama Organisasi
              </label>
              <input
                type="text"
                name="namaOrganisasi"
                value={formData.namaOrganisasi}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 ${
                  formErrors.namaOrganisasi ? "border-red-500" : "border-olive-500"
                }`}
                placeholder="Masukkan nama organisasi"
              />
              {formErrors.namaOrganisasi && (
                <p className="text-red-500 text-sm mt-1">{formErrors.namaOrganisasi}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-olive-900 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 ${
                  formErrors.email ? "border-red-500" : "border-olive-500"
                }`}
                placeholder="organisasi@example.com"
              />
              {formErrors.email && (
                <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-olive-900 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 pr-10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 ${
                    formErrors.password ? "border-red-500" : "border-olive-500"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-olive-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-olive-900 mb-1">
                Konfirmasi Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 pr-10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 ${
                    formErrors.confirmPassword ? "border-red-500" : "border-olive-500"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2 text-olive-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{formErrors.confirmPassword}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-olive-900 mb-1">
                Alamat
              </label>
              <textarea
                name="alamat"
                rows="2"
                value={formData.alamat}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 ${
                  formErrors.alamat ? "border-red-500" : "border-olive-500"
                }`}
                placeholder="Alamat lengkap"
              ></textarea>
              {formErrors.alamat && (
                <p className="text-red-500 text-sm mt-1">{formErrors.alamat}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-olive-900 mb-1">
                Nomor Telepon
              </label>
              <input
                type="number"
                name="notlp"
                value={formData.notlp}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 ${
                  formErrors.notlp ? "border-red-500" : "border-olive-500"
                }`}
                placeholder="08xxxxxxxxxx"
              />
              {formErrors.notlp && (
                <p className="text-red-500 text-sm mt-1">{formErrors.notlp}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-olive-900 mb-1">
                Deskripsi Organisasi
              </label>
              <textarea
                name="deskripsi"
                rows="2"
                value={formData.deskripsi}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 ${
                  formErrors.deskripsi ? "border-red-500" : "border-olive-500"
                }`}
                placeholder="Deskripsi singkat organisasi"
              ></textarea>
              {formErrors.deskripsi && (
                <p className="text-red-500 text-sm mt-1">{formErrors.deskripsi}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-olive-900 mb-1">
                Logo Organisasi
              </label>
              <label
                htmlFor="logo"
                className="flex flex-col items-center justify-center w-full h-24 border border-olive-500 border-dashed rounded-xl cursor-pointer bg-olive-50 hover:bg-olive-100"
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    <Upload className="w-6 h-6 mb-1 text-olive-600" />
                    <p className="text-sm text-olive-600 font-semibold">Klik untuk upload</p>
                    <p className="text-xs text-olive-500">SVG, PNG, JPG (MAX. 2MB)</p>
                  </div>
                )}
                <input
                  id="logo"
                  type="file"
                  name="logo"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-olive-500 text-white text-md py-2 rounded-xl hover:bg-olive-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-olive-500 disabled:bg-stone-300"
            >
              {loading ? "Mendaftar..." : "Daftar Organisasi"}
            </button>
            <p className="text-center text-sm mt-4">
              Sudah punya akun?{" "}
              <Link to="/login" className="text-olive-600 font-semibold hover:underline">
                Masuk
              </Link>
            </p>
            <p className="text-center text-sm mt-2">
              <Link to="/register-selection" className="text-olive-600 hover:underline">
                Kembali ke pemilihan jenis akun
              </Link>
            </p>
          </form>
        </div>
        {/* Right Section */}
        <div className="hidden md:block w-3/5 relative">
          <img
            src={HeroBg}
            alt="Background"
            className="w-full h-full object-cover rounded-r-2xl"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/60 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default RegisterOrganization;