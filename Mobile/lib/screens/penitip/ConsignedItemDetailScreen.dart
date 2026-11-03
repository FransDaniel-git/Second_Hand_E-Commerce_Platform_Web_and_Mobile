import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:shimmer/shimmer.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';

const String baseUrl = 'http://10.0.2.2:8000/api';

class ConsignedItemDetailScreen extends StatefulWidget {
  final String id;
  final String title;
  final String price;
  final String status;
  final List<String> images;
  final String description;
  final String condition;
  final String weight;
  final String tanggalPenitipan;
  final String tanggalKadaluarsa;
  final String? rating;

  const ConsignedItemDetailScreen({
    super.key,
    required this.id,
    required this.title,
    required this.price,
    required this.status,
    required this.images,
    required this.description,
    required this.condition,
    required this.weight,
    required this.tanggalPenitipan,
    required this.tanggalKadaluarsa,
    this.rating,
  });

  @override
  _ConsignedItemDetailScreenState createState() =>
      _ConsignedItemDetailScreenState();
}

class _ConsignedItemDetailScreenState extends State<ConsignedItemDetailScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _item;
  String? _errorMessage;
  final PageController _pageController = PageController();
  int _currentPage = 0;
  List<bool> _imageLoaded = [];

  @override
  void initState() {
    super.initState();
    _fetchItemDetails();
  }

  Future<bool> _checkConnectivity() async {
    try {
      var connectivityResult = await Connectivity().checkConnectivity();
      return connectivityResult != ConnectivityResult.none;
    } catch (e) {
      print('Connectivity Check Error: $e');
      return false;
    }
  }

  Future<String?> _getAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  Future<void> _fetchItemDetails() async {
    if (!await _checkConnectivity()) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Tidak ada koneksi internet';
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Tidak ada koneksi internet'),
            backgroundColor: Colors.red,
          ),
        );
      });
      return;
    }

    const maxRetries = 3;
    const retryDelay = Duration(seconds: 2);
    int attempt = 0;

    while (attempt < maxRetries) {
      try {
        String? token = await _getAuthToken();
        if (token == null) {
          setState(() {
            _isLoading = false;
            _errorMessage = 'No token found. Please login again.';
          });
          final prefs = await SharedPreferences.getInstance();
          await prefs.remove('token');
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('No token found. Please login again.'),
              backgroundColor: Colors.red,
            ),
          );
          return;
        }

        final response = await http.get(
          Uri.parse('$baseUrl/products/mobile/${widget.id}'),
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
        ).timeout(const Duration(seconds: 30));

        if (response.statusCode == 200) {
          var jsonResponse = json.decode(response.body);
          if (jsonResponse['success'] && jsonResponse['data'] is Map) {
            var itemData = jsonResponse['data'];
            if (itemData['photos'] != null && itemData['photos'].isNotEmpty) {
              itemData['photos'] = itemData['photos'].map((photo) {
                photo['url'] = photo['id'] != null
                    ? '$baseUrl/photos/${photo['id']}/optimized'
                    : '/api/placeholder/60/60';
                return photo;
              }).toList();
              setState(() {
                _imageLoaded =
                    List<bool>.filled(itemData['photos'].length, false);
              });
            } else {
              itemData['photos'] = [
                {'url': '/api/placeholder/60/60', 'is_utama': true}
              ];
              setState(() {
                _imageLoaded = [true];
              });
            }
            setState(() {
              _item = itemData;
              _isLoading = false;
              _errorMessage = null;
            });
            return;
          } else {
            throw Exception('Unexpected response format: ${response.body}');
          }
        } else if (response.statusCode == 401) {
          setState(() {
            _isLoading = false;
            _errorMessage = 'Session expired. Please login again.';
          });
          final prefs = await SharedPreferences.getInstance();
          await prefs.remove('token');
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Session expired. Please login again.'),
              backgroundColor: Colors.red,
            ),
          );
          return;
        } else {
          throw Exception('Failed to load item: ${response.statusCode}');
        }
      } catch (e) {
        print('Fetch Item Details Error: $e');
        attempt++;
        if (attempt == maxRetries) {
          setState(() {
            _isLoading = false;
            _errorMessage = e.toString();
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Gagal memuat detail barang: $e')),
          );
          return;
        }
        await Future.delayed(retryDelay);
      }
    }
  }

  String _formatRupiah(num price) {
    return 'Rp ${NumberFormat("#,##0", "id_ID").format(price)}';
  }

  Color _getStatusColor(String status) {
    switch (status) {
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

  String _formatDate(String? dateString) {
    if (dateString == null || dateString == '-') {
      return 'Tidak Ada';
    }
    try {
      DateTime date = DateTime.parse(dateString);
      return DateFormat('dd MMM yyyy').format(date);
    } catch (e) {
      print('Error formatting date $dateString: $e');
      return 'N/A';
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: _isLoading ? _buildShimmer() : _buildContent(),
      bottomNavigationBar: _isLoading
          ? null
          : Container(
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.1),
                    spreadRadius: 1,
                    blurRadius: 10,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: ZoomIn(
                    duration: const Duration(milliseconds: 800),
                    child: ElevatedButton(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: const Text(
                                'Hubungi admin untuk info lebih lanjut'),
                            backgroundColor: const Color(0xFF7A7C52),
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF7A7C52),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        elevation: 4,
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.info),
                          SizedBox(width: 8),
                          Text('Hubungi Admin untuk Detail'),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
    );
  }

  Widget _buildShimmer() {
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: MediaQuery.of(context).size.height * 0.4,
          backgroundColor: Colors.white,
          elevation: 0,
          flexibleSpace: FlexibleSpaceBar(
            background: Shimmer.fromColors(
              baseColor: Colors.grey[300]!,
              highlightColor: Colors.grey[100]!,
              child: Container(
                height: MediaQuery.of(context).size.height * 0.4,
                color: Colors.grey,
              ),
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Container(
            color: Colors.white,
            child: Padding(
              padding: EdgeInsets.all(MediaQuery.of(context).size.width * 0.05),
              child: Shimmer.fromColors(
                baseColor: Colors.grey[300]!,
                highlightColor: Colors.grey[100]!,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: MediaQuery.of(context).size.width * 0.4,
                      height: MediaQuery.of(context).size.height * 0.06,
                      decoration: BoxDecoration(
                        color: Colors.grey,
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: MediaQuery.of(context).size.width * 0.6,
                      height: MediaQuery.of(context).size.height * 0.05,
                      decoration: BoxDecoration(
                        color: Colors.grey,
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: List.generate(
                        3,
                        (_) => Container(
                          width: MediaQuery.of(context).size.width * 0.25,
                          height: MediaQuery.of(context).size.height * 0.12,
                          decoration: BoxDecoration(
                            color: Colors.grey,
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Container(
                      width: MediaQuery.of(context).size.width * 0.4,
                      height: MediaQuery.of(context).size.height * 0.04,
                      decoration: BoxDecoration(
                        color: Colors.grey,
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      height: MediaQuery.of(context).size.height * 0.15,
                      decoration: BoxDecoration(
                        color: Colors.grey,
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildContent() {
    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Error: $_errorMessage',
                style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _isLoading = true;
                  _errorMessage = null;
                  _imageLoaded = [];
                });
                _fetchItemDetails();
              },
              child: const Text('Coba Lagi'),
            ),
          ],
        ),
      );
    }

    final images =
        _item!['photos']?.map((photo) => photo['url'] as String).toList() ??
            ['/api/placeholder/60/60'];
    final warranty = _item!['warranty_date'] != null
        ? _formatDate(_item!['warranty_date'])
        : 'Tidak Ada';
    final rating =
        _item!['rating'] != null ? _item!['rating'].toString() : 'N/A';

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: MediaQuery.of(context).size.height * 0.4,
          pinned: true,
          backgroundColor: Colors.white,
          elevation: 0,
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              height: MediaQuery.of(context).size.height * 0.4,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  PageView.builder(
                    controller: _pageController,
                    itemCount: images.length,
                    onPageChanged: (index) {
                      setState(() {
                        _currentPage = index;
                      });
                    },
                    itemBuilder: (context, index) {
                      if (images[index] == '/api/placeholder/60/60') {
                        return Hero(
                          tag: 'consignedItemImage${_item!['id']}_$index',
                          child: Image.asset(
                            'assets/images/placeholder.png',
                            fit: BoxFit.cover,
                            height: MediaQuery.of(context).size.height * 0.4,
                            width: double.infinity,
                          ),
                        );
                      }
                      return Hero(
                        tag: 'consignedItemImage${_item!['id']}_$index',
                        child: CachedNetworkImage(
                          imageUrl: images[index],
                          fit: BoxFit.cover,
                          height: MediaQuery.of(context).size.height * 0.4,
                          width: double.infinity,
                          placeholder: (context, url) => Shimmer.fromColors(
                            baseColor: Colors.grey[300]!,
                            highlightColor: Colors.grey[100]!,
                            child: Container(color: Colors.grey),
                          ),
                          imageBuilder: (context, imageProvider) {
                            WidgetsBinding.instance.addPostFrameCallback((_) {
                              if (!_imageLoaded[index]) {
                                setState(() {
                                  _imageLoaded[index] = true;
                                  print('Image loaded: ${images[index]}');
                                });
                              }
                            });
                            return Container(
                              height: MediaQuery.of(context).size.height * 0.4,
                              width: double.infinity,
                              decoration: BoxDecoration(
                                image: DecorationImage(
                                    image: imageProvider, fit: BoxFit.cover),
                              ),
                            );
                          },
                          errorWidget: (context, url, error) {
                            print('Image load error: $error, URL: $url');
                            WidgetsBinding.instance.addPostFrameCallback((_) {
                              if (!_imageLoaded[index]) {
                                setState(() {
                                  _imageLoaded[index] = true;
                                });
                              }
                            });
                            return Image.asset(
                              'assets/images/placeholder.png',
                              fit: BoxFit.cover,
                              height: MediaQuery.of(context).size.height * 0.4,
                              width: double.infinity,
                            );
                          },
                        ),
                      );
                    },
                  ),
                  Positioned(
                    bottom: 20,
                    left: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          vertical: 4, horizontal: 8),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          images.length,
                          (index) => Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _currentPage == index
                                  ? Colors.white
                                  : Colors.white.withOpacity(0.5),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.2),
                                  blurRadius: 2,
                                  offset: const Offset(0, 1),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          leading: Padding(
            padding: const EdgeInsets.all(8.0),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                color: const Color(0xFF7A7C52).withOpacity(0.7),
              ),
              child: IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded,
                    color: Colors.white),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Container(
            color: Colors.white,
            child: Padding(
              padding: EdgeInsets.all(MediaQuery.of(context).size.width * 0.05),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  FadeInDown(
                    duration: const Duration(milliseconds: 600),
                    child: Text(
                      _formatRupiah(_item!['price'] ?? 0),
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF7A7C52),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  FadeInDown(
                    duration: const Duration(milliseconds: 700),
                    child: Text(
                      _item!['name'].toUpperCase(),
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  FadeInDown(
                    duration: const Duration(milliseconds: 800),
                    child: Text(
                      'Status: ${_item!['status']}',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w500,
                        color: _getStatusColor(_item!['status']),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  FadeInLeft(
                    duration: const Duration(milliseconds: 800),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey[50],
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.grey.withOpacity(0.2)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Spesifikasi Barang',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.grey[800],
                            ),
                          ),
                          const SizedBox(height: 12),
                          Column(
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: _ModernDetailChip(
                                      icon: Icons.verified,
                                      label: 'Kondisi',
                                      value: _item!['condition'],
                                      color: Colors.green,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: _ModernDetailChip(
                                      icon: Icons.scale,
                                      label: 'Berat',
                                      value: '${_item!['weight']} kg',
                                      color: Colors.blue,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Expanded(
                                    child: _ModernDetailChip(
                                      icon: Icons.security,
                                      label: 'Garansi',
                                      value: warranty,
                                      color: Colors.orange,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: _ModernDetailChip(
                                      icon: Icons.calendar_today,
                                      label: 'Penitipan',
                                      value: _formatDate(
                                          _item!['penitip_tanggal_penitipan']),
                                      color: Colors.purple,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Expanded(
                                    child: _ModernDetailChip(
                                      icon: Icons.event_busy,
                                      label: 'Kadaluarsa',
                                      value: _formatDate(_item!['expiry_date']),
                                      color: Colors.red,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: _ModernDetailChip(
                                      icon: Icons.star,
                                      label: 'Rating',
                                      value: rating,
                                      color: Colors.amber,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  FadeInUp(
                    duration: const Duration(milliseconds: 900),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.grey.withOpacity(0.1),
                            spreadRadius: 1,
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(
                                Icons.description,
                                color: Color(0xFF7A7C52),
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Deskripsi Barang',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.grey[800],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            _item!['description'],
                            style: TextStyle(
                              color: Colors.grey[700],
                              fontSize: 15,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ModernDetailChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _ModernDetailChip({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: (MediaQuery.of(context).size.width - 64) / 2, // Responsive width
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 16),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
