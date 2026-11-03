import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:shimmer/shimmer.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'ConsignedItemDetailScreen.dart'; // Pastikan path ini sesuai project kamu

const String baseUrl = 'http://10.0.2.2:8000/api';

class ConsignedItemsScreen extends StatefulWidget {
  const ConsignedItemsScreen({super.key});

  @override
  _ConsignedItemsScreenState createState() => _ConsignedItemsScreenState();
}

class _ConsignedItemsScreenState extends State<ConsignedItemsScreen>
    with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  AnimationController? _animationController;
  Animation<double>? _fadeAnimation;
  Animation<Offset>? _slideAnimation;
  ScrollController _scrollController = ScrollController();
  bool _isScrolled = false;
  String? _selectedStatus;
  String _sortBy = 'tanggal_penitipan';
  String _sortOrder = 'desc';
  List<dynamic> _consignedItems = [];
  int _currentPage = 1;
  int _totalPages = 1;
  bool _isFetchingMore = false;
  TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController!,
      curve: Curves.easeInOut,
    ));

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, -0.5),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController!,
      curve: Curves.elasticOut,
    ));

    _animationController!.forward();

    _scrollController.addListener(() {
      setState(() {
        _isScrolled = _scrollController.offset > 50;
      });
      if (_scrollController.position.pixels >=
              _scrollController.position.maxScrollExtent - 200 &&
          !_isFetchingMore &&
          _currentPage < _totalPages) {
        _fetchMoreItems();
      }
    });

    _fetchConsignedItems();

    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text;
        _isLoading = true;
        _currentPage = 1;
      });
      _fetchConsignedItems();
    });
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

  Future<void> _fetchConsignedItems({bool isLoadMore = false}) async {
    if (!isLoadMore) {
      setState(() {
        _isLoading = true;
      });
    } else {
      setState(() {
        _isFetchingMore = true;
      });
    }

    if (!await _checkConnectivity()) {
      setState(() {
        _isLoading = false;
        _isFetchingMore = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Tidak ada koneksi internet'),
          backgroundColor: Colors.red,
        ),
      );
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
            _isFetchingMore = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('No token found. Please login again.'),
              backgroundColor: Colors.red,
            ),
          );
          final prefs = await SharedPreferences.getInstance();
          await prefs.remove('token');
          return;
        }

        var uri = Uri.parse('$baseUrl/penitip/barang-titipan');
        Map<String, dynamic> queryParams = {
          'page': _currentPage.toString(),
          'per_page': '10',
        };
        if (_searchQuery.isNotEmpty) {
          queryParams['search'] = _searchQuery;
        }
        uri = uri.replace(queryParameters: queryParams);

        print('Fetching consigned items with query: $uri');
        final response = await http.get(
          uri,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
        ).timeout(const Duration(seconds: 30));

        if (response.statusCode == 200) {
          var jsonResponse = json.decode(response.body);
          if (jsonResponse['success'] && jsonResponse['data'] is List) {
            setState(() {
              var items = jsonResponse['data'].map((item) {
                item['foto_produk'] =
                    item['foto_produk'] != '/api/placeholder/60/60'
                        ? '$baseUrl/products/${item['kode_produk']}/thumbnail'
                        : '/api/placeholder/60/60';
                return {
                  ...item,
                  'images': [item['foto_produk']],
                };
              }).toList();
              if (!isLoadMore) {
                _consignedItems = items;
              } else {
                _consignedItems.addAll(items);
              }
              _totalPages = jsonResponse['meta']['last_page'] ?? 1;
              _isLoading = false;
              _isFetchingMore = false;
              if (isLoadMore) _currentPage++;
            });
            print(
                'Fetched ${_consignedItems.length} consigned items (page $_currentPage)');
            return;
          } else {
            throw Exception('Unexpected response format: ${response.body}');
          }
        } else if (response.statusCode == 401) {
          setState(() {
            _isLoading = false;
            _isFetchingMore = false;
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
          throw Exception(
              'Failed to load consigned items: ${response.statusCode} - ${response.body}');
        }
      } catch (e) {
        print(
            'Fetch Consigned Items Error (Attempt ${attempt + 1}/$maxRetries): $e');
        attempt++;
        if (attempt >= maxRetries) {
          setState(() {
            _isLoading = false;
            _isFetchingMore = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content: Text('Gagal memuat barang titipan: ${e.toString()}')),
          );
          return;
        }
        await Future.delayed(retryDelay);
      }
    }
  }

  Future<void> _fetchMoreItems() async {
    _currentPage++;
    await _fetchConsignedItems(isLoadMore: true);
  }

  List<dynamic> get _filteredItems {
    List<dynamic> filteredItems = List.from(_consignedItems);
    if (_selectedStatus != null && _selectedStatus!.isNotEmpty) {
      filteredItems = filteredItems.where((item) {
        String status = item['status'] ?? '';
        if (_selectedStatus == 'Telah Didonasikan') {
          return status == 'Didonasikan';
        }
        return status == _selectedStatus;
      }).toList();
    }
    if (_sortBy == 'tanggal_penitipan') {
      filteredItems.sort((a, b) {
        DateTime dateA = DateTime.parse(a['tanggal_penitipan']);
        DateTime dateB = DateTime.parse(b['tanggal_penitipan']);
        return _sortOrder == 'desc'
            ? dateB.compareTo(dateA)
            : dateA.compareTo(dateB);
      });
    } else if (_sortBy == 'tanggal_kadaluarsa') {
      filteredItems.sort((a, b) {
        DateTime dateA = a['tanggal_kadaluarsa'] != '-'
            ? DateTime.parse(a['tanggal_kadaluarsa'])
            : DateTime(1970, 1, 1);
        DateTime dateB = b['tanggal_kadaluarsa'] != '-'
            ? DateTime.parse(b['tanggal_kadaluarsa'])
            : DateTime(1970, 1, 1);
        return _sortOrder == 'asc'
            ? dateA.compareTo(dateB)
            : dateB.compareTo(dateA);
      });
    }
    return filteredItems;
  }

  @override
  void dispose() {
    _searchController.dispose();
    _animationController?.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  // --- BAGIAN UTAMA YANG DIPERBAIKI ---
  @override
  Widget build(BuildContext context) {
    const oliveGreen = Color(0xFF7A7C52);

    // MODIFIKASI: Deteksi Keyboard
    final bool isKeyboardOpen = MediaQuery.of(context).viewInsets.bottom > 0;

    final bottomNavBarHeight = MediaQuery.of(context).padding.bottom + 56.0;

    return LayoutBuilder(
      builder: (context, constraints) {
        return Container(
          color: Colors.white,
          child: Stack(
            children: [
              CustomScrollView(
                controller: _scrollController,
                slivers: [
                  SliverAppBar(
                    pinned: true,
                    floating: false,
                    elevation: 8,
                    backgroundColor: Colors.transparent,
                    // MODIFIKASI: Tinggi header fix (kecil) saat keyboard muncul
                    expandedHeight: isKeyboardOpen
                        ? 120.0 // Tinggi cukup untuk search bar saja
                        : (_isScrolled
                            ? constraints.maxHeight * 0.05
                            : constraints.maxHeight * 0.22),
                    flexibleSpace: FlexibleSpaceBar(
                      background: AnimatedBuilder(
                        animation: _animationController!,
                        builder: (context, child) {
                          // MODIFIKASI: Tinggi background menyesuaikan
                          final double headerHeight = isKeyboardOpen
                              ? 120.0
                              : (_isScrolled
                                  ? constraints.maxHeight * 0.1
                                  : constraints.maxHeight * 0.22);

                          return ClipRRect(
                            borderRadius: const BorderRadius.only(
                              bottomLeft: Radius.circular(25),
                              bottomRight: Radius.circular(25),
                            ),
                            child: Container(
                              height: headerHeight,
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
                              ),
                              child: Stack(
                                children: [
                                  // Hiasan Lingkaran (Tetap ada)
                                  Positioned(
                                    top: -constraints.maxWidth * 0.15,
                                    right: -constraints.maxWidth * 0.15,
                                    child: Container(
                                      width: constraints.maxWidth * 0.4,
                                      height: constraints.maxWidth * 0.4,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: Colors.white.withOpacity(0.05),
                                      ),
                                    ),
                                  ),
                                  Positioned(
                                    bottom: -constraints.maxWidth * 0.1,
                                    left: -constraints.maxWidth * 0.1,
                                    child: Container(
                                      width: constraints.maxWidth * 0.3,
                                      height: constraints.maxWidth * 0.3,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: Colors.white.withOpacity(0.03),
                                      ),
                                    ),
                                  ),

                                  // Konten Header Utama
                                  SafeArea(
                                    child: Padding(
                                      padding: EdgeInsets.all(_isScrolled
                                          ? constraints.maxWidth * 0.03
                                          : constraints.maxWidth * 0.045),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          // MODIFIKASI: Sembunyikan Judul & Subtitle saat Keyboard Muncul
                                          if (!isKeyboardOpen) ...[
                                            Row(
                                              children: [
                                                Expanded(
                                                  child: Column(
                                                    crossAxisAlignment:
                                                        CrossAxisAlignment
                                                            .start,
                                                    children: [
                                                      FadeInDown(
                                                        duration:
                                                            const Duration(
                                                                milliseconds:
                                                                    800),
                                                        child: LayoutBuilder(
                                                          builder: (context,
                                                              textConstraints) {
                                                            double
                                                                availableWidth =
                                                                textConstraints
                                                                    .maxWidth;
                                                            String displayText =
                                                                _getDisplayText(
                                                                    availableWidth,
                                                                    _isScrolled);
                                                            double fontSize =
                                                                _getFontSize(
                                                                    _isScrolled,
                                                                    availableWidth,
                                                                    constraints
                                                                        .maxWidth);
                                                            return Text(
                                                              displayText,
                                                              style: TextStyle(
                                                                color: Colors
                                                                    .white,
                                                                fontSize:
                                                                    fontSize,
                                                                fontWeight:
                                                                    FontWeight
                                                                        .bold,
                                                                height: 1.2,
                                                              ),
                                                              maxLines:
                                                                  _isScrolled
                                                                      ? 1
                                                                      : 2,
                                                              overflow:
                                                                  TextOverflow
                                                                      .ellipsis,
                                                              softWrap: true,
                                                            );
                                                          },
                                                        ),
                                                      ),
                                                      if (!_isScrolled) ...[
                                                        SizedBox(
                                                            height: constraints
                                                                    .maxHeight *
                                                                0.01),
                                                        FadeInDown(
                                                          duration:
                                                              const Duration(
                                                                  milliseconds:
                                                                      900),
                                                          child: Text(
                                                            'Lihat barang yang Anda titipkan',
                                                            style: TextStyle(
                                                              color: Colors
                                                                  .white70,
                                                              fontSize: constraints
                                                                      .maxWidth *
                                                                  0.035,
                                                              height: 1.3,
                                                            ),
                                                            maxLines: 2,
                                                            overflow:
                                                                TextOverflow
                                                                    .ellipsis,
                                                          ),
                                                        ),
                                                      ],
                                                    ],
                                                  ),
                                                ),
                                              ],
                                            ),
                                            if (!_isScrolled)
                                              SizedBox(
                                                  height:
                                                      constraints.maxHeight *
                                                          0.02),
                                          ],

                                          // Search Bar (Selalu Muncul)
                                          FadeInUp(
                                            duration: const Duration(
                                                milliseconds: 1000),
                                            child: AnimatedContainer(
                                              duration: const Duration(
                                                  milliseconds: 300),
                                              height: _isScrolled
                                                  ? 0
                                                  : (constraints.maxHeight *
                                                              0.06 >
                                                          48
                                                      ? 48
                                                      : constraints.maxHeight *
                                                          0.06),
                                              child: TextField(
                                                controller: _searchController,
                                                decoration: InputDecoration(
                                                  hintText:
                                                      'Cari barang Anda...',
                                                  hintStyle: TextStyle(
                                                    color: Colors.grey,
                                                    fontSize:
                                                        constraints.maxWidth *
                                                            0.035,
                                                  ),
                                                  filled: true,
                                                  fillColor: Colors.white,
                                                  contentPadding:
                                                      EdgeInsets.symmetric(
                                                          horizontal: constraints
                                                                  .maxWidth *
                                                              0.04,
                                                          vertical: constraints
                                                                  .maxHeight *
                                                              0.017),
                                                  prefixIcon: Icon(
                                                    Icons.search,
                                                    color: Colors.grey,
                                                    size: constraints.maxWidth *
                                                        0.055,
                                                  ),
                                                  suffixIcon: _searchQuery
                                                          .isNotEmpty
                                                      ? IconButton(
                                                          icon: Icon(
                                                            Icons.clear,
                                                            color: Colors.grey,
                                                            size: constraints
                                                                    .maxWidth *
                                                                0.05,
                                                          ),
                                                          onPressed: () {
                                                            _searchController
                                                                .clear();
                                                          },
                                                        )
                                                      : null,
                                                  border: OutlineInputBorder(
                                                    borderRadius: BorderRadius
                                                        .circular(_isScrolled
                                                            ? 0
                                                            : constraints
                                                                    .maxWidth *
                                                                0.06),
                                                    borderSide: BorderSide(
                                                      color: Colors.grey
                                                          .withOpacity(0.3),
                                                      width: 1,
                                                    ),
                                                  ),
                                                  enabledBorder:
                                                      OutlineInputBorder(
                                                    borderRadius: BorderRadius
                                                        .circular(_isScrolled
                                                            ? 0
                                                            : constraints
                                                                    .maxWidth *
                                                                0.06),
                                                    borderSide: BorderSide(
                                                      color: Colors.grey
                                                          .withOpacity(0.3),
                                                      width: 1,
                                                    ),
                                                  ),
                                                  focusedBorder:
                                                      OutlineInputBorder(
                                                    borderRadius: BorderRadius
                                                        .circular(_isScrolled
                                                            ? 0
                                                            : constraints
                                                                    .maxWidth *
                                                                0.06),
                                                    borderSide: BorderSide(
                                                      color: oliveGreen,
                                                      width: 2,
                                                    ),
                                                  ),
                                                ),
                                                style: TextStyle(
                                                  color: Colors.black,
                                                  fontSize:
                                                      constraints.maxWidth *
                                                          0.035,
                                                ),
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
                          );
                        },
                      ),
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.fromLTRB(constraints.maxWidth * 0.04,
                          4.0, constraints.maxWidth * 0.04, 0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          FadeInLeft(
                            duration: const Duration(milliseconds: 500),
                            child: Row(
                              children: [
                                Container(
                                  width: 4,
                                  height: 30,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF1A3C34),
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                ),
                                SizedBox(width: constraints.maxWidth * 0.03),
                                Text(
                                  'Barang Titipan Saya',
                                  style: TextStyle(
                                    fontSize:
                                        constraints.maxWidth < 360 ? 18 : 20,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF1A3C34),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const Spacer(),
                                Text(
                                  '${_filteredItems.length} barang',
                                  style: TextStyle(
                                    fontSize:
                                        constraints.maxWidth < 360 ? 11 : 12,
                                    color: Colors.grey,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          _isLoading
                              ? GridView.builder(
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  gridDelegate:
                                      SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount:
                                        constraints.maxWidth < 600 ? 2 : 3,
                                    childAspectRatio:
                                        constraints.maxWidth < 360 ? 0.6 : 0.65,
                                    crossAxisSpacing:
                                        constraints.maxWidth * 0.04,
                                    mainAxisSpacing:
                                        constraints.maxWidth * 0.04,
                                  ),
                                  itemCount: 6,
                                  itemBuilder: (context, index) {
                                    return Shimmer.fromColors(
                                      baseColor: Colors.grey[300]!,
                                      highlightColor: Colors.grey[100]!,
                                      child: Container(
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius:
                                              BorderRadius.circular(12),
                                          boxShadow: [
                                            BoxShadow(
                                              color:
                                                  Colors.black.withOpacity(0.1),
                                              blurRadius: 8,
                                              offset: const Offset(0, 4),
                                            ),
                                          ],
                                        ),
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Container(
                                              height:
                                                  constraints.maxWidth * 0.25,
                                              width: double.infinity,
                                              decoration: const BoxDecoration(
                                                color: Colors.grey,
                                                borderRadius:
                                                    BorderRadius.vertical(
                                                        top: Radius.circular(
                                                            12)),
                                              ),
                                            ),
                                            Padding(
                                              padding: EdgeInsets.all(
                                                  constraints.maxWidth * 0.02),
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  SizedBox(
                                                    height: 16,
                                                    width: 100,
                                                    child: DecoratedBox(
                                                      decoration: BoxDecoration(
                                                        color: Colors.grey,
                                                        borderRadius:
                                                            BorderRadius.all(
                                                                Radius.circular(
                                                                    4)),
                                                      ),
                                                    ),
                                                  ),
                                                  SizedBox(
                                                      height:
                                                          constraints.maxWidth *
                                                              0.01),
                                                  SizedBox(
                                                    height: 12,
                                                    width: 80,
                                                    child: DecoratedBox(
                                                      decoration: BoxDecoration(
                                                        color: Colors.grey,
                                                        borderRadius:
                                                            BorderRadius.all(
                                                                Radius.circular(
                                                                    4)),
                                                      ),
                                                    ),
                                                  ),
                                                  SizedBox(
                                                      height:
                                                          constraints.maxWidth *
                                                              0.01),
                                                  SizedBox(
                                                    height: 12,
                                                    width: 60,
                                                    child: DecoratedBox(
                                                      decoration: BoxDecoration(
                                                        color: Colors.grey,
                                                        borderRadius:
                                                            BorderRadius.all(
                                                                Radius.circular(
                                                                    4)),
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                )
                              : _filteredItems.isEmpty
                                  ? const Center(
                                      child: Text('Tidak ada barang tersedia'))
                                  : GridView.builder(
                                      shrinkWrap: true,
                                      physics:
                                          const NeverScrollableScrollPhysics(),
                                      gridDelegate:
                                          SliverGridDelegateWithFixedCrossAxisCount(
                                        crossAxisCount:
                                            constraints.maxWidth < 600 ? 2 : 3,
                                        childAspectRatio:
                                            constraints.maxWidth < 360
                                                ? 0.6
                                                : 0.65,
                                        crossAxisSpacing:
                                            constraints.maxWidth * 0.04,
                                        mainAxisSpacing:
                                            constraints.maxWidth * 0.04,
                                      ),
                                      itemCount: _filteredItems.length +
                                          (_isFetchingMore ? 2 : 0),
                                      itemBuilder: (context, index) {
                                        if (index >= _filteredItems.length) {
                                          return Shimmer.fromColors(
                                            baseColor: Colors.grey[300]!,
                                            highlightColor: Colors.grey[100]!,
                                            child: Container(
                                              decoration: BoxDecoration(
                                                color: Colors.white,
                                                borderRadius:
                                                    BorderRadius.circular(12),
                                                boxShadow: [
                                                  BoxShadow(
                                                    color: Colors.black
                                                        .withOpacity(0.1),
                                                    blurRadius: 8,
                                                    offset: const Offset(0, 4),
                                                  ),
                                                ],
                                              ),
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Container(
                                                    height:
                                                        constraints.maxWidth *
                                                            0.25,
                                                    width: double.infinity,
                                                    decoration:
                                                        const BoxDecoration(
                                                      color: Colors.grey,
                                                      borderRadius:
                                                          BorderRadius.vertical(
                                                              top: Radius
                                                                  .circular(
                                                                      12)),
                                                    ),
                                                  ),
                                                  Padding(
                                                    padding: EdgeInsets.all(
                                                        constraints.maxWidth *
                                                            0.02),
                                                    child: Column(
                                                      crossAxisAlignment:
                                                          CrossAxisAlignment
                                                              .start,
                                                      children: [
                                                        SizedBox(
                                                          height: 16,
                                                          width: 100,
                                                          child: DecoratedBox(
                                                            decoration:
                                                                BoxDecoration(
                                                              color:
                                                                  Colors.grey,
                                                              borderRadius:
                                                                  BorderRadius
                                                                      .all(Radius
                                                                          .circular(
                                                                              4)),
                                                            ),
                                                          ),
                                                        ),
                                                        SizedBox(
                                                            height: constraints
                                                                    .maxWidth *
                                                                0.01),
                                                        SizedBox(
                                                          height: 12,
                                                          width: 80,
                                                          child: DecoratedBox(
                                                            decoration:
                                                                BoxDecoration(
                                                              color:
                                                                  Colors.grey,
                                                              borderRadius:
                                                                  BorderRadius
                                                                      .all(Radius
                                                                          .circular(
                                                                              4)),
                                                            ),
                                                          ),
                                                        ),
                                                        SizedBox(
                                                            height: constraints
                                                                    .maxWidth *
                                                                0.01),
                                                        SizedBox(
                                                          height: 12,
                                                          width: 60,
                                                          child: DecoratedBox(
                                                            decoration:
                                                                BoxDecoration(
                                                              color:
                                                                  Colors.grey,
                                                              borderRadius:
                                                                  BorderRadius
                                                                      .all(Radius
                                                                          .circular(
                                                                              4)),
                                                            ),
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          );
                                        }
                                        final item = _filteredItems[index];
                                        return FadeInUp(
                                          duration: Duration(
                                              milliseconds:
                                                  500 + (index * 100)),
                                          child: ConsignedItemCard(
                                            id: item['kode_produk'].toString(),
                                            title: item['nama'] ??
                                                'Barang Tanpa Nama',
                                            price: _formatRupiah(
                                                item['harga_jual'] ?? 0),
                                            status: item['status'] ?? 'N/A',
                                            images: List<String>.from(
                                                item['images'] ??
                                                    ['/api/placeholder/60/60']),
                                            condition: item['kondisi'] ?? 'N/A',
                                            weight: item['berat']?.toString() ??
                                                'N/A',
                                            warranty:
                                                item['tanggal_garansi'] ?? '-',
                                            description:
                                                item['deskripsi'] ?? '',
                                            tanggalPenitipan:
                                                item['tanggal_penitipan'] ??
                                                    '-',
                                            tanggalKadaluarsa:
                                                item['tanggal_kadaluarsa'] ??
                                                    '-',
                                          ),
                                        );
                                      },
                                    ),
                          SizedBox(height: bottomNavBarHeight + 80),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              Positioned(
                bottom: bottomNavBarHeight + 50,
                right: constraints.maxWidth * 0.04,
                child: ZoomIn(
                  duration: const Duration(milliseconds: 800),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF1A3C34).withOpacity(0.3),
                          blurRadius: 15,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: FloatingActionButton.extended(
                      onPressed: () {
                        _showFilterSortDialog(context);
                      },
                      backgroundColor: oliveGreen,
                      elevation: 0,
                      label: Text(
                        'Filter',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: constraints.maxWidth < 360 ? 14 : 16,
                        ),
                      ),
                      icon: Icon(
                        Icons.tune,
                        color: Colors.white,
                        size: constraints.maxWidth < 360 ? 20 : 24,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  String _formatRupiah(num price) {
    return 'Rp ${NumberFormat("#,##0", "id_ID").format(price)}';
  }

  String _getDisplayText(double availableWidth, bool isScrolled) {
    if (isScrolled) {
      return availableWidth < 250 ? 'Barang Saya' : 'Barang Titipan';
    } else {
      if (availableWidth < 280) {
        return 'Barang Titipan\nSaya';
      } else {
        return 'Barang Titipan Saya';
      }
    }
  }

  double _getFontSize(
      bool isScrolled, double availableWidth, double screenWidth) {
    if (isScrolled) {
      return availableWidth < 250 ? screenWidth * 0.035 : screenWidth * 0.04;
    } else {
      return availableWidth < 280 ? screenWidth * 0.05 : screenWidth * 0.05;
    }
  }

  void _showFilterSortDialog(BuildContext context) {
    final size = MediaQuery.of(context).size;
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
                'Filter & Sort',
                style: TextStyle(
                  fontSize: size.width * 0.045,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1A3C34),
                ),
              ),
              SizedBox(height: size.height * 0.02),
              ListTile(
                leading: Icon(Icons.sort,
                    color: const Color(0xFF1A3C34), size: size.width * 0.05),
                title: Text(
                  'Tanggal Penitipan: Terbaru',
                  style: TextStyle(fontSize: size.width * 0.035),
                ),
                onTap: () {
                  setState(() {
                    _sortBy = 'tanggal_penitipan';
                    _sortOrder = 'desc';
                  });
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: Icon(Icons.sort,
                    color: const Color(0xFF1A3C34), size: size.width * 0.05),
                title: Text(
                  'Tanggal Penitipan: Terlama',
                  style: TextStyle(fontSize: size.width * 0.035),
                ),
                onTap: () {
                  setState(() {
                    _sortBy = 'tanggal_penitipan';
                    _sortOrder = 'asc';
                  });
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: Icon(Icons.sort,
                    color: const Color(0xFF1A3C34), size: size.width * 0.05),
                title: Text(
                  'Tanggal Kadaluarsa: Terdekat',
                  style: TextStyle(fontSize: size.width * 0.035),
                ),
                onTap: () {
                  setState(() {
                    _sortBy = 'tanggal_kadaluarsa';
                    _sortOrder = 'asc';
                  });
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: Icon(Icons.sort,
                    color: const Color(0xFF1A3C34), size: size.width * 0.05),
                title: Text(
                  'Tanggal Kadaluarsa: Terjauh',
                  style: TextStyle(fontSize: size.width * 0.035),
                ),
                onTap: () {
                  setState(() {
                    _sortBy = 'tanggal_kadaluarsa';
                    _sortOrder = 'desc';
                  });
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: Icon(Icons.filter_alt,
                    color: const Color(0xFF1A3C34), size: size.width * 0.05),
                title: Text(
                  'Filter by Status',
                  style: TextStyle(fontSize: size.width * 0.035),
                ),
                onTap: () {
                  Navigator.pop(context);
                  _showStatusFilterDialog(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _showStatusFilterDialog(BuildContext context) {
    final size = MediaQuery.of(context).size;
    showModalBottomSheet(
      context: context,
      shape: RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(size.width * 0.05)),
      ),
      builder: (context) {
        return SingleChildScrollView(
          child: Container(
            padding: EdgeInsets.all(size.width * 0.04),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Filter by Status',
                  style: TextStyle(
                    fontSize: size.width * 0.045,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF5A5D3A),
                  ),
                ),
                SizedBox(height: size.height * 0.02),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        icon: Icon(Icons.clear,
                            color: const Color(0xFF5A5D3A),
                            size: size.width * 0.05),
                        label: Text(
                          'Clear Filter',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF5A5D3A),
                            fontSize: size.width * 0.035,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: const Color(0xFF5A5D3A),
                          elevation: 0,
                          side: const BorderSide(color: Color(0xFF5A5D3A)),
                          shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(size.width * 0.02),
                          ),
                        ),
                        onPressed: () {
                          setState(() {
                            _selectedStatus = null;
                          });
                          Navigator.pop(context);
                        },
                      ),
                    ),
                    SizedBox(width: size.width * 0.02),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF5A5D3A),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(size.width * 0.02),
                          ),
                        ),
                        child: Text(
                          'Apply Filter',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                            fontSize: size.width * 0.035,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: size.height * 0.02),
                ...[
                  'Tersedia',
                  'Terjual',
                  'Hangus',
                  'Kadaluarsa',
                  'Telah Didonasikan',
                  'Siap Diambil Kembali',
                  'Dikembalikan',
                ].map((status) {
                  return CheckboxListTile(
                    title: Text(
                      status,
                      style: TextStyle(fontSize: size.width * 0.035),
                    ),
                    value: _selectedStatus == status ||
                        (_selectedStatus == 'Telah Didonasikan' &&
                            status == 'Didonasikan'),
                    onChanged: (bool? value) {
                      setState(() {
                        if (value == true) {
                          _selectedStatus = status;
                        } else {
                          _selectedStatus = null;
                        }
                      });
                      Navigator.pop(context);
                    },
                  );
                }).toList(),
              ],
            ),
          ),
        );
      },
    );
  }
}

class ConsignedItemCard extends StatefulWidget {
  final String id;
  final String title;
  final String price;
  final String status;
  final List<String> images;
  final String condition;
  final String weight;
  final String warranty;
  final String description;
  final String tanggalPenitipan;
  final String tanggalKadaluarsa;

  const ConsignedItemCard({
    super.key,
    required this.id,
    required this.title,
    required this.price,
    required this.status,
    required this.images,
    required this.condition,
    required this.weight,
    required this.warranty,
    required this.description,
    required this.tanggalPenitipan,
    required this.tanggalKadaluarsa,
  });

  @override
  _ConsignedItemCardState createState() => _ConsignedItemCardState();
}

class _ConsignedItemCardState extends State<ConsignedItemCard> {
  double _scale = 1.0;

  void _onTapDown(TapDownDetails details) {
    setState(() => _scale = 0.95);
  }

  void _onTapUp(TapUpDetails details) {
    setState(() => _scale = 1.0);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ConsignedItemDetailScreen(
          id: widget.id,
          title: widget.title,
          price: widget.price,
          status: widget.status,
          images: widget.images,
          description: widget.description,
          condition: widget.condition,
          weight: widget.weight,
          tanggalPenitipan: widget.tanggalPenitipan,
          tanggalKadaluarsa: widget.tanggalKadaluarsa,
          rating: null, // Rating fetched from API
        ),
      ),
    );
  }

  void _onTapCancel() {
    setState(() => _scale = 1.0);
  }

  Color getStatusColor() {
    switch (widget.status) {
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

  String _formatDate(String dateString) {
    if (dateString == '-') {
      return 'N/A';
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
  Widget build(BuildContext context) {
    final imageUrl = widget.images.isNotEmpty && widget.images[0].isNotEmpty
        ? widget.images[0]
        : '/api/placeholder/60/60';
    return LayoutBuilder(
      builder: (context, constraints) {
        return GestureDetector(
          onTapDown: _onTapDown,
          onTapUp: _onTapUp,
          onTapCancel: _onTapCancel,
          child: AnimatedScale(
            scale: _scale,
            duration: const Duration(milliseconds: 200),
            child: Card(
              elevation: 10,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Hero(
                    tag: 'consignedItemImage${widget.id}_0',
                    child: ClipRRect(
                      borderRadius:
                          const BorderRadius.vertical(top: Radius.circular(16)),
                      child: CachedNetworkImage(
                        imageUrl: imageUrl,
                        height: constraints.maxWidth * 0.8,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Shimmer.fromColors(
                          baseColor: Colors.grey[300]!,
                          highlightColor: Colors.grey[100]!,
                          child: Container(color: Colors.grey),
                        ),
                        errorWidget: (context, url, error) {
                          print('Image Load Error for $url: $error');
                          return Image.asset(
                            'assets/images/placeholder.png',
                            height: constraints.maxWidth * 0.8,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          );
                        },
                      ),
                    ),
                  ),
                  Padding(
                    padding: EdgeInsets.all(constraints.maxWidth * 0.04),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.title,
                          style: TextStyle(
                            fontSize: constraints.maxWidth < 360 ? 12 : 14,
                            fontWeight: FontWeight.w600,
                            color: Colors.black87,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        SizedBox(height: constraints.maxWidth * 0.01),
                        Text(
                          widget.price,
                          style: TextStyle(
                            fontSize: constraints.maxWidth < 360 ? 11 : 12,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF1A3C34),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        SizedBox(height: constraints.maxWidth * 0.01),
                        Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: constraints.maxWidth * 0.04,
                            vertical: constraints.maxWidth * 0.02,
                          ),
                          decoration: BoxDecoration(
                            color: getStatusColor(),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            widget.status,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: constraints.maxWidth < 360 ? 9 : 10,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        SizedBox(height: constraints.maxWidth * 0.01),
                        Text(
                          'Penitipan: ${_formatDate(widget.tanggalPenitipan)}',
                          style: TextStyle(
                            fontSize: constraints.maxWidth < 360 ? 9 : 10,
                            color: Colors.grey,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        SizedBox(height: constraints.maxWidth * 0.01),
                        Text(
                          'Kadaluarsa: ${_formatDate(widget.tanggalKadaluarsa)}',
                          style: TextStyle(
                            fontSize: constraints.maxWidth < 360 ? 9 : 10,
                            color: Colors.grey,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
