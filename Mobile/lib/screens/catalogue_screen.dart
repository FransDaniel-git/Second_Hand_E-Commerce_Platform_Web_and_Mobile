import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:shimmer/shimmer.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'product_detail.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:intl/intl.dart';

const String baseUrl = 'http://10.0.2.2:8000/api';

class CatalogueScreen extends StatefulWidget {
  final String? selectedCategory;

  const CatalogueScreen({super.key, this.selectedCategory});

  @override
  _CatalogueScreenState createState() => _CatalogueScreenState();
}

class _CatalogueScreenState extends State<CatalogueScreen>
    with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  AnimationController? _animationController;
  Animation<double>? _fadeAnimation;
  Animation<Offset>? _slideAnimation;
  ScrollController _scrollController = ScrollController();
  bool _isScrolled = false;
  List<dynamic> _products = [];
  List<dynamic> _categories = [];
  Map<String, Set<String>> _selectedSubcategories = {};
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
      if (mounted) {
        setState(() {
          _isScrolled = _scrollController.offset > 50;
        });
      }
    });

    _fetchCategories().then((_) {
      if (widget.selectedCategory != null) {
        _applySelectedCategory();
      } else {
        _fetchProducts();
      }
    });

    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text;
        _isLoading = true;
      });
      _fetchProducts(search: _searchQuery);
    });
  }

  Future<void> _applySelectedCategory() async {
    final selectedCat = widget.selectedCategory;
    if (selectedCat == null || _categories.isEmpty) return;

    final category = _categories.firstWhere(
      (cat) => cat['NAMA'] == selectedCat,
      orElse: () => null,
    );

    if (category != null && category['subcategories'] != null) {
      setState(() {
        _selectedSubcategories[selectedCat] =
            Set<String>.from(category['subcategories']);
        _isLoading = true;
      });

      List<String> filters = category['subcategories']
          .map((sub) => '$selectedCat:$sub')
          .toList()
          .cast<String>();
      await _fetchProducts(subcategories: filters);

      if (mounted) {
        // Show filter dialog with pre-selected category
        _showCategoryFilterDialog(context, autoApply: false);
      }
    }
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

  Future<void> _fetchCategories() async {
    if (!await _checkConnectivity()) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Tidak ada koneksi internet'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return;
    }

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/categories'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        var jsonResponse = json.decode(response.body);
        if (jsonResponse['success'] && jsonResponse['data'] is List) {
          List<dynamic> categories = jsonResponse['data'];
          for (var category in categories) {
            final subResponse = await http.get(
              Uri.parse(
                  '$baseUrl/categories/${category['ID_KATEGORI']}/subcategories'),
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
            );
            if (subResponse.statusCode == 200) {
              var subJson = json.decode(subResponse.body);
              if (subJson['success'] && subJson['data'] is List) {
                category['subcategories'] =
                    subJson['data'].map((sub) => sub['NAMASUB']).toList();
              } else {
                category['subcategories'] = [];
              }
            } else {
              category['subcategories'] = [];
            }
            category['icon'] = Icons.category;
          }
          if (mounted) {
            setState(() {
              _categories = categories;
            });
          }
        } else {
          throw Exception('Unexpected response format: ${response.body}');
        }
      } else {
        throw Exception('Failed to load categories: ${response.statusCode}');
      }
    } catch (e) {
      print('Fetch Categories Error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal memuat kategori: $e')),
        );
      }
    }
  }

  Future<void> _fetchProducts(
      {List<String>? subcategories, String? search}) async {
    const maxRetries = 3;
    const retryDelay = Duration(seconds: 2);
    int attempt = 0;

    if (!await _checkConnectivity()) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Tidak ada koneksi internet'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return;
    }

    while (attempt < maxRetries) {
      try {
        var uri = Uri.parse('$baseUrl/products/mobile');
        Map<String, dynamic> queryParams = {};
        if (subcategories != null && subcategories.isNotEmpty) {
          queryParams['subcategories[]'] = subcategories;
        }
        if (search != null && search.isNotEmpty) {
          queryParams['search'] = search;
        }
        if (queryParams.isNotEmpty) {
          uri = uri.replace(queryParameters: queryParams);
        }

        print('Fetching products with query: $uri');
        final response = await http.get(
          uri,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        ).timeout(const Duration(seconds: 30));

        if (response.statusCode == 200) {
          var jsonResponse = json.decode(response.body);
          if (jsonResponse['success'] && jsonResponse['data'] is List) {
            if (mounted) {
              setState(() {
                _products = jsonResponse['data'].map((product) {
                  product['image'] =
                      product['image'] != '/api/placeholder/60/60'
                          ? '$baseUrl/products/${product['id']}/thumbnail'
                          : '/api/placeholder/60/60';
                  return {
                    ...product,
                    'images': [product['image']],
                  };
                }).toList();
                _isLoading = false;
              });
            }
            return;
          } else {
            throw Exception('Unexpected response format: ${response.body}');
          }
        } else {
          throw Exception('Failed to load products: ${response.statusCode}');
        }
      } catch (e) {
        print('Fetch Products Error: $e');
        attempt++;
        if (attempt == maxRetries) {
          if (mounted) {
            setState(() {
              _isLoading = false;
            });
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Gagal memuat produk: $e')),
            );
          }
          return;
        }
        await Future.delayed(retryDelay);
      }
    }
  }

  List<dynamic> get _filteredProducts {
    return _products;
  }

  @override
  void dispose() {
    _searchController.dispose();
    _animationController?.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const oliveGreen = Color(0xFF7A7C52);
    final size = MediaQuery.of(context).size;
    final double bottomPadding =
        size.height * 0.15 > 100 ? 100 : size.height * 0.15;

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
                expandedHeight:
                    _isScrolled ? size.height * 0.05 : size.height * 0.22,
                flexibleSpace: FlexibleSpaceBar(
                  background: AnimatedBuilder(
                    animation: _animationController!,
                    builder: (context, child) {
                      final double headerHeight =
                          _isScrolled ? size.height * 0.1 : size.height * 0.22;
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
                              Positioned(
                                top: -size.width * 0.15,
                                right: -size.width * 0.15,
                                child: Container(
                                  width: size.width * 0.4,
                                  height: size.width * 0.4,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Colors.white.withOpacity(0.05),
                                  ),
                                ),
                              ),
                              Positioned(
                                bottom: -size.width * 0.1,
                                left: -size.width * 0.1,
                                child: Container(
                                  width: size.width * 0.3,
                                  height: size.width * 0.3,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Colors.white.withOpacity(0.03),
                                  ),
                                ),
                              ),
                              SafeArea(
                                child: Padding(
                                  padding: EdgeInsets.all(_isScrolled
                                      ? size.width * 0.03
                                      : size.width * 0.045),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                FadeInDown(
                                                  duration: const Duration(
                                                      milliseconds: 800),
                                                  child: LayoutBuilder(
                                                    builder:
                                                        (context, constraints) {
                                                      double availableWidth =
                                                          constraints.maxWidth;
                                                      String displayText =
                                                          _getDisplayText(
                                                              availableWidth,
                                                              _isScrolled);
                                                      double fontSize =
                                                          _getFontSize(
                                                              _isScrolled,
                                                              availableWidth,
                                                              size);

                                                      return Padding(
                                                        padding: EdgeInsets.only(
                                                            left: size.width *
                                                                0.03), // Tambahkan padding kiri di sini
                                                        child: Text(
                                                          displayText,
                                                          style: TextStyle(
                                                            color: Colors.white,
                                                            fontSize: fontSize,
                                                            fontWeight:
                                                                FontWeight.bold,
                                                            height: 1.2,
                                                          ),
                                                          maxLines: _isScrolled
                                                              ? 1
                                                              : 2,
                                                          overflow: TextOverflow
                                                              .ellipsis,
                                                          softWrap: true,
                                                        ),
                                                      );
                                                    },
                                                  ),
                                                ),
                                                if (!_isScrolled) ...[
                                                  SizedBox(
                                                      height:
                                                          size.height * 0.01),
                                                  FadeInDown(
                                                    duration: const Duration(
                                                        milliseconds: 900),
                                                    child: Padding(
                                                      padding: EdgeInsets.only(
                                                          left: size.width *
                                                              0.03), // Samakan dengan header
                                                      child: Text(
                                                        'Temukan produk preloved berkualitas dengan harga terjangkau',
                                                        style: TextStyle(
                                                          color: Colors.white70,
                                                          fontSize: size.width *
                                                              0.035,
                                                          height: 1.3,
                                                        ),
                                                        maxLines: 2,
                                                        overflow: TextOverflow
                                                            .ellipsis,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                      if (!_isScrolled) ...[
                                        SizedBox(height: size.height * 0.02),
                                        FadeInUp(
                                          duration: const Duration(
                                              milliseconds: 1000),
                                          child: AnimatedContainer(
                                            duration: const Duration(
                                                milliseconds: 300),
                                            height: _isScrolled
                                                ? 0
                                                : (size.height * 0.06 > 48
                                                    ? 48
                                                    : size.height * 0.06),
                                            child: TextField(
                                              controller: _searchController,
                                              decoration: InputDecoration(
                                                hintText:
                                                    'Cari produk impianmu...',
                                                hintStyle: TextStyle(
                                                  color: Colors.grey,
                                                  fontSize: size.width * 0.035,
                                                ),
                                                filled: true,
                                                fillColor: Colors.white,
                                                contentPadding:
                                                    EdgeInsets.symmetric(
                                                        horizontal:
                                                            size.width * 0.04,
                                                        vertical: size.height *
                                                            0.017),
                                                prefixIcon: Icon(
                                                  Icons.search,
                                                  color: Colors.grey,
                                                  size: size.width * 0.055,
                                                ),
                                                suffixIcon: _searchQuery
                                                        .isNotEmpty
                                                    ? IconButton(
                                                        icon: Icon(
                                                          Icons.clear,
                                                          color: Colors.grey,
                                                          size:
                                                              size.width * 0.05,
                                                        ),
                                                        onPressed: () {
                                                          _searchController
                                                              .clear();
                                                        },
                                                      )
                                                    : null,
                                                border: OutlineInputBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          _isScrolled
                                                              ? 0
                                                              : size.width *
                                                                  0.06),
                                                  borderSide: BorderSide(
                                                    color: Colors.grey
                                                        .withOpacity(0.3),
                                                    width: 1,
                                                  ),
                                                ),
                                                enabledBorder:
                                                    OutlineInputBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          _isScrolled
                                                              ? 0
                                                              : size.width *
                                                                  0.06),
                                                  borderSide: BorderSide(
                                                    color: Colors.grey
                                                        .withOpacity(0.3),
                                                    width: 1,
                                                  ),
                                                ),
                                                focusedBorder:
                                                    OutlineInputBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          _isScrolled
                                                              ? 0
                                                              : size.width *
                                                                  0.06),
                                                  borderSide: BorderSide(
                                                    color: oliveGreen,
                                                    width: 2,
                                                  ),
                                                ),
                                              ),
                                              style: TextStyle(
                                                color: Colors.black,
                                                fontSize: size.width * 0.035,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
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
                  padding: EdgeInsets.fromLTRB(size.width * 0.04,
                      size.height * 0.015, size.width * 0.04, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      FadeInLeft(
                        duration: const Duration(milliseconds: 500),
                        child: Row(
                          children: [
                            Container(
                              width: 4,
                              height: size.height * 0.04,
                              decoration: BoxDecoration(
                                color: const Color(0xFF1A3C34),
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                            SizedBox(width: size.width * 0.03),
                            Text(
                              'Katalog Produk',
                              style: TextStyle(
                                fontSize: size.width * 0.05,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF1A3C34),
                              ),
                            ),
                            const Spacer(),
                            Text(
                              '${_filteredProducts.length} produk',
                              style: TextStyle(
                                fontSize: size.width * 0.03,
                                color: Colors.grey,
                              ),
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
                                crossAxisCount: size.width > 600 ? 3 : 2,
                                childAspectRatio: size.width > 600 ? 0.8 : 0.75,
                                crossAxisSpacing: size.width * 0.02,
                                mainAxisSpacing: size.width * 0.02,
                              ),
                              itemCount: 6,
                              itemBuilder: (context, index) {
                                return Shimmer.fromColors(
                                  baseColor: Colors.grey[300]!,
                                  highlightColor: Colors.grey[100]!,
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(
                                          size.width * 0.03),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.1),
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
                                          height: size.width * 0.25,
                                          width: double.infinity,
                                          decoration: BoxDecoration(
                                            color: Colors.grey,
                                            borderRadius: BorderRadius.vertical(
                                                top: Radius.circular(
                                                    size.width * 0.03)),
                                          ),
                                        ),
                                        Padding(
                                          padding:
                                              EdgeInsets.all(size.width * 0.02),
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              SizedBox(
                                                height: size.width * 0.04,
                                                width: size.width * 0.25,
                                                child: DecoratedBox(
                                                  decoration: BoxDecoration(
                                                    color: Colors.grey,
                                                    borderRadius:
                                                        BorderRadius.all(
                                                            Radius.circular(4)),
                                                  ),
                                                ),
                                              ),
                                              SizedBox(
                                                  height: size.width * 0.01),
                                              SizedBox(
                                                height: size.width * 0.03,
                                                width: size.width * 0.2,
                                                child: DecoratedBox(
                                                  decoration: BoxDecoration(
                                                    color: Colors.grey,
                                                    borderRadius:
                                                        BorderRadius.all(
                                                            Radius.circular(4)),
                                                  ),
                                                ),
                                              ),
                                              SizedBox(
                                                  height: size.width * 0.01),
                                              SizedBox(
                                                height: size.width * 0.03,
                                                width: size.width * 0.15,
                                                child: DecoratedBox(
                                                  decoration: BoxDecoration(
                                                    color: Colors.grey,
                                                    borderRadius:
                                                        BorderRadius.all(
                                                            Radius.circular(4)),
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
                          : _filteredProducts.isEmpty
                              ? const Center(
                                  child: Text('Tidak ada produk tersedia'))
                              : GridView.builder(
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  gridDelegate:
                                      SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: size.width > 600 ? 3 : 2,
                                    childAspectRatio:
                                        size.width > 600 ? 0.8 : 0.75,
                                    crossAxisSpacing: size.width * 0.04,
                                    mainAxisSpacing: size.width * 0.04,
                                  ),
                                  itemCount: _filteredProducts.length,
                                  itemBuilder: (context, index) {
                                    final product = _filteredProducts[index];
                                    return FadeInUp(
                                      duration: Duration(
                                          milliseconds: 500 + (index * 100)),
                                      child: ProductCard(
                                        id: product['id'].toString(),
                                        title: product['name'] ??
                                            'Produk Tanpa Nama',
                                        subcategory:
                                            product['subcategory'] ?? '',
                                        price: _formatRupiah(
                                            product['price'] ?? 0),
                                        condition:
                                            product['condition'] ?? 'N/A',
                                        weight: product['weight']?.toString() ??
                                            'N/A',
                                        warranty:
                                            product['warranty_date'] ?? '-',
                                        description:
                                            product['description'] ?? '',
                                        images: List<String>.from(
                                            product['images'] ?? ['']),
                                      ),
                                    );
                                  },
                                ),
                      SizedBox(height: bottomPadding),
                    ],
                  ),
                ),
              ),
            ],
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
                  onPressed: () {
                    _showFilterSortDialog(context);
                  },
                  backgroundColor: const Color(0xFF5A5D3A),
                  elevation: 0,
                  label: Text(
                    'Filter',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: size.width * 0.035,
                    ),
                  ),
                  icon: Icon(Icons.tune,
                      color: Colors.white, size: size.width * 0.05),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatRupiah(num price) {
    return 'Rp ${NumberFormat("#,##0", "id_ID").format(price)}';
  }

  String _getDisplayText(double availableWidth, bool isScrolled) {
    if (isScrolled) {
      return availableWidth < 250 ? 'Jelajahi Barang' : 'Jelajahi Barang Bekas';
    } else {
      if (availableWidth < 280) {
        return 'Jelajahi Barang\nBekas Terbaik';
      } else {
        return 'Jelajahi Barang Bekas Terbaik';
      }
    }
  }

  double _getFontSize(bool isScrolled, double availableWidth, Size size) {
    if (isScrolled) {
      return availableWidth < 250
          ? size.width * 0.035
          : size.width * 0.04; // Responsive font
    } else {
      if (availableWidth < 280) {
        return size.width * 0.05;
      } else {
        return size.width * 0.05;
      }
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
                  fontSize: size.width * 0.045, // Responsive font
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1A3C34),
                ),
              ),
              SizedBox(height: size.height * 0.02),
              ListTile(
                leading: Icon(Icons.sort,
                    color: const Color(0xFF1A3C34),
                    size: size.width * 0.05), // Responsive icon
                title: Text(
                  'Sort by Price: Low to High',
                  style: TextStyle(
                      fontSize: size.width * 0.035), // Responsive font
                ),
                onTap: () {
                  if (mounted) {
                    setState(() {
                      _products.sort((a, b) =>
                          (a['price'] ?? 0).compareTo(b['price'] ?? 0));
                    });
                  }
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: Icon(Icons.sort,
                    color: const Color(0xFF1A3C34), size: size.width * 0.05),
                title: Text(
                  'Sort by Price: High to Low',
                  style: TextStyle(fontSize: size.width * 0.035),
                ),
                onTap: () {
                  if (mounted) {
                    setState(() {
                      _products.sort((a, b) =>
                          (b['price'] ?? 0).compareTo(a['price'] ?? 0));
                    });
                  }
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: Icon(Icons.filter_alt,
                    color: const Color(0xFF1A3C34), size: size.width * 0.05),
                title: Text(
                  'Filter by Category',
                  style: TextStyle(fontSize: size.width * 0.035),
                ),
                onTap: () {
                  Navigator.pop(context);
                  _showCategoryFilterDialog(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _showCategoryFilterDialog(BuildContext context,
      {bool autoApply = true}) {
    final size = MediaQuery.of(context).size;
    Map<String, Set<String>> localSelected = {};
    _selectedSubcategories.forEach((cat, subs) {
      localSelected[cat] = Set.from(subs);
    });

    showModalBottomSheet(
      context: context,
      shape: RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(size.width * 0.05)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return SingleChildScrollView(
              child: Container(
                padding: EdgeInsets.all(size.width * 0.04),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Filter by Category',
                      style: TextStyle(
                        fontSize: size.width * 0.045, // Responsive font
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
                                size: size.width * 0.05), // Responsive icon
                            label: Text(
                              'Clear Filter',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF5A5D3A),
                                fontSize: size.width * 0.035, // Responsive font
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
                              setStateDialog(() {
                                localSelected.clear();
                              });
                              if (mounted) {
                                setState(() {
                                  _selectedSubcategories = {};
                                  _isLoading = true;
                                });
                              }
                              _fetchProducts();
                              Navigator.pop(context);
                            },
                          ),
                        ),
                        SizedBox(width: size.width * 0.02),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              List<String> filters = [];
                              localSelected.forEach((cat, subs) {
                                for (var sub in subs) {
                                  filters.add('$cat:$sub');
                                }
                              });
                              if (mounted) {
                                setState(() {
                                  _selectedSubcategories = localSelected;
                                  _isLoading = true;
                                });
                              }
                              _fetchProducts(subcategories: filters);
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
                                fontSize: size.width * 0.035, // Responsive font
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: size.height * 0.02),
                    ..._categories.map((category) {
                      String catName = category['NAMA'];
                      List<String> subcats =
                          List<String>.from(category['subcategories']);
                      bool isAllSelected = subcats.isNotEmpty &&
                          subcats.every((sub) =>
                              localSelected[catName]?.contains(sub) ?? false);
                      return ExpansionTile(
                        leading: Checkbox(
                          value: isAllSelected,
                          onChanged: (bool? value) {
                            setStateDialog(() {
                              if (value == true) {
                                localSelected[catName] = Set.from(subcats);
                              } else {
                                localSelected[catName] = {};
                              }
                            });
                          },
                        ),
                        title: Text(
                          catName,
                          style: TextStyle(
                              fontSize: size.width * 0.035), // Responsive font
                        ),
                        children: subcats.map((subcategory) {
                          return CheckboxListTile(
                            title: Text(
                              subcategory,
                              style: TextStyle(
                                  fontSize:
                                      size.width * 0.03), // Responsive font
                            ),
                            value:
                                localSelected[catName]?.contains(subcategory) ??
                                    false,
                            onChanged: (bool? value) {
                              setStateDialog(() {
                                if (value == true) {
                                  localSelected[catName] ??= {};
                                  localSelected[catName]!.add(subcategory);
                                } else {
                                  localSelected[catName]?.remove(subcategory);
                                }
                              });
                            },
                          );
                        }).toList(),
                      );
                    }).toList(),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class ProductCard extends StatefulWidget {
  final String id;
  final String title;
  final String subcategory;
  final String price;
  final String condition;
  final String weight;
  final String warranty;
  final String description;
  final List<String> images;

  const ProductCard({
    super.key,
    required this.id,
    required this.title,
    required this.subcategory,
    required this.price,
    required this.condition,
    required this.weight,
    required this.warranty,
    required this.description,
    required this.images,
  });

  @override
  _ProductCardState createState() => _ProductCardState();
}

class _ProductCardState extends State<ProductCard> {
  double _scale = 1.0;

  void _onTapDown(TapDownDetails details) {
    setState(() {
      _scale = 0.95;
    });
  }

  void _onTapUp(TapUpDetails details) {
    setState(() {
      _scale = 1.0;
    });
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProductDetailScreen(productId: widget.id),
      ),
    );
  }

  void _onTapCancel() {
    setState(() {
      _scale = 1.0;
    });
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final imageUrl = widget.images.isNotEmpty && widget.images[0].isNotEmpty
        ? widget.images[0]
        : '/api/placeholder/60/60';
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
              borderRadius: BorderRadius.circular(size.width * 0.04)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Hero(
                tag: 'productImage${widget.id}_0',
                child: ClipRRect(
                  borderRadius: BorderRadius.vertical(
                      top: Radius.circular(size.width * 0.04)),
                  child: CachedNetworkImage(
                    imageUrl: imageUrl,
                    height: size.width * 0.25, // Responsive height
                    width: double.infinity,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Shimmer.fromColors(
                      baseColor: Colors.grey[300]!,
                      highlightColor: Colors.grey[100]!,
                      child: Container(
                        color: Colors.grey,
                      ),
                    ),
                    errorWidget: (context, url, error) {
                      print('Image Load Error for $url: $error');
                      return Image.asset(
                        'assets/images/placeholder.png',
                        height: size.width * 0.25,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      );
                    },
                  ),
                ),
              ),
              Padding(
                padding: EdgeInsets.all(size.width * 0.02),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.title,
                      style: TextStyle(
                        fontSize: size.width * 0.035, // Responsive font
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: size.width * 0.005),
                    Text(
                      widget.subcategory,
                      style: TextStyle(
                          fontSize: size.width * 0.025, // Responsive font
                          color: Colors.grey),
                    ),
                    SizedBox(height: size.width * 0.01),
                    Text(
                      widget.price,
                      style: TextStyle(
                        fontSize: size.width * 0.03, // Responsive font
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF1A3C34),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
