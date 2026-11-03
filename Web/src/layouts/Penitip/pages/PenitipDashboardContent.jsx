import React, { useState, useEffect } from "react";
import {
  Package,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PenitipDashboardContent = () => {
  const [dashboardData, setDashboardData] = useState({
    totalBarang: 0,
    totalPenjualan: 0,
    barangTerjual: 0,
    barangAktif: 0,
    pendapatanBulanIni: 0,
    rataRataPenjualan: 0,
  });

  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    // Simulate API call to get dashboard data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Simulate API response - replace with actual API call
    const mockData = {
      totalBarang: 156,
      totalPenjualan: 89,
      barangTerjual: 89,
      barangAktif: 67,
      pendapatanBulanIni: 12500000,
      rataRataPenjualan: 140000,
    };

    // Mock sales trend data for the last 7 days
    const mockSalesData = [
      { date: "2024-01-01", penjualan: 12, pendapatan: 1800000 },
      { date: "2024-01-02", penjualan: 8, pendapatan: 1200000 },
      { date: "2024-01-03", penjualan: 15, pendapatan: 2250000 },
      { date: "2024-01-04", penjualan: 10, pendapatan: 1500000 },
      { date: "2024-01-05", penjualan: 18, pendapatan: 2700000 },
      { date: "2024-01-06", penjualan: 14, pendapatan: 2100000 },
      { date: "2024-01-07", penjualan: 12, pendapatan: 1800000 },
    ];

    // Mock category distribution data
    const mockCategoryData = [
      { name: "Elektronik", value: 35, color: "#0088FE" },
      { name: "Pakaian", value: 28, color: "#00C49F" },
      { name: "Aksesoris", value: 20, color: "#FFBB28" },
      { name: "Peralatan", value: 17, color: "#FF8042" },
    ];

    // Mock monthly performance data
    const mockMonthlyData = [
      { month: "Jan", barang: 20, terjual: 18, pendapatan: 2500000 },
      { month: "Feb", barang: 25, terjual: 22, pendapatan: 3200000 },
      { month: "Mar", barang: 30, terjual: 26, pendapatan: 3800000 },
      { month: "Apr", barang: 28, terjual: 24, pendapatan: 3600000 },
      { month: "May", barang: 35, terjual: 28, pendapatan: 4200000 },
      { month: "Jun", barang: 32, terjual: 30, pendapatan: 4500000 },
    ];

    setDashboardData(mockData);
    setSalesData(mockSalesData);
    setCategoryData(mockCategoryData);
    setMonthlyData(mockMonthlyData);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    change,
    isMonetary = false,
  }) => (
    <div
      className="bg-white rounded-lg shadow-md p-6 border-l-4"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {isMonetary ? formatCurrency(value) : value.toLocaleString()}
          </p>
          {change && (
            <p
              className={`text-sm ${
                change > 0 ? "text-green-600" : "text-red-600"
              } flex items-center`}
            >
              <TrendingUp size={16} className="mr-1" />
              {change > 0 ? "+" : ""}
              {change}% dari bulan lalu
            </p>
          )}
        </div>
        <div
          className="p-3 rounded-full"
          style={{ backgroundColor: color + "20" }}
        >
          <Icon size={24} style={{ color: color }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-olive-900 to-olive-500 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Selamat Datang di Dashboard Penitip!
        </h1>
        <p className="text-blue-100">
          Kelola barang titipan Anda dan pantau penjualan dengan mudah
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Barang"
          value={dashboardData.totalBarang}
          icon={Package}
          color="#3B82F6"
          change={12}
        />
        <StatCard
          title="Barang Terjual"
          value={dashboardData.barangTerjual}
          icon={CheckCircle}
          color="#10B981"
          change={8}
        />
        <StatCard
          title="Pendapatan Bulan Ini"
          value={dashboardData.pendapatanBulanIni}
          icon={DollarSign}
          color="#F59E0B"
          change={15}
          isMonetary={true}
        />
        <StatCard
          title="Rata-rata Harga"
          value={dashboardData.rataRataPenjualan}
          icon={TrendingUp}
          color="#8B5CF6"
          change={5}
          isMonetary={true}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Trend Penjualan 7 Hari Terakhir
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  name === "pendapatan" ? formatCurrency(value) : value,
                  name === "penjualan" ? "Penjualan" : "Pendapatan",
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="penjualan"
                stroke="#3B82F6"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="pendapatan"
                stroke="#10B981"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribusi Kategori Barang
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Performance */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Performa Bulanan
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value, name) => [
                name === "pendapatan" ? formatCurrency(value) : value,
                name === "barang"
                  ? "Total Barang"
                  : name === "terjual"
                  ? "Barang Terjual"
                  : "Pendapatan",
              ]}
            />
            <Legend />
            <Bar dataKey="barang" fill="#3B82F6" name="Total Barang" />
            <Bar dataKey="terjual" fill="#10B981" name="Barang Terjual" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PenitipDashboardContent;
