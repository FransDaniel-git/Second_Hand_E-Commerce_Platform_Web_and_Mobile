import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import AuthService from "../../services/authService";
import HeroBg from "../../assets/hero-bg.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // ... useEffect Anda tidak diubah
    if (AuthService.isAuthenticated()) {
      const userType = AuthService.getUserType();
      if (userType === "pegawai") {
        navigate("/admin/dashboard");
      } else if (userType === "pembeli") {
        navigate("/");
      } else if (userType === "penitip") {
        navigate("/penitip/dashboard");
      } else if (userType === "organisasi") {
        navigate("/admin/manage-request-donasi");
      }
    }
    if (location.state?.message) {
      setError(location.state.message);
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await AuthService.login(email, password);

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userType", response.data.user_type);
        localStorage.setItem("userData", JSON.stringify(response.data.user));

        window.dispatchEvent(new Event("authChange"));
        toast.success("Login berhasil!");

        // Navigate berdasarkan user type
        if (response.data.user_type === "pegawai") {
          navigate("/admin/dashboard");
        } else if (response.data.user_type === "organisasi") {
          navigate("/admin/manage-request-donasi");
        } else if (response.data.user_type === "penitip") {
          navigate("/penitip/dashboard");
        } else {
          navigate("/");
        }
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Email atau Password Salah.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[url('/src/assets/hero-bg.png')] bg-center bg-cover flex items-center justify-center px-20 py-10 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-olive-500/80 to-olive-500/80"></div>
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col md:flex-row w-full relative p-6 md:p-10 md:h-[85vh]">
        {/* Left Side - Form Area */}
        <div className="w-full md:w-2/5 flex flex-col justify-center items-center">
          <img
            src="/src/assets/logo.png" // Path diubah agar lebih standar
            alt="Logo"
            className="h-12 w-12 mb-4"
          />

          <p className="text-olive-900 text-xl text-center mb-6">
            Masuk ke Akun Anda
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded mb-4 font-medium text-center w-full max-w-sm">
              {error === "Akun tidak aktif"
                ? "Akun Anda tidak aktif. Silakan hubungi admin."
                : error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 w-full max-w-sm"
          >
            <div>
              <label className="block text-olive-900 text-md font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-olive-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-olive-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-olive-900 text-md font-medium mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-3 py-2 pr-10 border border-olive-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-olive-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-olive-500 hover:text-olive-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="text-right text-sm mt-1">
                <Link
                  to="/forgotPass"
                  className="text-olive-500 hover:text-olive-900"
                >
                  Lupa Password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-olive-500 text-white py-2 rounded-lg hover:bg-olive-900 transition disabled:bg-stone-300"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="text-center mt-6 text-sm">
            Belum punya akun?{" "}
            <Link
              to="/register-selection"
              className="text-olive-500 font-semibold hover:underline"
            >
              Daftar
            </Link>
          </div>
        </div>

        {/* Right Side - Hero Image */}
        <div className="hidden md:block md:w-3/5 relative rounded-2xl overflow-hidden ml-6">
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-white/0"></div>
          <img
            src={HeroBg}
            alt="Hero"
            className="object-cover w-full h-full rounded-2xl"
          />
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Login;
