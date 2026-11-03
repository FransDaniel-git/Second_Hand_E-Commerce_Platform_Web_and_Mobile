import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  User,
  MapPin,
  Phone,
  CreditCard,
  Award,
  Star,
  Camera,
  Activity,
  TrendingUp,
} from "lucide-react";

const PenitipProfile = () => {
  const [penitipData, setPenitipData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get("/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setPenitipData(response.data.user);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch profile data");
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const getBadgeColor = (badge) => {
    if (badge === 1) {
      return "bg-gradient-to-r from-yellow-400 to-yellow-600";
    }
    return "bg-gradient-to-r from-blue-400 to-blue-600";
  };

  const getStatusColor = (status) => {
    return status === "active"
      ? "text-green-600 bg-green-100"
      : "text-red-600 bg-red-100";
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star
          key="half"
          className="w-5 h-5 fill-yellow-400 text-yellow-400 opacity-50"
        />
      );
    }

    const remainingStars = 5 - Math.ceil(rating || 0);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-5 h-5 text-gray-300" />);
    }

    return stars;
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  if (!penitipData) {
    return <div className="text-center py-10">No profile data available</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-olive-900 to-olive-500 px-8 py-12 text-white relative">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <User className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold mb-2">
                      {penitipData.nama}
                    </h1>
                    {penitipData.badge === 1 && (
                      <div
                        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getBadgeColor(
                          penitipData.badge
                        )} text-white shadow-lg`}
                      >
                        <Award className="w-4 h-4 mr-2" />
                        Top Seller
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Saldo</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(penitipData.saldo || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Poin Loyalitas
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {(penitipData.poin || 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Rating</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-gray-900">
                    {penitipData.rating || 0}
                  </p>
                  <div className="flex">{renderStars(penitipData.rating)}</div>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Penjualan
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {penitipData.jlh_penjualan || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Information */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <User className="w-6 h-6 mr-3 text-indigo-600" />
              Informasi Personal
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  Alamat
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {penitipData.alamat || "-"}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  Telepon
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {penitipData.telepon || "-"}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  Email
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {penitipData.email || "-"}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2 text-gray-400" />
                  No. KTP
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg font-mono">
                  {penitipData.no_ktp || "-"}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-gray-400" />
                  Status
                </label>
                <div
                  className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold ${getStatusColor(
                    penitipData.status
                  )}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      penitipData.status === "active"
                        ? "bg-green-600"
                        : "bg-red-600"
                    }`}
                  ></div>
                  {penitipData.status === "active" ? "Aktif" : "Tidak Aktif"}
                </div>
              </div>
            </div>
          </div>

          {/* KTP Photo and Additional Info */}
          <div className="space-y-6">
            {/* Achievement Badge */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-indigo-600" />
                Pencapaian
              </h3>
              <div className="space-y-3">
                {penitipData.badge === 1 && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center">
                      <Award className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Top Seller
                      </span>
                    </div>
                    <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                      Aktif
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                      Top Rated
                    </span>
                  </div>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    4.8★
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                      Highest Income
                    </span>
                  </div>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Rp. 5.000.000,00
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PenitipProfile;
