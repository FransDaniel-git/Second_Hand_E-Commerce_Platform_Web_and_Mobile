import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import 'package:animate_do/animate_do.dart';
import 'package:shimmer/shimmer.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'hunter_commission_detail.dart';
import '../otentikasi/login.dart';
import '../../models/comission.dart';
import 'dart:developer' as developer;

class CommissionHistoryScreen extends StatefulWidget {
  const CommissionHistoryScreen({super.key});

  @override
  _CommissionHistoryScreenState createState() =>
      _CommissionHistoryScreenState();
}

class _CommissionHistoryScreenState extends State<CommissionHistoryScreen>
    with TickerProviderStateMixin {
  bool _isLoading = true;
  String? _errorMessage;
  late AnimationController _fadeController;
  late AnimationController _slideController;
  List<Commission> _commissions = [];
  String _selectedSort = 'Transaction Date (Latest)';
  final List<String> _sortOptions = [
    'Transaction Date (Latest)',
    'Transaction Date (Oldest)',
    'Consignment Date (Latest)',
    'Consignment Date (Oldest)',
    'Commission Amount (Highest)',
    'Commission Amount (Lowest)',
  ];

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

    _fetchCommissions();
  }

  Future<void> _fetchCommissions() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token == null) {
        if (mounted) {
          setState(() {
            _errorMessage = 'Token tidak ditemukan. Silakan login kembali.';
            _isLoading = false;
          });
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const LoginScreen()),
          );
        }
        return;
      }

      final response = await http.get(
        Uri.parse('http://10.0.2.2:8000/api/hunter/komisi'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      developer.log('API Response Status: ${response.statusCode}',
          name: 'CommissionHistoryScreen');
      developer.log('API Response Body: ${response.body}',
          name: 'CommissionHistoryScreen');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        final List<Commission> fetchedCommissions = data.map((item) {
          // Format URL gambar yang benar
          String imageUrl;
          if (item['product_image'] != null &&
              item['product_image'].toString().isNotEmpty &&
              item['product_image'].toString() != '/api/placeholder/60/60' &&
              item['product_image'].toString() !=
                  'http://10.0.2.2:8000/api/placeholder/60/60') {
            imageUrl =
                'http://10.0.2.2:8000/api/products/${item['KODE_PRODUK']}/thumbnail';
          } else {
            imageUrl = 'http://10.0.2.2:8000/api/placeholder/60/60';
          }

          developer.log(
              'Processing item: ${item['KODE_PRODUK']}, Image URL: $imageUrl',
              name: 'CommissionHistoryScreen');

          // Pastikan amount adalah integer
          int commissionAmount = 0;
          if (item['KOMISI_HUNTER'] != null) {
            if (item['KOMISI_HUNTER'] is int) {
              commissionAmount = item['KOMISI_HUNTER'];
            } else if (item['KOMISI_HUNTER'] is String) {
              commissionAmount = int.tryParse(item['KOMISI_HUNTER']) ?? 0;
            } else if (item['KOMISI_HUNTER'] is double) {
              commissionAmount = (item['KOMISI_HUNTER'] as double).toInt();
            }
          }

          // Pastikan selling price adalah integer
          int sellingPrice = 0;
          if (item['selling_price'] != null) {
            if (item['selling_price'] is int) {
              sellingPrice = item['selling_price'];
            } else if (item['selling_price'] is String) {
              sellingPrice = int.tryParse(item['selling_price']) ?? 0;
            } else if (item['selling_price'] is double) {
              sellingPrice = (item['selling_price'] as double).toInt();
            }
          }

          return Commission(
            commissionId: item['KODE_PRODUK'] ?? 'Unknown ID',
            productName: item['product_name'] ?? 'Unknown Product',
            penitipName: item['penitip_name'] ?? 'Unknown Penitip',
            amount: commissionAmount,
            date: item['commission_date'] ?? 'Unknown Date',
            status:
                'Terjual', // Status tetap 'Terjual' karena ini riwayat komisi
            imagePath: imageUrl,
            transactionDate: item['transaction_date'] ?? '-',
            consignmentDate: item['consignment_date'] ?? '-',
            sellingPrice: sellingPrice,
          );
        }).toList();

        if (mounted) {
          setState(() {
            _commissions = fetchedCommissions;
            _sortCommissions(); // Apply initial sorting
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
          Navigator.pushReplacementNamed(context, '/login');
        }
      } else {
        final errorData = jsonDecode(response.body);
        if (mounted) {
          setState(() {
            _errorMessage =
                'Gagal memuat komisi: ${errorData['message'] ?? response.statusCode}';
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
          SnackBar(content: Text('Gagal memuat komisi: $e')),
        );
      }
      developer.log('Fetch Commissions Error: $e',
          name: 'CommissionHistoryScreen');
    }
  }

  void _sortCommissions() {
    setState(() {
      switch (_selectedSort) {
        case 'Transaction Date (Latest)':
          _commissions.sort((a, b) {
            if (a.transactionDate == '-' && b.transactionDate == '-') return 0;
            if (a.transactionDate == '-') return 1;
            if (b.transactionDate == '-') return -1;
            return DateTime.parse(b.transactionDate)
                .compareTo(DateTime.parse(a.transactionDate));
          });
          break;
        case 'Transaction Date (Oldest)':
          _commissions.sort((a, b) {
            if (a.transactionDate == '-' && b.transactionDate == '-') return 0;
            if (a.transactionDate == '-') return 1;
            if (b.transactionDate == '-') return -1;
            return DateTime.parse(a.transactionDate)
                .compareTo(DateTime.parse(b.transactionDate));
          });
          break;
        case 'Consignment Date (Latest)':
          _commissions.sort((a, b) {
            if (a.consignmentDate == '-' && b.consignmentDate == '-') return 0;
            if (a.consignmentDate == '-') return 1;
            if (b.consignmentDate == '-') return -1;
            return DateTime.parse(b.consignmentDate)
                .compareTo(DateTime.parse(a.consignmentDate));
          });
          break;
        case 'Consignment Date (Oldest)':
          _commissions.sort((a, b) {
            if (a.consignmentDate == '-' && b.consignmentDate == '-') return 0;
            if (a.consignmentDate == '-') return 1;
            if (b.consignmentDate == '-') return -1;
            return DateTime.parse(a.consignmentDate)
                .compareTo(DateTime.parse(b.consignmentDate));
          });
          break;
        case 'Commission Amount (Highest)':
          _commissions.sort((a, b) => b.amount.compareTo(a.amount));
          break;
        case 'Commission Amount (Lowest)':
          _commissions.sort((a, b) => a.amount.compareTo(b.amount));
          break;
      }
    });
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _slideController.dispose();
    super.dispose();
  }

  String _getDisplayText(double availableWidth) {
    return availableWidth < 280 ? 'Riwayat\nKomisi' : 'Riwayat Komisi';
  }

  double _getFontSize(double availableWidth) {
    return availableWidth < 280 ? 18 : 20;
  }

  Widget _buildCommissionList() {
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
        child: Column(
          children: [
            Padding(
              padding: EdgeInsets.symmetric(
                horizontal: size.width * 0.04,
                vertical: size.height * 0.02,
              ),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(size.width * 0.02),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: size.width * 0.02,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: DropdownButton<String>(
                  value: _selectedSort,
                  items: _sortOptions.map((String option) {
                    return DropdownMenuItem<String>(
                      value: option,
                      child: Padding(
                        padding:
                            EdgeInsets.symmetric(horizontal: size.width * 0.04),
                        child: Text(
                          option,
                          style: TextStyle(fontSize: size.width * 0.035),
                        ),
                      ),
                    );
                  }).toList(),
                  onChanged: (String? newValue) {
                    setState(() {
                      _selectedSort = newValue!;
                      _sortCommissions();
                    });
                  },
                  underline: const SizedBox(),
                  icon: Icon(Icons.sort, size: size.width * 0.05),
                  borderRadius: BorderRadius.circular(size.width * 0.02),
                  padding: EdgeInsets.symmetric(
                    vertical: size.height * 0.01,
                    horizontal: size.width * 0.02,
                  ),
                  isExpanded: true,
                ),
              ),
            ),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: EdgeInsets.symmetric(
                  horizontal: size.width * 0.04, vertical: size.height * 0.01),
              itemCount: _commissions.length,
              itemBuilder: (context, index) {
                return FadeInUp(
                  duration: Duration(milliseconds: 600 + (index * 200)),
                  child: SlideInLeft(
                    duration: Duration(milliseconds: 800 + (index * 150)),
                    child: CommissionCard(
                      commission: _commissions[index],
                      index: index,
                    ),
                  ),
                );
              },
            ),
          ],
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
            height: size.height * 0.15,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(size.width * 0.03),
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
                'Gagal Memuat Komisi',
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
                Icons.monetization_on_outlined,
                size: size.width * 0.2,
                color: Colors.grey[400],
              ),
            ),
          ),
          SizedBox(height: size.height * 0.03),
          FadeInUp(
            delay: const Duration(milliseconds: 300),
            child: Text(
              'Belum ada riwayat komisi',
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
              'Mulai hunting untuk mendapatkan komisi!',
              style: TextStyle(
                fontSize: size.width * 0.04,
                color: Colors.grey[500],
                fontWeight: FontWeight.w400,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final oliveGreen = const Color(0xFF7A7C52);

    return Scaffold(
      body: Container(
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
                  borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(25),
                    bottomRight: Radius.circular(25),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      blurRadius: 15,
                      offset: const Offset(0, 5),
                    ),
                    BoxShadow(
                      color: oliveGreen.withOpacity(0.2),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                height: 140,
                child: Stack(
                  children: [
                    Positioned(
                      top: -50,
                      right: -50,
                      child: Container(
                        width: 150,
                        height: 150,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.05),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: -30,
                      left: -30,
                      child: Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.03),
                        ),
                      ),
                    ),
                    SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16.0, vertical: 12.0),
                        child: Row(
                          children: [
                            const SizedBox(width: 48),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  LayoutBuilder(
                                    builder: (context, constraints) {
                                      double availableWidth =
                                          constraints.maxWidth;
                                      String displayText =
                                          _getDisplayText(availableWidth);
                                      double fontSize =
                                          _getFontSize(availableWidth);

                                      return Text(
                                        displayText,
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: fontSize,
                                          fontWeight: FontWeight.bold,
                                          height: 1.2,
                                        ),
                                        maxLines: availableWidth < 280 ? 2 : 1,
                                        overflow: TextOverflow.ellipsis,
                                        softWrap: true,
                                      );
                                    },
                                  ),
                                  const SizedBox(height: 8),
                                  Flexible(
                                    child: Text(
                                      '${_commissions.length} Komisi',
                                      style: const TextStyle(
                                        color: Colors.white70,
                                        fontSize: 14,
                                        height: 1.3,
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
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: _isLoading
                  ? _buildLoadingShimmer()
                  : _commissions.isEmpty
                      ? _buildEmptyState()
                      : Column(
                          children: [
                            _buildCommissionList(),
                            const SizedBox(height: 80),
                          ],
                        ),
            ),
          ],
        ),
      ),
    );
  }
}

class CommissionCard extends StatelessWidget {
  final Commission commission;
  final int index;

  const CommissionCard({
    super.key,
    required this.commission,
    required this.index,
  });

  Color _getStatusColor() {
    switch (commission.status.toLowerCase()) {
      case 'completed':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      case 'terjual':
        return Colors.blue; // Warna biru untuk status 'Terjual'
      default:
        return Colors.grey;
    }
  }

  String _formatDate(String date) {
    if (date == '-') return 'N/A';
    try {
      final parsedDate = DateTime.parse(date);
      final formatter = DateFormat('d MMMM y', 'id_ID');
      return formatter.format(parsedDate);
    } catch (e) {
      return date.split(' ')[0];
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return FadeInUp(
      duration: Duration(milliseconds: 600 + (index * 200)),
      child: Card(
        margin: EdgeInsets.symmetric(
            vertical: size.height * 0.01, horizontal: size.width * 0.02),
        elevation: null,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(size.width * 0.03),
        ),
        child: InkWell(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) =>
                    CommissionDetailScreen(commission: commission),
              ),
            );
          },
          borderRadius: BorderRadius.circular(size.width * 0.03),
          child: Container(
            padding: EdgeInsets.all(size.width * 0.04),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(size.width * 0.03),
              gradient: LinearGradient(
                colors: [Colors.white, Colors.grey[50]!],
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
                  blurRadius: size.width * 0.025,
                  offset: const Offset(0, 1),
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
                        commission.productName,
                        style: TextStyle(
                          fontSize: size.width * 0.04,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF1A3C34),
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      SizedBox(height: size.height * 0.005),
                      Text(
                        'Transaction: ${_formatDate(commission.transactionDate)}',
                        style: TextStyle(
                          fontSize: size.width * 0.035,
                          color: Colors.grey[600],
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      SizedBox(height: size.height * 0.005),
                      Text(
                        'Consignment: ${_formatDate(commission.consignmentDate)}',
                        style: TextStyle(
                          fontSize: size.width * 0.035,
                          color: Colors.grey[600],
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      SizedBox(height: size.height * 0.005),
                      Text(
                        'Commission: Rp ${NumberFormat("#,##0", "id_ID").format(commission.amount)}',
                        style: TextStyle(
                          fontSize: size.width * 0.035,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF7A7C52),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      // Tambahkan status jika ingin ditampilkan
                      SizedBox(height: size.height * 0.005),
                      Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: size.width * 0.02,
                          vertical: size.height * 0.003,
                        ),
                        decoration: BoxDecoration(
                          color: _getStatusColor(),
                          borderRadius:
                              BorderRadius.circular(size.width * 0.02),
                        ),
                        child: Text(
                          commission.status,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: size.width * 0.025,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: EdgeInsets.all(size.width * 0.02),
                  decoration: const BoxDecoration(
                    color: Color(0xFF7A7C52),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.arrow_forward_ios,
                    size: size.width * 0.04,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
