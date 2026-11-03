import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:animate_do/animate_do.dart';
import 'package:shimmer/shimmer.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../services/auth_service.dart';
import 'courier_delivery_detail.dart';
import '../otentikasi/login.dart';

String _formatDate(String date) {
  try {
    final parsedDate = DateTime.parse(date);
    final wibDate = parsedDate.add(const Duration(hours: 7));
    final formatter = DateFormat('d MMMM y HH:mm', 'id_ID');
    return formatter.format(wibDate);
  } catch (e) {
    return date;
  }
}

class DeliveryHistoryScreen extends StatefulWidget {
  const DeliveryHistoryScreen({super.key});

  @override
  _DeliveryHistoryScreenState createState() => _DeliveryHistoryScreenState();
}

class _DeliveryHistoryScreenState extends State<DeliveryHistoryScreen>
    with TickerProviderStateMixin {
  bool _isLoading = true;
  String? _errorMessage;
  late AnimationController _fadeController;
  late AnimationController _slideController;
  List<Map<String, dynamic>> _deliveries = [];
  bool _isSortAscending =
      false; // DIUBAH: dari true ke false (terbaru ke terlama)

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _slideController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _fadeController.forward();
    _slideController.forward();

    _fetchDeliveries();
  }

  Future<void> _fetchDeliveries() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token == null) {
        if (mounted) {
          setState(() {
            _errorMessage = 'Token tidak ditemukan. Silakan login kembali.';
            _isLoading = false;
          });
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => const LoginScreen()),
            );
          });
        }
        return;
      }

      final response = await http.get(
        Uri.parse('http://10.0.2.2:8000/api/kurir/transaksi-penjualan'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['data'] ?? [];

        final List<Map<String, dynamic>> fetchedDeliveries = [];
        for (var transaction in data) {
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
              print(
                  'Image URL for ${p['nama_barang']}: $imageUrl'); // Debug log
              return {
                'name': p['nama_barang'] as String? ?? 'Unknown Item',
                'price': p['harga_barang'] as String? ?? 'Rp0',
                'image': imageUrl,
                'product_id': p['product_id'] as String? ?? '',
              };
            }).toList();

            fetchedDeliveries.add({
              'id_penjualan': transaction['id_penjualan'],
              'order_id': transaction['no_nota'] as String? ?? 'Unknown ID',
              'customer_name':
                  detailData['nama_pembeli'] as String? ?? 'Unknown Buyer',
              'address': detailData['alamat'] as String? ?? 'Unknown Address',
              'status': transaction['status'] as String? ?? 'Unknown',
              'date':
                  transaction['tanggal_transaksi'] as String? ?? 'Unknown Date',
              'tanggal_siap': transaction['tanggal_siap'] as String?,
              'items': items,
            });
          } else {
            print(
                'Failed to fetch details for ${transaction['no_nota']}: ${detailResponse.statusCode}');
          }
        }

        if (mounted) {
          setState(() {
            _deliveries = fetchedDeliveries;
            _sortDeliveries();
            _isLoading = false;
          });
        }
      } else if (response.statusCode == 401) {
        await prefs.remove('token');
        if (mounted) {
          setState(() {
            _errorMessage = 'Sesi telah berakhir. Silakan login kembali.';
            _isLoading = false;
          });
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => const LoginScreen()),
            );
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _errorMessage =
                'Gagal memuat riwayat pengiriman: ${response.statusCode}';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Error mengambil riwayat pengiriman: $e';
          _isLoading = false;
        });
      }
    }
  }

  void _sortDeliveries() {
    setState(() {
      _deliveries.sort((a, b) {
        try {
          // Pakai tanggal_siap, fallback ke tanggal_pesanan jika null
          final dateA = a['tanggal_siap'] != null && a['tanggal_siap'] != ''
              ? DateTime.parse(a['tanggal_siap'])
              : DateTime.parse(a['date']);
          final dateB = b['tanggal_siap'] != null && b['tanggal_siap'] != ''
              ? DateTime.parse(b['tanggal_siap'])
              : DateTime.parse(b['date']);
          // DIUBAH: _isSortAscending = false → dateB.compareTo(dateA) = descending (terbaru ke terlama)
          return _isSortAscending
              ? dateA.compareTo(dateB) // Ascending: terlama → terbaru
              : dateB.compareTo(dateA); // Descending: terbaru → terlama
        } catch (e) {
          return 0;
        }
      });
    });
  }

  void _showSortDialog() {
    final size = MediaQuery.sizeOf(context);
    showModalBottomSheet(
      context: context,
      shape: RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(size.width * 0.05)),
      ),
      builder: (context) {
        return Container(
          padding: EdgeInsets.all(size.width * 0.04),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Sort Pengiriman',
                style: TextStyle(
                  fontSize: size.width * 0.045,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF7A7C52),
                ),
              ),
              SizedBox(height: size.height * 0.02),
              ListTile(
                leading: Icon(
                  Icons.calendar_today,
                  color: const Color(0xFF1A3C34),
                  size: size.width * 0.05,
                ),
                title: Text(
                  'Sort by Date: Oldest to Newest',
                  style: TextStyle(fontSize: size.width * 0.035),
                ),
                onTap: () {
                  if (mounted) {
                    setState(() {
                      _isSortAscending = true;
                      _sortDeliveries();
                    });
                  }
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: Icon(
                  Icons.calendar_today,
                  color: const Color(0xFF1A3C34),
                  size: size.width * 0.05,
                ),
                title: Text(
                  'Sort by Date: Newest to Oldest',
                  style: TextStyle(fontSize: size.width * 0.035),
                ),
                onTap: () {
                  if (mounted) {
                    setState(() {
                      _isSortAscending = false;
                      _sortDeliveries();
                    });
                  }
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _slideController.dispose();
    super.dispose();
  }

  String _getDisplayText(double availableWidth, double screenWidth) {
    return availableWidth < screenWidth * 0.6
        ? 'Riwayat\nPengiriman'
        : 'Riwayat Pengiriman';
  }

  double _getFontSize(double availableWidth, double screenWidth) {
    return availableWidth < screenWidth * 0.6
        ? screenWidth * 0.045
        : screenWidth * 0.05;
  }

  Widget _buildDeliveryList() {
    final size = MediaQuery.of(context).size;
    return FadeTransition(
      opacity: _fadeController,
      child: SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0, 0.3),
          end: Offset.zero,
        ).animate(CurvedAnimation(
          parent: _slideController,
          curve: Curves.elasticOut,
        )),
        child: ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: EdgeInsets.symmetric(
              horizontal: size.width * 0.04, vertical: size.height * 0.01),
          itemCount: _deliveries.length,
          itemBuilder: (context, index) {
            return FadeInUp(
              duration: Duration(milliseconds: 600 + (index * 200)),
              child: SlideInLeft(
                duration: Duration(milliseconds: 800 + (index * 150)),
                child: DeliveryCard(
                  delivery: _deliveries[index],
                  index: index,
                  onStatusUpdated: _fetchDeliveries,
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildLoadingShimmer() {
    final size = MediaQuery.of(context).size;
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.symmetric(
          horizontal: size.width * 0.04, vertical: size.height * 0.01),
      itemCount: 3,
      itemBuilder: (context, index) {
        return Shimmer.fromColors(
          baseColor: Colors.grey[300]!,
          highlightColor: Colors.grey[100]!,
          child: Container(
            margin: EdgeInsets.only(bottom: size.height * 0.02),
            height: size.height * 0.25,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(size.width * 0.05),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.1),
                  blurRadius: size.width * 0.025,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    final size = MediaQuery.of(context).size;
    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            BounceInDown(
              child: Container(
                padding: EdgeInsets.all(size.width * 0.05),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.error_outline,
                  size: size.width * 0.2,
                  color: Colors.red[400],
                ),
              ),
            ),
            SizedBox(height: size.height * 0.03),
            FadeInUp(
              delay: const Duration(milliseconds: 300),
              child: Text(
                'Gagal Memuat Pengiriman',
                style: TextStyle(
                  fontSize: size.width * 0.05,
                  color: Colors.grey[700],
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            SizedBox(height: size.height * 0.01),
            FadeInUp(
              delay: const Duration(milliseconds: 500),
              child: Text(
                _errorMessage!,
                style: TextStyle(
                  fontSize: size.width * 0.04,
                  color: Colors.grey[500],
                  fontWeight: FontWeight.w400,
                ),
                textAlign: TextAlign.center,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      );
    }
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          BounceInDown(
            child: Container(
              padding: EdgeInsets.all(size.width * 0.05),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.local_shipping_outlined,
                size: size.width * 0.2,
                color: Colors.grey[400],
              ),
            ),
          ),
          SizedBox(height: size.height * 0.03),
          FadeInUp(
            delay: const Duration(milliseconds: 300),
            child: Text(
              'Belum ada riwayat pengiriman',
              style: TextStyle(
                fontSize: size.width * 0.05,
                color: Colors.grey[700],
                fontWeight: FontWeight.w600,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          SizedBox(height: size.height * 0.01),
          FadeInUp(
            delay: const Duration(milliseconds: 500),
            child: Text(
              'Mulai pengiriman untuk mencatat riwayat!',
              style: TextStyle(
                fontSize: size.width * 0.04,
                color: Colors.grey[500],
                fontWeight: FontWeight.w400,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final oliveGreen = const Color(0xFF7A7C52);

    return Scaffold(
      body: Stack(
        children: [
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.grey[50]!,
                  Colors.white,
                  Colors.grey[50]!,
                ],
              ),
            ),
            child: CustomScrollView(
              slivers: [
                SliverAppBar(
                  pinned: true,
                  floating: false,
                  elevation: 8,
                  backgroundColor: Colors.transparent,
                  flexibleSpace: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          oliveGreen,
                          oliveGreen.withOpacity(0.9),
                          const Color(0xFF5A5D3A),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.only(
                        bottomLeft: Radius.circular(size.width * 0.06),
                        bottomRight: Radius.circular(size.width * 0.06),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.3),
                          blurRadius: size.width * 0.04,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    height: size.height * 0.18,
                    child: Stack(
                      children: [
                        Positioned(
                          top: -size.height * 0.06,
                          right: -size.width * 0.12,
                          child: Container(
                            width: size.width * 0.35,
                            height: size.width * 0.35,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withOpacity(0.05),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: -size.height * 0.04,
                          left: -size.width * 0.08,
                          child: Container(
                            width: size.width * 0.25,
                            height: size.width * 0.25,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withOpacity(0.03),
                            ),
                          ),
                        ),
                        SafeArea(
                          child: Padding(
                            padding: EdgeInsets.symmetric(
                              horizontal: size.width * 0.02,
                              vertical: size.height * 0.00,
                            ),
                            child: Row(
                              children: [
                                SizedBox(width: size.width * 0.02),
                                Expanded(
                                  child: Padding(
                                    padding: EdgeInsets.only(
                                        left: size.width *
                                            0.04), // Tambahkan padding kiri di sini
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        LayoutBuilder(
                                          builder: (context, constraints) {
                                            double availableWidth =
                                                constraints.maxWidth;
                                            String displayText =
                                                _getDisplayText(
                                                    availableWidth, size.width);
                                            double fontSize = _getFontSize(
                                                availableWidth, size.width);

                                            return Text(
                                              displayText,
                                              style: TextStyle(
                                                color: Colors.white,
                                                fontSize: fontSize,
                                                fontWeight: FontWeight.bold,
                                                height: 1.2,
                                              ),
                                              maxLines: availableWidth <
                                                      size.width * 0.6
                                                  ? 2
                                                  : 1,
                                              overflow: TextOverflow.ellipsis,
                                              softWrap: true,
                                            );
                                          },
                                        ),
                                        SizedBox(height: size.height * 0.01),
                                        Flexible(
                                          child: Text(
                                            '${_deliveries.length} Pengiriman',
                                            style: TextStyle(
                                              color: Colors.white70,
                                              fontSize: size.width * 0.035,
                                              height: 1.3,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: _isLoading
                      ? _buildLoadingShimmer()
                      : _deliveries.isEmpty
                          ? _buildEmptyState()
                          : Column(
                              children: [
                                _buildDeliveryList(),
                                SizedBox(height: size.height * 0.1),
                              ],
                            ),
                ),
              ],
            ),
          ),
          Positioned(
            bottom: size.height * 0.12,
            right: size.width * 0.04,
            child: ZoomIn(
              duration: const Duration(milliseconds: 800),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(size.width * 0.075),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF1A3C34).withOpacity(0.3),
                      blurRadius: 15,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: FloatingActionButton.extended(
                  onPressed: _showSortDialog,
                  backgroundColor: const Color(0xFF5A5D3A),
                  elevation: 0,
                  label: Text(
                    'Sort',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: size.width * 0.035,
                    ),
                  ),
                  icon: Icon(Icons.sort,
                      color: Colors.white, size: size.width * 0.05),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class DeliveryCard extends StatefulWidget {
  final Map<String, dynamic> delivery;
  final int index;
  final VoidCallback onStatusUpdated;

  const DeliveryCard({
    super.key,
    required this.delivery,
    required this.index,
    required this.onStatusUpdated,
  });

  @override
  _DeliveryCardState createState() => _DeliveryCardState();
}

class _DeliveryCardState extends State<DeliveryCard>
    with SingleTickerProviderStateMixin {
  bool _isExpanded = false;
  late AnimationController _animationController;
  late Animation<double> _expandAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );
    _expandAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Color _getStatusColor() {
    switch (widget.delivery['status']) {
      case 'Sudah Diterima':
        return Colors.green;
      case 'Sedang Dikirim':
        return Colors.blue;
      case 'Siap Dikirim':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon() {
    switch (widget.delivery['status']) {
      case 'Sudah Diterima':
        return Icons.check_circle;
      case 'Sedang Dikirim':
        return Icons.local_shipping;
      case 'Siap Dikirim':
        return Icons.hourglass_empty;
      default:
        return Icons.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Card(
      margin: EdgeInsets.only(bottom: size.height * 0.02),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(size.width * 0.03),
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(size.width * 0.03),
          gradient: LinearGradient(
            colors: [
              Colors.white,
              Colors.grey[50]!,
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          border: Border.all(
            color: const Color(0xFF7A7C52).withOpacity(0.2),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: size.width * 0.04,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          children: [
            _buildCardHeader(),
            AnimatedBuilder(
              animation: _expandAnimation,
              builder: (context, child) {
                return ClipRect(
                  child: Align(
                    alignment: Alignment.topCenter,
                    heightFactor: _expandAnimation.value,
                    child: child,
                  ),
                );
              },
              child: Column(
                children: [
                  Divider(
                    height: 1,
                    color: const Color(0xFF7A7C52),
                    indent: size.width * 0.04,
                    endIndent: size.width * 0.04,
                  ),
                  _buildExpandedContent(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCardHeader() {
    final size = MediaQuery.of(context).size;
    return InkWell(
      onTap: () {
        setState(() {
          _isExpanded = !_isExpanded;
          if (_isExpanded) {
            _animationController.forward();
          } else {
            _animationController.reverse();
          }
        });
      },
      borderRadius: BorderRadius.circular(size.width * 0.03),
      child: Container(
        padding: EdgeInsets.all(size.width * 0.04),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'No Nota. ${widget.delivery['order_id']}',
                        style: TextStyle(
                          fontSize: size.width * 0.045,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1A3C34),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      SizedBox(height: size.height * 0.01),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Container(
                            padding: EdgeInsets.symmetric(
                              horizontal: size.width * 0.03,
                              vertical: size.height * 0.007,
                            ),
                            decoration: BoxDecoration(
                              color: _getStatusColor().withOpacity(0.1),
                              borderRadius:
                                  BorderRadius.circular(size.width * 0.05),
                              border: Border.all(
                                color: _getStatusColor().withOpacity(0.3),
                                width: 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  _getStatusIcon(),
                                  color: _getStatusColor(),
                                  size: size.width * 0.035,
                                ),
                                SizedBox(width: size.width * 0.01),
                                Text(
                                  widget.delivery['status'],
                                  style: TextStyle(
                                    fontSize: size.width * 0.03,
                                    fontWeight: FontWeight.w600,
                                    color: _getStatusColor(),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          AnimatedRotation(
                            turns: _isExpanded ? 0.5 : 0,
                            duration: const Duration(milliseconds: 300),
                            child: Icon(
                              Icons.expand_circle_down_outlined,
                              color: const Color(0xFF7A7C52),
                              size: size.width * 0.06,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(height: size.height * 0.015),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Tanggal',
                        style: TextStyle(
                          fontSize: size.width * 0.03,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      SizedBox(height: size.height * 0.005),
                      Text(
                        _formatDate(widget.delivery['date']),
                        style: TextStyle(
                          fontSize: size.width * 0.035,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF1A3C34),
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (widget.delivery['tanggal_siap'] != null) ...[
                        SizedBox(height: size.height * 0.005),
                        Text(
                          'Siap Dikirim',
                          style: TextStyle(
                            fontSize: size.width * 0.03,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        SizedBox(height: size.height * 0.005),
                        Text(
                          _formatDate(widget.delivery['tanggal_siap']),
                          style: TextStyle(
                            fontSize: size.width * 0.035,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF1A3C34),
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'Pembeli',
                      style: TextStyle(
                        fontSize: size.width * 0.03,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: size.height * 0.005),
                    Text(
                      widget.delivery['customer_name'],
                      style: TextStyle(
                        fontSize: size.width * 0.035,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF7A7C52),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ],
            ),
            SizedBox(height: size.height * 0.015),
            Text(
              'Alamat',
              style: TextStyle(
                fontSize: size.width * 0.03,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            SizedBox(height: size.height * 0.005),
            Text(
              widget.delivery['address'],
              style: TextStyle(
                fontSize: size.width * 0.035,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF1A3C34),
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExpandedContent() {
    final size = MediaQuery.of(context).size;
    final items = widget.delivery['items'] as List<dynamic>? ?? [];
    return Padding(
      padding: EdgeInsets.fromLTRB(size.width * 0.04, size.height * 0.01,
          size.width * 0.04, size.height * 0.02),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          FadeInRight(
            duration: const Duration(milliseconds: 300),
            child: Container(
              margin: EdgeInsets.only(bottom: size.height * 0.02),
              padding: EdgeInsets.all(size.width * 0.04),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(size.width * 0.04),
                border: Border.all(
                  color: const Color(0xFF7A7C52).withOpacity(0.1),
                  width: 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: size.width * 0.02,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: EdgeInsets.all(size.width * 0.02),
                        decoration: BoxDecoration(
                          color: const Color(0xFF7A7C52).withOpacity(0.1),
                          borderRadius:
                              BorderRadius.circular(size.width * 0.015),
                        ),
                        child: Icon(
                          Icons.local_shipping,
                          size: size.width * 0.04,
                          color: const Color(0xFF7A7C52),
                        ),
                      ),
                      SizedBox(width: size.width * 0.03),
                      Expanded(
                        child: Text(
                          'Items in Delivery',
                          style: TextStyle(
                            fontSize: size.width * 0.04,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF1A3C34),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: size.height * 0.02),
                  ...items.asMap().entries.map((entry) {
                    final itemIndex = entry.key;
                    final item = entry.value;
                    return SlideInLeft(
                      duration: Duration(milliseconds: 400 + (itemIndex * 100)),
                      child: DeliveryItem(
                        item: DeliveryMapItem(
                          name: item['name'] as String,
                          price: item['price'] as String,
                          image: item['image'] as String,
                        ),
                      ),
                    );
                  }).toList(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class DeliveryMapItem {
  final String name;
  final String price;
  final String image;

  DeliveryMapItem({
    required this.name,
    required this.price,
    required this.image,
  });
}

class DeliveryItem extends StatelessWidget {
  final DeliveryMapItem item;

  const DeliveryItem({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Container(
      margin: EdgeInsets.only(bottom: size.height * 0.015),
      padding: EdgeInsets.all(size.width * 0.03),
      decoration: BoxDecoration(
        color: Colors.grey[50]!,
        borderRadius: BorderRadius.circular(size.width * 0.03),
        border: Border.all(
          color: Colors.grey[200]!,
          width: 1,
        ),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(size.width * 0.03),
            child: CachedNetworkImage(
              imageUrl: item.image,
              height: size.width * 0.15,
              width: size.width * 0.15,
              fit: BoxFit.cover,
              placeholder: (context, url) => Shimmer.fromColors(
                baseColor: Colors.grey[300]!,
                highlightColor: Colors.grey[100]!,
                child: Container(
                  color: Colors.grey,
                ),
              ),
              errorWidget: (context, url, error) => Container(
                height: size.width * 0.15,
                width: size.width * 0.15,
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(size.width * 0.03),
                ),
                child: Icon(
                  Icons.image_not_supported_outlined,
                  color: Colors.grey,
                  size: size.width * 0.08,
                ),
              ),
            ),
          ),
          SizedBox(width: size.width * 0.04),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name,
                  style: TextStyle(
                    fontSize: size.width * 0.037,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF1A3C34),
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                SizedBox(height: size.height * 0.01),
                Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: size.width * 0.05,
                    vertical: size.height * 0.005,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF7A7C52).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(size.width * 0.01),
                  ),
                  child: Text(
                    item.price,
                    style: TextStyle(
                      fontSize: size.width * 0.035,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF7A7C52),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
