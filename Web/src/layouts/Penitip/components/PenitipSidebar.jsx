import React, { useState, useEffect } from "react";
import {
  Menu,
  PanelLeftClose,
  Home,
  User,
  Package,
  PlusCircle,
  ShoppingCart,
  BarChart3,
  History,
  LogOut,
} from "lucide-react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import PenitipSidebarItem from "./PenitipSidebarItem";

const PenitipSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage (saved during login)
    const getUserData = () => {
      try {
        setIsLoading(true);

        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem("userData"));
        const userType = localStorage.getItem("userType");

        if (!userData || userType !== "penitip") {
          console.error("No penitip data found in localStorage");
          navigate("/login");
          return;
        }

        setUserData(userData);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load user data:", error);
        navigate("/login");
      }
    };

    getUserData();
  }, [navigate]);

  // Logout function
  const handleLogout = () => {
    // Clear all auth related data
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("userData");

    // Redirect ke halaman login
    navigate("/login");

    // Optional: Force reload halaman untuk clear state
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="bg-white text-black fixed h-full z-50 w-64 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-olive-100 text-black transition-all duration-300 fixed h-full z-50 ${
        sidebarOpen ? "w-64" : "sm:w-20 w-64"
      } ${sidebarOpen ? "left-0" : "sm:left-0 -left-full"}`}
    >
      <div className="flex items-center justify-between p-6 border-b border-olive-500">
        {(sidebarOpen || window.innerWidth < 640) && (
          <div className="flex items-center space-x-2 mr-3">
            <img src="/src/assets/logo.png" alt="Logo" className="h-6 w-6" />
            <h1 className="text-xl text-olive-500 font-bold">ReuseMart</h1>
          </div>
        )}
        <div className="sm:block hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-olive-500 hover:text-white"
          >
            {sidebarOpen ? <PanelLeftClose size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <div className="sm:hidden block">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-olive-500 hover:text-white"
          >
            <PanelLeftClose size={20} />
          </button>
        </div>
      </div>
      <nav className="mt-6">
        {/* Dashboard */}
        <PenitipSidebarItem
          icon={<Home />}
          text="Dashboard"
          path="dashboard"
          expanded={sidebarOpen || window.innerWidth < 640}
        />

        {/* Profile */}
        <PenitipSidebarItem
          icon={<User />}
          text="Profile"
          path="profile"
          expanded={sidebarOpen || window.innerWidth < 640}
        />

        {/* Daftar Barang Titipan */}
        <PenitipSidebarItem
          icon={<Package />}
          text="Daftar Barang"
          path="daftar-barang"
          expanded={sidebarOpen || window.innerWidth < 640}
        />

        {/* Daftar Penjualan */}
        <PenitipSidebarItem
          icon={<ShoppingCart />}
          text="Penjualan"
          path="history-penjualan"
          expanded={sidebarOpen || window.innerWidth < 640}
        />
        {/* Daftar Barang Titipan */}
        <PenitipSidebarItem
          icon={<Package />}
          text="Daftar Barang Kadaluarsa"
          path="daftar-barang-kadaluarsa"
          expanded={sidebarOpen || window.innerWidth < 640}
        />

        {/* Logout */}
        <div className="absolute bottom-0 w-full border-t border-olive-500 p-2">
          <button
            onClick={() => {
              Swal.fire({
                title: "Konfirmasi Logout",
                text: "Apakah Anda yakin ingin logout?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Ya, Logout",
                cancelButtonText: "Batal",
                customClass: {
                  popup: "swal2-sm-popup",
                },
              }).then((result) => {
                if (result.isConfirmed) {
                  handleLogout();
                  Swal.fire({
                    title: "Logged Out",
                    text: "Anda telah berhasil logout.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: {
                      popup: "swal2-sm-popup",
                    },
                  });
                }
              });
            }}
            className={`flex items-center w-full p-3 rounded-lg hover:bg-olive-500 hover:text-white transition-colors duration-200 ${
              sidebarOpen || window.innerWidth < 640
                ? "justify-start"
                : "justify-center"
            }`}
            title="Logout"
          >
            <LogOut size={20} />
            {(sidebarOpen || window.innerWidth < 640) && (
              <span className="ml-3">Keluar</span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
};

export default PenitipSidebar;

