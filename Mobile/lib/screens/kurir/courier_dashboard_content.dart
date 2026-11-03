import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:animate_do/animate_do.dart';
import 'package:shimmer/shimmer.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../services/auth_service.dart';
import '../kurir/courier_delivery_detail.dart';

class CourierDashboardContent extends StatefulWidget {
  const CourierDashboardContent({super.key});

  @override
  _CourierDashboardContentState createState() =>
      _CourierDashboardContentState();
}

class _CourierDashboardContentState extends State<CourierDashboardContent> {
  bool _isLoading = true;
  Map<String, dynamic>? _dashboardData;
  String? _errorMessage;
  List<Map<String, dynamic>> _deliveryTasks = [];
  // ignore: unused_field
  final AuthService _authService = AuthService();

  // Color Constants
  final Color oliveGreen = const Color(0xFF7A7C52);
  final Color darkGreen = const Color(0xFF5A5D3A);

  @override
  void initState() {
    super.initState();
    _fetchDashboardData();
  }

  Future<void> _fetchDashboardData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token == null) {
        if (mounted) {
          setState(() {
            _errorMessage = 'Token tidak ditemukan. Silakan login kembali.';
            _isLoading = false;
          });
          Navigator.pushReplacementNamed(context, '/login');
        }
        return;
      }

      final profileResponse = await http.get(
        Uri.parse('http://10.0.2.2:8000/api/auth/profile'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (profileResponse.statusCode == 200) {
        final profileData = jsonDecode(profileResponse.body);
        if (profileData['user_type'] != 'pegawai' ||
            !profileData['user']['role'].contains('kurir')) {
          if (mounted) {
            setState(() {
              _errorMessage = 'Akses hanya untuk kurir.';
              _isLoading = false;
            });
          }
          return;
        }

        final transactionsResponse = await http.get(
          Uri.parse('http://10.0.2.2:8000/api/kurir/transaksi-penjualan'),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        );

        int totalDeliveries = 0;
        int completedDeliveries = 0;
        List<Map<String, dynamic>> activeDeliveries = [];

        if (transactionsResponse.statusCode == 200) {
          final transactions = jsonDecode(transactionsResponse.body)['data'];
          totalDeliveries = transactions.length;
          completedDeliveries =
              transactions.where((t) => t['status'] == 'Sudah Diterima').length;

          for (var transaction in transactions) {
            if (['Siap Dikirim', 'Sedang Dikirim']
                .contains(transaction['status'])) {
              final detailResponse = await http.get(
                Uri.parse(
                    'http://10.0.2.2:8000/api/kurir/transaksi-penjualan/${transaction['no_nota']}'),
                headers: {
                  'Authorization': 'Bearer $token',
                  'Content-Type': 'application/json',
                },
              );

              if (detailResponse.statusCode == 200) {
                final detailData = jsonDecode(detailResponse.body)['data'];
                final products = detailData['products'] as List<dynamic>? ?? [];
                final items = products.map((p) {
                  final imageUrl = p['image'] != '/api/placeholder/60/60'
                      ? 'http://10.0.2.2:8000/api/products/${p['product_id']}/thumbnail'
                      : 'http://10.0.2.2:8000/api/placeholder/60/60';
                  return {
                    'name': p['nama_barang'] as String? ?? 'Unknown Item',
                    'price': p['harga_barang'] as String? ?? 'Rp0',
                    'image': imageUrl,
                    'product_id': p['product_id'] as String? ?? '',
                  };
                }).toList();

                activeDeliveries.add({
                  'id_penjualan': transaction['id_penjualan'],
                  'order_id': transaction['no_nota'] ?? 'Unknown ID',
                  'customer_name':
                      detailData['nama_pembeli'] ?? 'Unknown Buyer',
                  'address': detailData['alamat'] ?? 'Unknown Address',
                  'status': transaction['status'] ?? 'Unknown',
                  'date': transaction['tanggal_transaksi'] ?? 'Unknown Date',
                  'items': items,
                });
              }
            }
          }
        } else {
          if (mounted) {
            setState(() {
              _errorMessage =
                  'Gagal memuat data transaksi: ${transactionsResponse.statusCode}';
              _isLoading = false;
            });
          }
          return;
        }

        if (mounted) {
          setState(() {
            _dashboardData = {
              'name': profileData['user']['nama'],
              'total_deliveries': totalDeliveries,
              'completed_deliveries': completedDeliveries,
            };
            _deliveryTasks = activeDeliveries;
            _isLoading = false;
          });
        }
      } else if (profileResponse.statusCode == 401) {
        await prefs.remove('token');
        if (mounted) {
          setState(() {
            _errorMessage = 'Sesi telah berakhir. Silakan login kembali.';
            _isLoading = false;
          });
          Navigator.pushReplacementNamed(context, '/login');
        }
      } else {
        if (mounted) {
          setState(() {
            _errorMessage =
                'Gagal memuat profil: ${profileResponse.statusCode}';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Error: Koneksi gagal. Silakan coba lagi.';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _updateStatus(int index) async {
    final task = _deliveryTasks[index];
    String? newStatus;
    String confirmationMessage;
    String actionText;

    if (task['status'] == 'Siap Dikirim') {
      newStatus = 'Sedang Dikirim';
      confirmationMessage = 'Mulai pengiriman pesanan ini?';
      actionText = 'Mulai Kirim';
    } else if (task['status'] == 'Sedang Dikirim') {
      newStatus = 'Sudah Diterima';
      confirmationMessage = 'Pesanan sudah diterima pelanggan?';
      actionText = 'Selesaikan';
    } else {
      return;
    }

    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
          title: Text('Konfirmasi', style: TextStyle(color: oliveGreen)),
          content: Text(confirmationMessage),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Batal', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: oliveGreen,
                foregroundColor: Colors.white,
              ),
              onPressed: () => Navigator.pop(context, true),
              child: Text(actionText),
            ),
          ],
        );
      },
    );

    if (confirm == true && mounted) {
      try {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('token');
        if (token == null) {
          Navigator.pushReplacementNamed(context, '/login');
          return;
        }

        final response = await http.put(
          Uri.parse(
              'http://10.0.2.2:8000/api/kurir/transaksi-penjualan/${task['id_penjualan']}'),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
          body: jsonEncode({'STATUS': newStatus}),
        );

        if (response.statusCode == 200) {
          setState(() {
            if (newStatus == 'Sudah Diterima') {
              _deliveryTasks.removeAt(index);
              _dashboardData!['completed_deliveries']++;
            } else {
              _deliveryTasks[index]['status'] = newStatus;
            }
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Status berhasil diperbarui'),
                backgroundColor: Colors.green),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Gagal memperbarui status'),
                backgroundColor: Colors.red),
          );
        }
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  // --- UI IMPLEMENTATION ---

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: RefreshIndicator(
        onRefresh: _fetchDashboardData,
        color: oliveGreen,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // 1. App Bar with Gradient
            _buildSliverAppBar(size),

            // 2. Content Logic (Loading, Error, Data)
            if (_isLoading)
              SliverFillRemaining(child: _buildLoadingShimmer(size))
            else if (_errorMessage != null)
              SliverFillRemaining(child: _buildErrorState(size))
            else ...[
              // 3. Welcome Banner
              SliverToBoxAdapter(child: _buildWelcomeSection(size)),

              // 4. Statistics Grid
              SliverPadding(
                padding: EdgeInsets.symmetric(horizontal: size.width * 0.04),
                sliver: _buildStatsGrid(size),
              ),

              // 5. Delivery List Header
              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(
                      size.width * 0.04,
                      size.height * 0.03,
                      size.width * 0.04,
                      size.height * 0.015),
                  child: Row(
                    children: [
                      Icon(Icons.local_shipping_outlined, color: oliveGreen),
                      const SizedBox(width: 8),
                      Text(
                        'Daftar Pengiriman',
                        style: TextStyle(
                          fontSize: size.width * 0.045,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      const Spacer(),
                      Text('${_deliveryTasks.length} tugas',
                          style: const TextStyle(color: Colors.grey)),
                    ],
                  ),
                ),
              ),

              // 6. Delivery List
              _deliveryTasks.isEmpty
                  ? SliverToBoxAdapter(child: _buildEmptyTasks(size))
                  : SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final task = _deliveryTasks[index];
                          return FadeInUp(
                            duration:
                                Duration(milliseconds: 400 + (index * 100)),
                            child: _buildDeliveryTaskCard(task, index, size),
                          );
                        },
                        childCount: _deliveryTasks.length,
                      ),
                    ),

              // Bottom Spacer
              SliverToBoxAdapter(child: SizedBox(height: size.height * 0.1)),
            ],
          ],
        ),
      ),
    );
  }

  // --- WIDGET COMPONENTS ---

  Widget _buildSliverAppBar(Size size) {
    return SliverAppBar(
      pinned: true,
      floating: false,
      expandedHeight: size.height * 0.12,
      backgroundColor: oliveGreen,
      elevation: 0,
      flexibleSpace: FlexibleSpaceBar(
        titlePadding: EdgeInsets.only(left: size.width * 0.04, bottom: 16),
        title: Text(
          'Courier Dashboard',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: size.width * 0.045,
          ),
        ),
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [oliveGreen, darkGreen],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Stack(
            children: [
              Positioned(
                right: -30,
                top: -30,
                child: CircleAvatar(
                  radius: 60,
                  backgroundColor: Colors.white.withOpacity(0.1),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWelcomeSection(Size size) {
    return Padding(
      padding: EdgeInsets.all(size.width * 0.04),
      child: Container(
        padding: EdgeInsets.all(size.width * 0.05),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF4A4D3A), Color(0xFF7A7C52)],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: oliveGreen.withOpacity(0.4),
              blurRadius: 10,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Halo, ${_dashboardData!['name']}!',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: size.width * 0.05,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Semangat mengantar paket hari ini!',
                    style: TextStyle(
                        color: Colors.white70, fontSize: size.width * 0.035),
                  ),
                ],
              ),
            ),
            const CircleAvatar(
              backgroundColor: Colors.white24,
              radius: 24,
              child: Icon(Icons.emoji_people, color: Colors.white),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildStatsGrid(Size size) {
    final stats = [
      {
        'title': 'Total Tugas',
        'value': _dashboardData!['total_deliveries'],
        'icon': Icons.inventory_2,
        'color': Colors.blueAccent,
        'bg': Colors.blue.withOpacity(0.1)
      },
      {
        'title': 'Selesai',
        'value': _dashboardData!['completed_deliveries'],
        'icon': Icons.check_circle_outline,
        'color': Colors.green,
        'bg': Colors.green.withOpacity(0.1)
      },
    ];

    return SliverGrid(
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1.5,
        crossAxisSpacing: size.width * 0.04,
        mainAxisSpacing: size.width * 0.04,
      ),
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          final item = stats[index];
          return Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: const [
                BoxShadow(
                    color: Colors.black12, blurRadius: 5, offset: Offset(0, 2))
              ],
            ),
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: item['bg'] as Color,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(item['icon'] as IconData,
                          color: item['color'] as Color, size: 20),
                    ),
                    const Spacer(),
                    Text(
                      item['value'].toString(),
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                Text(
                  item['title'] as String,
                  style: TextStyle(
                      color: Colors.grey[600], fontWeight: FontWeight.w500),
                ),
              ],
            ),
          );
        },
        childCount: stats.length,
      ),
    );
  }

  Widget _buildDeliveryTaskCard(
      Map<String, dynamic> task, int index, Size size) {
    Color statusColor;
    String statusText;

    if (task['status'] == 'Siap Dikirim') {
      statusColor = Colors.orange;
      statusText = 'Siap Kirim';
    } else {
      statusColor = Colors.blue;
      statusText = 'Sedang Jalan';
    }

    return Container(
      margin: EdgeInsets.symmetric(horizontal: size.width * 0.04, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4))
        ],
      ),
      child: Column(
        children: [
          // Header Card
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(16)),
              border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
            ),
            child: Row(
              children: [
                Icon(Icons.receipt_long, size: 18, color: Colors.grey[600]),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${task['order_id']}',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, color: Colors.black87),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    statusText,
                    style: TextStyle(
                        color: statusColor,
                        fontSize: 12,
                        fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),

          // Body Card
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      backgroundColor: oliveGreen.withOpacity(0.1),
                      child: Text(
                        task['customer_name'][0].toUpperCase(),
                        style: TextStyle(
                            color: oliveGreen, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            task['customer_name'],
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            task['address'],
                            style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 13,
                                height: 1.3),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(height: 1),
                const SizedBox(height: 12),

                // Action Buttons
                Row(
                  children: [
                    // Tombol Detail
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => CourierDeliveryDetailScreen(
                                delivery: task,
                                onStatusUpdated: _fetchDashboardData,
                              ),
                            ),
                          );
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.grey[800],
                          side: BorderSide(color: Colors.grey[300]!),
                          // FIX: Menetapkan tinggi minimum
                          minimumSize: const Size(double.infinity, 45),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Detail'),
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Tombol Aksi (Kirim/Selesai)
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _updateStatus(index),
                        // FIX: Ikon diganti ke truk
                        icon: Icon(
                          task['status'] == 'Siap Dikirim'
                              ? Icons.local_shipping
                              : Icons.check_circle_outline,
                          size: 18,
                        ),
                        label: Text(
                          task['status'] == 'Siap Dikirim'
                              ? 'Kirim'
                              : 'Selesai',
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: oliveGreen,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          // FIX: Menetapkan tinggi minimum
                          minimumSize: const Size(double.infinity, 45),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyTasks(Size size) {
    return Container(
      height: size.height * 0.3,
      alignment: Alignment.center,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inventory, size: 60, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'Tidak ada pengiriman aktif',
            style: TextStyle(color: Colors.grey[500], fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingShimmer(Size size) {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Container(
                height: 100,
                decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16))),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                    child: Container(
                        height: 80,
                        decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16)))),
                const SizedBox(width: 16),
                Expanded(
                    child: Container(
                        height: 80,
                        decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16)))),
              ],
            ),
            const SizedBox(height: 24),
            Expanded(
              child: ListView.builder(
                itemCount: 3,
                itemBuilder: (_, __) => Container(
                  height: 140,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16)),
                ),
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(Size size) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 60, color: Colors.red[300]),
          const SizedBox(height: 16),
          const Text('Terjadi Kesalahan',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 8),
            child: Text(
              _errorMessage ?? 'Unknown error',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey),
            ),
          ),
          TextButton(
            onPressed: _fetchDashboardData,
            child: Text('Coba Lagi', style: TextStyle(color: oliveGreen)),
          )
        ],
      ),
    );
  }
}
