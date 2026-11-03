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

const DashboardContentGudang = () => {
  const [pendingConsignments, setPendingConsignments] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [itemsInStock, setItemsInStock] = useState(0);
  const [retrievalRequests, setRetrievalRequests] = useState(0);
  const [consignmentData, setConsignmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGudang, setIsGudang] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!token) {
          throw new Error('Silakan login untuk mengakses dashboard.');
        }

        const [consignmentsResponse, ordersResponse, stockResponse, retrievalResponse] = await Promise.all([
          axios.get('http://localhost:8000/api/gudang/manage-transaksi-penitipan', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:8000/api/gudang/transaksi-penjualan', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:8000/api/gudang/barang-titipan', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:8000/api/gudang/barang-titipan', {
            headers: { Authorization: `Bearer ${token}` },
            params: { status: 'requested_retrieval' },
          }),
        ]);

        const consignments = consignmentsResponse.data.data || consignmentsResponse.data || [];
        const orders = ordersResponse.data.data || ordersResponse.data || [];
        const stock = stockResponse.data.data || stockResponse.data || [];
        const retrievals = retrievalResponse.data.data || retrievalResponse.data || [];

        setPendingConsignments(
          consignments.filter(c => c.status === 'pending').length
        );
        setPendingOrders(
          orders.filter(o => o.status === 'Menunggu Pembayaran' || o.status === 'Menunggu Verifikasi' || o.status === 'Sedang Dikemas').length
        );
        setCompletedOrders(
          orders.filter(o => o.status === 'Sudah Diterima' || o.status ==='Sudah Diambil').length
        );
        setItemsInStock(stock.length);
        setRetrievalRequests(
          retrievals.filter(r => r.status_pengambilan === 'requested').length
        );

        // Prepare consignment data for the last 7 days with robust date handling
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          return date.toISOString().split('T')[0];
        }).reverse();

        const dailyConsignments = last7Days.map(date => {
          return consignments.filter(c => {
            if (!c.tanggal_penitipan) return false;
            try {
              const consignmentDate = new Date(c.tanggal_penitipan);
              if (isNaN(consignmentDate.getTime())) return false;
              return consignmentDate.toISOString().split('T')[0] === date;
            } catch (e) {
              console.warn(`Invalid date format for tanggal_penitipan: ${c.tanggal_penitipan}`);
              return false;
            }
          }).length;
        });
        setConsignmentData(dailyConsignments);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching gudang dashboard data:', error);
        if (error.response && [401, 403].includes(error.response.status)) {
          setIsGudang(false);
        } else {
          setError(
            error.response?.data?.message ||
            'Gagal memuat data dashboard. Silakan coba lagi.'
          );
        }
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Memuat...</div>;
  }

  if (!isGudang) {
    return <DashboardContent />;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-lg shadow-md mx-auto mt-10 w-full max-w-4xl">
        {error}
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true, title: { display: false } },
    },
  };

  const consignmentChartData = {
    labels: ['-6', '-5', '-4', '-3', '-2', '-1', 'Hari Ini'],
    datasets: [
      {
        label: 'Transaksi Penitipan Harian',
        data: consignmentData,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const pendingConsignmentsChartData = {
    labels: ['Penitipan Tertunda'],
    datasets: [
      {
        label: 'Jumlah',
        data: [pendingConsignments],
        backgroundColor: 'rgba(234, 179, 8, 0.6)',
        borderColor: 'rgba(234, 179, 8, 1)',
        borderWidth: 1,
      },
    ],
  };

  const pendingOrdersChartData = {
    labels: ['Pesanan Tertunda'],
    datasets: [
      {
        label: 'Jumlah',
        data: [pendingOrders],
        backgroundColor: 'rgba(168, 85, 247, 0.6)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 1,
      },
    ],
  };

  const completedOrdersChartData = {
    labels: ['Pesanan Selesai'],
    datasets: [
      {
        label: 'Jumlah',
        data: [completedOrders],
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
    ],
  };

  const retrievalRequestsChartData = {
    labels: ['Permintaan Pengambilan'],
    datasets: [
      {
        label: 'Jumlah',
        data: [retrievalRequests],
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  };

  const itemsInStockChartData = {
    labels: ['Barang di Stok'],
    datasets: [
      {
        label: 'Jumlah',
        data: [itemsInStock],
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Dashboard Gudang</h1>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <StatCard
            title="Penitipan Tertunda"
            value={pendingConsignments}
            bgColor="bg-yellow-200"
          />
          <StatCard
            title="Pesanan Tertunda"
            value={pendingOrders}
            bgColor="bg-purple-200"
          />
          <StatCard
            title="Pesanan Selesai"
            value={completedOrders}
            bgColor="bg-green-200"
          />
          <StatCard
            title="Jumlah Barang di Stok"
            value={itemsInStock}
            bgColor="bg-blue-200"
          />
          <StatCard
            title="Permintaan Pengambilan"
            value={retrievalRequests}
            bgColor="bg-red-200"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-4">Transaksi Penitipan Harian</h2>
            <Bar data={consignmentChartData} options={chartOptions} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-4">Penitipan Tertunda</h2>
            <Bar data={pendingConsignmentsChartData} options={chartOptions} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-4">Pesanan Tertunda</h2>
            <Bar data={pendingOrdersChartData} options={chartOptions} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-4">Pesanan Selesai</h2>
            <Bar data={completedOrdersChartData} options={chartOptions} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-4">Permintaan Pengambilan</h2>
            <Bar data={retrievalRequestsChartData} options={chartOptions} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-4">Jumlah Barang di Stok</h2>
            <Bar data={itemsInStockChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContentGudang;