import axios from "axios";

// Base API URL - sesuaikan dengan backend Laravel Anda
const API_URL = "http://localhost:8000/api/auth";

class AuthService {
  /**
   * Mengirim kredensial untuk login.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>} Respons dari server yang berisi token dan data user.
   */
  async login(email, password) {
    const response = await axios.post(`${API_URL}/login`, {
      EMAIL: email,
      PASSWORD: password,
    });

    // Jika respons berisi token, simpan data sesi ke localStorage.
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userType", response.data.user_type);
      localStorage.setItem("userData", JSON.stringify(response.data.user));
      console.log("AuthService: User data and token stored after login.");
    }

    return response;
  }

  /**
   * Menghapus data sesi dari localStorage saat logout.
   */
  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("userData");
    console.log("AuthService: User logged out.");
  }

  /**
   * Mengambil data pengguna yang tersimpan dari localStorage.
   * @returns {object|null}
   */
  getCurrentUser() {
    const userData = localStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Mengambil tipe pengguna yang tersimpan dari localStorage.
   * @returns {string|null}
   */
  getUserType() {
    return localStorage.getItem("userType");
  }

  /**
   * Memeriksa apakah ada token yang tersimpan, menandakan pengguna terotentikasi.
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!localStorage.getItem("token");
  }
}

export default new AuthService();
