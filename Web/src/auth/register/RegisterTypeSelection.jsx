import React from "react";
import { Link } from "react-router-dom";
import { UserCircle, Building } from "lucide-react";
import HeroBg from "../../assets/hero-bg.png";

const RegisterTypeSelection = () => {
  return (
    <div className="min-h-screen bg-[url('/src/assets/hero-bg.png')] bg-center bg-cover flex items-center justify-center px-20 py-10 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-olive-500/80 to-olive-500/80"></div>
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col md:flex-row w-full relative p-6 md:p-10 md:min-h-[85vh]">
        
        {/* Left Side - Selection Form */}
        <div className="w-full md:w-2/5 flex flex-col justify-center items-center">
          <img src="src/assets/logo.png" alt="Logo" className="h-12 w-12 mb-4" />

          <p className="text-olive-900 text-xl text-center mb-6">Pilih Jenis Akun</p>
          
          <div className="flex flex-col gap-4 w-full max-w-sm">
            {/* Pembeli */}
            <Link to="/register" className="flex flex-col items-center p-4 bg-white rounded-xl border border-olive-500 hover:border-olive-900 transition shadow-sm">
              <div className="p-2 bg-olive-100 rounded-full mb-2">
                <UserCircle size={36} className="text-olive-600" />
              </div>
              <h2 className="text-lg font-semibold text-olive-900 mb-1">Pembeli</h2>
              <p className="text-center text-sm text-olive-800">Akses katalog produk & lakukan pembelian</p>
              <button className="mt-3 w-full bg-olive-500 text-white py-2 rounded-lg hover:bg-olive-900">Daftar sebagai Pembeli</button>
            </Link>

            {/* Organisasi */}
            <Link to="/register-organisasi" className="flex flex-col items-center p-4 bg-white rounded-xl border border-olive-500 hover:border-olive-900 transition shadow-sm">
              <div className="p-2 bg-olive-100 rounded-full mb-2">
                <Building size={36} className="text-olive-600" />
              </div>
              <h2 className="text-lg font-semibold text-olive-900 mb-1">Organisasi</h2>
              <p className="text-center text-sm text-olive-800">Sediakan produk & ajukan donasi</p>
              <button className="mt-3 w-full bg-olive-500 text-white py-2 rounded-lg hover:bg-olive-900">Daftar sebagai Organisasi</button>
            </Link>
          </div>

          <div className="text-center mt-5 text-sm">
            Sudah punya akun?{" "}
            <Link to="/login" className="text-olive-500 font-semibold hover:underline">Masuk</Link>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="hidden md:block md:w-3/5 relative rounded-2xl overflow-hidden ml-6">
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-white/0"></div>
          <img src={HeroBg} alt="Hero" className="object-cover w-full h-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
};

export default RegisterTypeSelection;
