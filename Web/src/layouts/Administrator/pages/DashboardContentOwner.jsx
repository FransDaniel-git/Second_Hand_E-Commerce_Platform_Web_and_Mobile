// src/layouts/Administrator/pages/DashboardContentOwner.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from '../components/StatCard';
import DashboardContent from './DashboardContent';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DashboardContentOwner = () => {
  const [totalSales, setTotalSales] = useState(0);
  const [totalCommissions, setTotalCommissions] = useState(0);
  const [itemsInStock, setItemsInStock] = useState(0);
  const [unfulfilledRequests, setUnfulfilledRequests] = useState(0);
  const [expiredItems, setExpiredItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(true);
  const token = localStorage.getItem('token');
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }

        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;

        const [salesResponse, commissionsResponse, stockResponse, requestsResponse, expiredResponse] = await Promise.all([
          axios.get('http://localhost:8000/api/owner/penjualan-bulanan-keseluruhan', {
            headers: { Authorization: `Bearer ${token}` },
            params: { year }
          }),
          axios.get('http://localhost:8000/api/owner/komisi-bulanan', {
            headers: { Authorization: `Bearer ${token}` },
            params: { year, month }
          }),
          axios.get('http://localhost:8000/api/owner/stok-gudang', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:8000/api/owner/request-donasi-belum-terpenuhi', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:8000/api/owner/penitipan-sudah-habis', {
            headers: { Authorization: `Bearer ${token}` }
          }),
        ]);

        const salesData = salesResponse.data.data;
        const currentMonthSales = salesData.find(d => d.bulan === months[month - 1]);
        setTotalSales(currentMonthSales ? currentMonthSales.total_biaya : 0);

        const commissionsData = commissionsResponse.data.data;
        const totalCommissions = commissionsData.totals.komisi_penitip + commissionsData.totals.komisi_hunter + commissionsData.totals.komisi_reusemart;
        setTotalCommissions(totalCommissions);

        const stockData = stockResponse.data.data;
        setItemsInStock(stockData.pagination.total);

        const requestsData = requestsResponse.data.data;
        setUnfulfilledRequests(requestsData.data.length);

        const expiredData = expiredResponse.data.data;
        setExpiredItems(expiredData.data.length);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        if (error.response && [401, 403].includes(error.response.status)) {
          setIsOwner(false);
        } else {
          setError(error.response?.data?.message || 'Gagal memuat data dashboard');
        }
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Memuat...</div>;
  }

  if (!isOwner) {
    return <DashboardContent />;
  }

  if (error) {
    return <div className="bg-red-50 text-red-600 p-6 rounded-lg shadow-md mx-auto mt-10 w-full max-w-4xl">{error}</div>;
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, font: { size: 16 } },
    },
    scales: {
      y: { beginAtZero: true, title: { display: false } },
    },
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Dashboard Pemilik</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Penjualan and Komisi Chart and Cards */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Bar
              data={{
                labels: ['Total Penjualan', 'Total Komisi'],
                datasets: [{
                  label: 'Jumlah (Rp)',
                  data: [totalSales, totalCommissions],
                  backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(59, 130, 246, 0.6)'],
                  borderColor: ['rgba(34, 197, 94, 1)', 'rgba(59, 130, 246, 1)'],
                  borderWidth: 1,
                }],
              }}
              options={{ ...chartOptions, plugins: { title: { text: 'Penjualan dan Komisi Bulan Ini' } } }}
            />
          </div>
          <div className="grid grid-cols-1 gap-6">
            <StatCard title="Total Penjualan Bulan Ini" value={`Rp ${totalSales.toLocaleString()}`} bgColor="bg-green-200" />
            <StatCard title="Total Komisi Bulan Ini" value={`Rp ${totalCommissions.toLocaleString()}`} bgColor="bg-blue-200" />
          </div>

          {/* Stok, Donasi, and Kadaluarsa Chart and Cards */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Bar
              data={{
                labels: ['Jumlah Stok', 'Donasi Belum Terpenuhi', 'Barang Kadaluarsa'],
                datasets: [{
                  label: 'Jumlah',
                  data: [itemsInStock, unfulfilledRequests, expiredItems],
                  backgroundColor: ['rgba(234, 179, 8, 0.6)', 'rgba(168, 85, 247, 0.6)', 'rgba(239, 68, 68, 0.6)'],
                  borderColor: ['rgba(234, 179, 8, 1)', 'rgba(168, 85, 247, 1)', 'rgba(239, 68, 68, 1)'],
                  borderWidth: 1,
                }],
              }}
              options={{ ...chartOptions, plugins: { title: { text: 'Stok, Donasi, dan Kadaluarsa' } } }}
            />
          </div>
          <div className="grid grid-cols-1 gap-6">
            <StatCard title="Jumlah Barang di Stok" value={itemsInStock} bgColor="bg-yellow-200" />
            <StatCard title="Permintaan Donasi Belum Terpenuhi" value={unfulfilledRequests} bgColor="bg-purple-200" />
            <StatCard title="Barang Titipan Kadaluarsa" value={expiredItems} bgColor="bg-red-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContentOwner;