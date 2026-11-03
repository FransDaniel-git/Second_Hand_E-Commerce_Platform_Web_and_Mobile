import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  ShoppingCart,
  Bell,
  Home,
  Package,
  Info,
  LogIn,
  UserPlus,
} from "lucide-react";
import AuthService from "../../../services/authService";
import axiosInstance from "../../../utils/axiosInstance";

const API_URL = "http://localhost:8000/api";

const UserNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const location = useLocation();

  const isHomePage = location.pathname === "/";

  useEffect(() => {
    if (isHomePage) {
      const handleScroll = () => {
        setScrolled(window.scrollY > 10);
      };
      window.addEventListener("scroll", handleScroll);
      handleScroll();
      return () => window.removeEventListener("scroll", handleScroll);
    } else {
      setScrolled(true);
    }
  }, [isHomePage]);

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = AuthService.isAuthenticated();
      setIsLoggedIn(authStatus);
      const currentUser = authStatus ? AuthService.getCurrentUser() : null;
      setUserData(currentUser);
      if (
        authStatus &&
        currentUser?.nama &&
        !localStorage.getItem("userInitials")
      ) {
        const initials = currentUser.nama
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .substring(0, 2);
        localStorage.setItem("userInitials", initials);
      }
    };

    const fetchCartCount = async () => {
      if (
        AuthService.isAuthenticated() &&
        AuthService.getUserType() === "pembeli"
      ) {
        try {
          const response = await axiosInstance.get(`${API_URL}/pembeli/cart`);
          const items = response.data.data?.items || [];
          setCartCount(items.length);
        } catch (err) {
          console.error(
            "Error fetching cart count:",
            err.response?.data || err.message
          );
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    checkAuth();
    fetchCartCount();

    const handleStorageChange = () => {
      checkAuth();
      fetchCartCount();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authChange", handleStorageChange);
    window.addEventListener("cartChange", fetchCartCount);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChange", handleStorageChange);
      window.removeEventListener("cartChange", fetchCartCount);
    };
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const linkClasses = (path) =>
    `px-3 py-2 rounded-md text-base font-medium transition duration-150 flex items-center ${
      isActive(path)
        ? scrolled
          ? "text-olive-500 bg-olive-300"
          : "text-white bg-white/20"
        : scrolled
        ? "text-black hover:text-olive-500 hover:bg-olive-100"
        : "text-white hover:text-olive-200 hover:bg-white/10"
    }`;

  const getInitials = () => {
    const storedInitials = localStorage.getItem("userInitials");
    if (storedInitials) {
      return storedInitials;
    }
    if (userData && userData.nama) {
      const initials = userData.nama
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
      localStorage.setItem("userInitials", initials);
      return initials;
    }
    return "US";
  };

  return (
    <nav className="fixed top-0 z-50 px-4 sm:px-6 lg:px-16 w-full">
      <div
        className={`w-full px-4 transition-all duration-300 ${
          scrolled || !isHomePage
            ? "bg-white shadow-md rounded-b-2xl"
            : "bg-transparent"
        }`}
      >
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <img
                  className="h-8 w-8"
                  src="/src/assets/logo.png"
                  alt="ReuseMart"
                />
              </Link>
              <span
                className={`ml-2 text-xl font-bold transition-colors duration-300 ${
                  scrolled ? "text-black" : "text-white"
                }`}
              >
                ReuseMart
              </span>
            </div>
            <div className="hidden md:ml-12 md:flex md:items-center md:space-x-5 text-sm">
              <a href="/" className={linkClasses("/")}>
                <Home className="mr-1 h-4 w-4" /> Beranda
              </a>
              <a href="/catalogue" className={linkClasses("/catalogue")}>
                <Package className="mr-1 h-4 w-4" /> Katalog
              </a>
              <a href="/about" className={linkClasses("/about")}>
                <Info className="mr-1 h-4 w-4" /> Tentang Kami
              </a>
            </div>
          </div>

          <div className="relative flex items-center w-full max-w-md text-sm">
            <input
              type="text"
              placeholder="Cari..."
              className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500 transition-colors duration-300 ${
                scrolled
                  ? "bg-olive-100 text-olive-500"
                  : "border border-white text-white"
              }`}
            />
            <button
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                scrolled ? "text-olive-500" : "text-white"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M16.65 10.65a6 6 0 11-12 0 6 6 0 0112 0z"
                />
              </svg>
            </button>
          </div>

          <div className="hidden md:flex items-center md:space-x-1 text-sm">
            {isLoggedIn ? (
              <>
                <a
                  href="/cart"
                  className={`p-2 rounded-full transition-colors duration-300 ${
                    scrolled
                      ? "text-black hover:text-stone-500"
                      : "text-white hover:text-gray-200"
                  } hover:bg-gray-100 relative`}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </a>

                <a
                  href="/notifications"
                  className={`mx-4 p-2 rounded-full transition-colors duration-300 ${
                    scrolled
                      ? "text-black hover:text-stone-500"
                      : "text-white hover:text-gray-200"
                  } hover:bg-gray-100 relative`}
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                    2
                  </span>
                </a>
                <Link to="/profile" className="ml-6">
                  <div className="h-8 w-8 rounded-full bg-stone-500 flex items-center justify-center text-white font-semibold text-sm">
                    {userData ? getInitials(userData.nama) : "US"}
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 text-sm font-medium rounded-md flex items-center transition-colors duration-300 ${
                    scrolled
                      ? "text-black hover:text-stone-700 hover:bg-olive-100"
                      : "text-white hover:bg-olive-300/30"
                  }`}
                >
                  <LogIn className="mr-1 h-4 w-4" /> Masuk
                </Link>
                <Link
                  to="/register-selection"
                  className={`ml-3 px-4 py-2 text-sm font-medium rounded-md flex items-center transition-colors duration-300 ${
                    scrolled
                      ? "bg-olive-500 text-white hover:bg-olive-900"
                      : "bg-olive-300/20 bg-opacity-20 text-white hover:bg-opacity-100"
                  }`}
                >
                  <UserPlus className="mr-1 h-4 w-4" /> Daftar
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md transition-colors duration-300 ${
                scrolled ? "text-black" : "text-white"
              } hover:text-stone-500 hover:bg-gray-100`}
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className={`md:hidden ${isMenuOpen ? "block" : "hidden"}`}>
        <div
          className={`px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t ${
            scrolled || !isHomePage
              ? "bg-white shadow-md"
              : "bg-white bg-opacity-95"
          }`}
        >
          <Link
            to="/"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-stone-500 hover:bg-gray-100"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="flex items-center">
              <Home className="mr-2 h-5 w-5" />
              Home
            </span>
          </Link>
          <Link
            to="/catalogue"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-stone-500 hover:bg-gray-100"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Products
            </span>
          </Link>
          <Link
            to="/about"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-stone-500 hover:bg-gray-100"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="flex items-center">
              <Info className="mr-2 h-5 w-5" />
              About Us
            </span>
          </Link>

          {isLoggedIn ? (
            <div className="border-t pt-4 pb-3">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-stone-500 flex items-center justify-center text-white font-semibold">
                    {userData ? getInitials(userData.nama) : "US"}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {userData?.nama || "User"}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    {userData?.email || "user@example.com"}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1 px-2">
                <Link
                  to="/cart"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-stone-500 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="flex items-center">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Cart
                    {cartCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                        {cartCount}
                      </span>
                    )}
                  </span>
                </Link>
                <Link
                  to="/notifications"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-stone-500 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="flex items-center">
                    <Bell className="mr-2 h-5 w-5" />
                    Notifications
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      2
                    </span>
                  </span>
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-stone-500 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t flex flex-col space-y-2 px-3">
              <Link
                to="/login"
                className="flex items-center justify-center px-4 py-2 text-base font-medium text-stone-500 rounded-md border border-stone-500"
                onClick={() => setIsMenuOpen(false)}
              >
                <LogIn className="mr-2 h-5 w-5" />
                Login
              </Link>
              <Link
                to="/register-selection"
                className="flex items-center justify-center px-4 py-2 text-base font-medium text-white bg-stone-500 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default UserNavbar;
