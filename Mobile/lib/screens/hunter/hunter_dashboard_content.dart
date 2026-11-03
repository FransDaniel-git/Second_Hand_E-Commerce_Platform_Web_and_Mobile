import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:shimmer/shimmer.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../services/auth_service.dart';
import 'hunter_commission_detail.dart';
import '../../models/comission.dart';

class DashboardContent extends StatefulWidget {
  const DashboardContent({super.key});

  @override
  _DashboardContentState createState() => _DashboardContentState();
}

class _DashboardContentState extends State<DashboardContent> {
  bool _isLoading = true;
  Map<String, dynamic>? _dashboardData;
  String? _errorMessage;
  final AuthService _authService = AuthService();
  List<dynamic> _hauntedItems = [];
  List<dynamic> _filteredItems = [];
  final TextEditingController _searchController = TextEditingController();
  String _selectedStatus = 'All';
  final List<String> _statusFilters = [
    'All',
    'Tersedia',
    'Terjual',
    'Didonasikan',
    'Dikembalikan',
    'Kadaluarsa',
    'Siap Diambil Kembali',
    'Hangus'
  ];

  List<dynamic> _commissionList = [];

  // Color Constants
  final Color oliveGreen = const Color(0xFF7A7C52);
  final Color darkGreen = const Color(0xFF5A5D3A);

  @override
  void initState() {
    super.initState();
    _fetchDashboardData();
    _searchController.addListener(_filterItems);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchDashboardData({String? search, String? status}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = await _authService.getToken();
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
            !profileData['user']['role'].contains('hunter')) {
          if (mounted) {
            setState(() {
              _errorMessage = 'Akses hanya untuk Hunter.';
              _isLoading = false;
            });
          }
          return;
        }

        // Fetch data komisi
        final commissionResponse = await http.get(
          Uri.parse('http://10.0.2.2:8000/api/hunter/komisi'),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        );

        int totalCommission = 0;
        List<dynamic> commissionList = [];

        if (commissionResponse.statusCode == 200) {
          commissionList = jsonDecode(commissionResponse.body) as List;
          _commissionList = commissionList;
          totalCommission = commissionList.fold(
              0, (sum, item) => sum + ((item['KOMISI_HUNTER'] ?? 0) as int));
        } else {
          final errorData = jsonDecode(commissionResponse.body);
          if (mounted) {
            setState(() {
              _errorMessage =
                  'Gagal memuat komisi: ${errorData['message'] ?? commissionResponse.statusCode}';
              _isLoading = false;
            });
          }
          return;
        }

        // Build query parameters
        final queryParams = <String, String>{};
        if (search != null && search.isNotEmpty) {
          queryParams['search'] = search;
        }
        if (status != null && status != 'All') {
          queryParams['status'] = status;
        }

        final itemsResponse = await http.get(
          Uri.parse('http://10.0.2.2:8000/api/hunter/barang-titipan')
              .replace(queryParameters: queryParams),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        );

        int totalItemsHunted = 0;
        List<dynamic> hauntedItems = [];

        if (itemsResponse.statusCode == 200) {
          final items = jsonDecode(itemsResponse.body)['data'] as List;
          hauntedItems = items.map((item) {
            var commissionData = commissionList.firstWhere(
              (comm) => comm['KODE_PRODUK'] == item['KODE_PRODUK'],
              orElse: () => null,
            );

            String productImage;
            if (item['product_image'] != null &&
                item['product_image'].toString().isNotEmpty &&
                item['product_image'].toString() != '/api/placeholder/60/60' &&
                item['product_image'].toString() !=
                    'http://10.0.2.2:8000/api/placeholder/60/60') {
              productImage =
                  'http://10.0.2.2:8000/api/products/${item['KODE_PRODUK']}/thumbnail';
            } else {
              productImage = 'http://10.0.2.2:8000/api/placeholder/60/60';
            }

            return {
              'KODE_PRODUK': item['KODE_PRODUK'] ?? 'Unknown ID',
              'product_name': item['product_name'] ?? 'Unknown Product',
              'penitip_name': item['penitip_name'] ?? 'Unknown Penitip',
              'consignment_date': item['consignment_date'] ?? 'Unknown Date',
              'status': item['status'] ?? 'Pending',
              'product_image': productImage,
              'has_commission': commissionData != null,
              'commission_data': commissionData,
              'selling_price': item['selling_price'] ?? 0,
              'transaction_date':
                  item['transaction_date'] ?? item['consignment_date'],
            };
          }).toList();
          totalItemsHunted = hauntedItems.length;
        } else {
          final errorData = jsonDecode(itemsResponse.body);
          if (mounted) {
            setState(() {
              _errorMessage =
                  'Gagal memuat barang titipan: ${errorData['message'] ?? itemsResponse.statusCode}';
              _isLoading = false;
            });
          }
          return;
        }

        if (mounted) {
          setState(() {
            _dashboardData = {
              'total_items_hunted': totalItemsHunted,
              'total_commission': totalCommission,
              'name': profileData['user']['nama'],
            };
            _hauntedItems = hauntedItems;
            _filteredItems = hauntedItems;
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
        final errorData = jsonDecode(profileResponse.body);
        if (mounted) {
          setState(() {
            _errorMessage =
                'Gagal memuat profil: ${errorData['message'] ?? profileResponse.statusCode}';
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal memuat data: $e')),
        );
      }
    }
  }

  void _filterItems() {
    final query = _searchController.text;
    final status = _selectedStatus;
    _fetchDashboardData(search: query, status: status);
  }

  Map<String, dynamic>? _getCommissionData(String kodeProduk) {
    try {
      return _commissionList.firstWhere(
        (comm) => comm['KODE_PRODUK'] == kodeProduk,
        orElse: () => null,
      );
    } catch (e) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: RefreshIndicator(
        onRefresh: () => _fetchDashboardData(),
        color: oliveGreen,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // 1. App Bar
            _buildSliverAppBar(size),

            // 2. Konten Utama
            if (_isLoading)
              SliverFillRemaining(child: _buildLoadingShimmer(size))
            else if (_errorMessage != null)
              SliverFillRemaining(child: _buildErrorState(size))
            else ...[
              // 3. Welcome Section
              SliverToBoxAdapter(child: _buildWelcomeSection(size)),

              // 4. Stats Grid (Using SliverGrid for better performance)
              SliverPadding(
                padding: EdgeInsets.symmetric(horizontal: size.width * 0.04),
                sliver: _buildStatsGrid(size),
              ),

              // 5. Search & Filter
              SliverToBoxAdapter(child: _buildSearchAndFilter(size)),

              // 6. Title Section
              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(
                      size.width * 0.04,
                      size.height * 0.02,
                      size.width * 0.04,
                      size.height * 0.015),
                  child: Row(
                    children: [
                      Icon(Icons.inventory_2_outlined, color: oliveGreen),
                      const SizedBox(width: 8),
                      Text(
                        'Barang Titipan',
                        style: TextStyle(
                          fontSize: size.width * 0.045,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '${_filteredItems.length} barang',
                        style: const TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              ),

              // 7. Items List (Using SliverList)
              _filteredItems.isEmpty
                  ? SliverToBoxAdapter(child: _buildEmptyHauntedItems(size))
                  : SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final item = _filteredItems[index];
                          return FadeInUp(
                            duration:
                                Duration(milliseconds: 400 + (index * 100)),
                            child: _buildHauntedItemCard(item, size),
                          );
                        },
                        childCount: _filteredItems.length,
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

  // --- WIDGET BUILDERS ---

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
          'Hunter Dashboard',
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
                    'Kelola barang titipan dan komisi Anda.',
                    style: TextStyle(
                        color: Colors.white70, fontSize: size.width * 0.035),
                  ),
                ],
              ),
            ),
            // MODIFIKASI: Ikon diganti ke yang lebih relevan dengan "Hunting"
            const CircleAvatar(
              backgroundColor: Colors.white24,
              radius: 24,
              child: Icon(Icons.hiking, color: Colors.white),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildStatsGrid(Size size) {
    final stats = [
      {
        'title': 'Items Hunted',
        'value': _dashboardData!['total_items_hunted'],
        'icon': Icons.inventory_2,
        'color': Colors.blueAccent,
        'bg': Colors.blue.withOpacity(0.1)
      },
      {
        'title': 'Total Komisi',
        'value':
            'Rp ${NumberFormat("#,##0", "id_ID").format(_dashboardData!['total_commission'])}',
        'icon': Icons.monetization_on,
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
                  ],
                ),
                const Spacer(),
                Text(
                  item['value'].toString(),
                  style: TextStyle(
                    fontSize:
                        index == 1 ? 16 : 24, // Smaller font for long currency
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  item['title'] as String,
                  style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 12,
                      fontWeight: FontWeight.w500),
                ),
              ],
            ),
          );
        },
        childCount: stats.length,
      ),
    );
  }

  Widget _buildSearchAndFilter(Size size) {
    return Padding(
      padding: EdgeInsets.symmetric(
          horizontal: size.width * 0.04, vertical: size.height * 0.02),
      child: Row(
        children: [
          // MODIFIKASI: Menggunakan Expanded dengan flex lebih besar untuk Search
          Expanded(
            flex: 3, // Search bar mengambil 75% lebar row
            child: Container(
              height: 50,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: const [
                  BoxShadow(
                      color: Colors.black12,
                      blurRadius: 5,
                      offset: Offset(0, 2))
                ],
              ),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Cari barang...',
                  hintStyle: TextStyle(color: Colors.grey[400]),
                  prefixIcon: Icon(Icons.search, color: Colors.grey[400]),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 15),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // MODIFIKASI: Filter box lebih kecil
          Expanded(
            flex: 1, // Filter hanya mengambil 25%
            child: Container(
              height: 50,
              padding: const EdgeInsets.symmetric(
                  horizontal: 4), // Padding diperkecil
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: const [
                  BoxShadow(
                      color: Colors.black12,
                      blurRadius: 5,
                      offset: Offset(0, 2))
                ],
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedStatus,
                  icon: Icon(Icons.filter_list, color: oliveGreen, size: 20),
                  isExpanded: true, // Agar muat di container kecil
                  borderRadius: BorderRadius.circular(12),
                  items: _statusFilters.map((String status) {
                    return DropdownMenuItem<String>(
                      value: status,
                      child: Text(
                        status == 'All'
                            ? 'Semua'
                            : status, // Singkat teks 'All'
                        style: TextStyle(fontSize: 13, color: Colors.black87),
                        overflow: TextOverflow.ellipsis,
                      ),
                    );
                  }).toList(),
                  onChanged: (String? newValue) {
                    setState(() {
                      _selectedStatus = newValue!;
                      _filterItems();
                    });
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHauntedItemCard(Map<String, dynamic> item, Size size) {
    final commissionData =
        item['commission_data'] ?? _getCommissionData(item['KODE_PRODUK']);

    Color getStatusColor() {
      switch (item['status']) {
        case 'Tersedia':
          return Colors.green;
        case 'Terjual':
          return Colors.blue;
        case 'Didonasikan':
          return Colors.orange;
        case 'Dikembalikan':
          return Colors.red;
        case 'Kadaluarsa':
          return Colors.grey;
        case 'Siap Diambil Kembali':
          return Colors.purple;
        case 'Hangus':
          return Colors.black54;
        default:
          return Colors.grey;
      }
    }

    String formatDate(String date) {
      if (date == 'Unknown Date' || date == '-') return 'N/A';
      try {
        final parsedDate = DateTime.parse(date);
        final formatter = DateFormat('d MMM y', 'id_ID');
        return formatter.format(parsedDate);
      } catch (e) {
        return date;
      }
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
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: CachedNetworkImage(
                    imageUrl: item['product_image'],
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                        width: 80, height: 80, color: Colors.grey[200]),
                    errorWidget: (context, url, error) => Container(
                        width: 80,
                        height: 80,
                        color: Colors.grey[200],
                        child: const Icon(Icons.image_not_supported)),
                  ),
                ),
                const SizedBox(width: 12),
                // Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item['product_name'],
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 16),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Penitip: ${item['penitip_name']}',
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: getStatusColor().withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              item['status'],
                              style: TextStyle(
                                  color: getStatusColor(),
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold),
                            ),
                          ),
                          if (item['status'] == 'Terjual' &&
                              item['transaction_date'] != null) ...[
                            const SizedBox(width: 8),
                            Text(
                              formatDate(item['transaction_date']),
                              style: const TextStyle(
                                  fontSize: 10, color: Colors.grey),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 8),
            // Bottom Section (Code & Action)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Kode',
                        style: TextStyle(fontSize: 10, color: Colors.grey)),
                    Text(item['KODE_PRODUK'],
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 12)),
                  ],
                ),
                ElevatedButton(
                  onPressed: () {
                    final dataToUse = commissionData ?? item;
                    String imagePath = item['product_image'];

                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => CommissionDetailScreen(
                          commission: Commission(
                            commissionId:
                                dataToUse['KODE_PRODUK'] ?? item['KODE_PRODUK'],
                            productName: dataToUse['product_name'] ??
                                item['product_name'],
                            penitipName: dataToUse['penitip_name'] ??
                                item['penitip_name'],
                            amount: (dataToUse['KOMISI_HUNTER'] ?? 0) as int,
                            date: dataToUse['commission_date'] ??
                                dataToUse['consignment_date'] ??
                                item['consignment_date'],
                            status: item['status'],
                            imagePath: imagePath,
                            transactionDate: dataToUse['transaction_date'] ??
                                item['transaction_date'] ??
                                item['consignment_date'],
                            consignmentDate: dataToUse['consignment_date'] ??
                                item['consignment_date'],
                            sellingPrice: (dataToUse['selling_price'] ??
                                item['selling_price'] ??
                                0) as int,
                          ),
                        ),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: oliveGreen,
                    side: BorderSide(color: oliveGreen),
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    minimumSize: const Size(0, 36),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text(
                    item['status'] == 'Terjual' && commissionData != null
                        ? 'Detail Komisi'
                        : 'Detail',
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyHauntedItems(Size size) {
    return Container(
      height: size.height * 0.3,
      alignment: Alignment.center,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 60, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'Tidak ada barang ditemukan',
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
                  height: 120,
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
            onPressed: () => _fetchDashboardData(),
            child: Text('Coba Lagi', style: TextStyle(color: oliveGreen)),
          )
        ],
      ),
    );
  }
}
