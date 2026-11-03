import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:p3l_mobile/screens/penukaran_history.dart';

class MerchandiseListScreen extends StatefulWidget {
  const MerchandiseListScreen({super.key});

  @override
  State<MerchandiseListScreen> createState() => _MerchandiseListScreenState();
}

class _MerchandiseListScreenState extends State<MerchandiseListScreen>
    with TickerProviderStateMixin {
  late AnimationController _headerAnimationController;
  late AnimationController _listAnimationController;
  late Animation<double> _headerSlideAnimation;
  late Animation<double> _headerFadeAnimation;

  int? userPoints;
  List<dynamic> merchandise = [];
  bool _isLoading = true;
  String? _errorMessage;

  // Daftar untuk preload gambar
  List<Future<void>> _imagePreloadFutures = [];

  @override
  void initState() {
    super.initState();
    _headerAnimationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _listAnimationController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _headerSlideAnimation = Tween<double>(
      begin: -100.0,
      end: 0,
    ).animate(CurvedAnimation(
      parent: _headerAnimationController,
      curve: Curves.easeOutBack,
    ));

    _headerFadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _headerAnimationController,
      curve: Curves.easeInOut,
    ));

    _headerAnimationController.forward();
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) _listAnimationController.forward();
    });

    _fetchUserPoints();
    _fetchMerchandise();
  }

  Future<void> _fetchUserPoints() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token == null) {
        setState(() {
          _errorMessage = 'Token tidak ditemukan. Silakan login kembali.';
          _isLoading = false;
        });
        Navigator.pushReplacementNamed(context, '/login');
        return;
      }

      final response = await http.get(
        Uri.parse('http://10.0.2.2:8000/api/auth/profile'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final profileData = jsonDecode(response.body);
        setState(() {
          userPoints = profileData['user']['poin'];
        });
      } else {
        setState(() {
          _errorMessage = 'Gagal memuat poin pengguna.';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchMerchandise() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token == null) {
        setState(() {
          _errorMessage = 'Token tidak ditemukan. Silakan login kembali.';
          _isLoading = false;
        });
        Navigator.pushReplacementNamed(context, '/login');
        return;
      }

      final response = await http.get(
        Uri.parse('http://10.0.2.2:8000/api/merchandise'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          merchandise = data;
          _isLoading = false;
        });

        // Preload semua gambar merchandise
        _preloadAllImages(data);
      } else {
        setState(() {
          _errorMessage = 'Gagal memuat merchandise.';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error: $e';
        _isLoading = false;
      });
    }
  }

  // Preload semua gambar merchandise
  void _preloadAllImages(List<dynamic> merchandiseList) {
    _imagePreloadFutures = merchandiseList.map((item) async {
      final imageUrl = _getOptimizedImageUrl(item['URL_GAMBAR']);
      if (imageUrl != null) {
        try {
          await precacheImage(
            CachedNetworkImageProvider(imageUrl),
            context,
          );
        } catch (e) {
          print('Failed to preload image: $e');
        }
      }
    }).toList();
  }

  // Dapatkan URL gambar yang dioptimasi (mirip dengan CatalogueScreen)
  String? _getOptimizedImageUrl(String? url) {
    if (url == null || url.isEmpty) return null;

    // Pattern sederhana seperti di CatalogueScreen
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url.replaceAll('localhost:8000', '10.0.2.2:8000');
    }

    // Untuk path relatif, asumsikan dari /storage/
    String cleanUrl = url;
    if (cleanUrl.startsWith('storage/')) {
      cleanUrl = cleanUrl.substring(8);
    }

    // Return URL dengan baseUrl yang konsisten
    return 'http://10.0.2.2:8000/storage/$cleanUrl';
  }

  @override
  void dispose() {
    _headerAnimationController.dispose();
    _listAnimationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final baseFontSize =
        size.width < 360 ? size.width * 0.035 : size.width * 0.04;

    if (_isLoading) {
      return Scaffold(
        body: Center(
          child: CircularProgressIndicator(
            color: Color(0xFF77784A),
          ),
        ),
      );
    }

    if (_errorMessage != null) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: EdgeInsets.all(20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.error_outline,
                  color: Colors.red,
                  size: 60,
                ),
                SizedBox(height: 20),
                Text(
                  _errorMessage!,
                  style: TextStyle(
                    fontSize: baseFontSize,
                    color: Colors.red,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () {
                    setState(() {
                      _isLoading = true;
                      _errorMessage = null;
                    });
                    _fetchMerchandise();
                    _fetchUserPoints();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color(0xFF77784A),
                  ),
                  child: Text('Coba Lagi'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.grey[50]!,
              Colors.white,
              Colors.grey[100]!,
            ],
            stops: const [0.0, 0.3, 1.0],
          ),
        ),
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(
              pinned: true,
              floating: false,
              expandedHeight: size.height * 0.22,
              elevation: 8,
              backgroundColor: Colors.transparent,
              leading: Padding(
                padding: EdgeInsets.all(size.width * 0.02),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    color: Color(0xFF7A7C52).withOpacity(0.7),
                  ),
                  child: IconButton(
                    icon: Icon(
                      Icons.arrow_back_ios_new_rounded,
                      color: Colors.white,
                      size: size.width * 0.05,
                    ),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
              ),
              actions: [
                Padding(
                  padding: EdgeInsets.all(size.width * 0.02),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      color: Color(0xFF7A7C52).withOpacity(0.7),
                    ),
                    child: IconButton(
                      icon: Icon(
                        Icons.history,
                        color: Colors.white,
                        size: size.width * 0.05,
                      ),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) =>
                                const PenukaranHistoryScreen(),
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ],
              flexibleSpace: FlexibleSpaceBar(
                background: ClipRRect(
                  borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(25),
                    bottomRight: Radius.circular(25),
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF77784A),
                          const Color(0xFF8B8C5E),
                          const Color(0xFF5A5D3A),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.3),
                          blurRadius: 15,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: SafeArea(
                      child: AnimatedBuilder(
                        animation: _headerFadeAnimation,
                        builder: (context, child) {
                          return Transform.translate(
                            offset:
                                Offset(0, _headerSlideAnimation.value * 0.5),
                            child: Opacity(
                              opacity: _headerFadeAnimation.value,
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  SizedBox(height: size.height * 0.02),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Container(
                                        padding:
                                            EdgeInsets.all(size.width * 0.02),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.2),
                                          borderRadius:
                                              BorderRadius.circular(12),
                                        ),
                                        child: Icon(
                                          Icons.redeem_rounded,
                                          color: Colors.white,
                                          size: baseFontSize * 1.5,
                                        ),
                                      ),
                                      SizedBox(width: size.width * 0.03),
                                      Text(
                                        'Tukar Poin',
                                        style: TextStyle(
                                          fontSize: baseFontSize * 1.5,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                          letterSpacing: 0.5,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                  SizedBox(height: size.height * 0.015),
                                  Container(
                                    padding: EdgeInsets.symmetric(
                                      horizontal: size.width * 0.04,
                                      vertical: size.height * 0.01,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                        color: Colors.white.withOpacity(0.3),
                                        width: 1,
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          Icons.stars_rounded,
                                          color: Colors.amber,
                                          size: baseFontSize * 1.25,
                                        ),
                                        SizedBox(width: size.width * 0.02),
                                        Text(
                                          'Poin Anda: ${userPoints ?? 0}',
                                          style: TextStyle(
                                            fontSize: baseFontSize,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.white,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ),
                                  SizedBox(height: size.height * 0.01),
                                  Text(
                                    'Tukarkan poin dengan merchandise eksklusif',
                                    style: TextStyle(
                                      fontSize: baseFontSize * 0.875,
                                      color: Colors.white.withOpacity(0.8),
                                      letterSpacing: 0.3,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                    textAlign: TextAlign.center,
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ),
              ),
            ),
            SliverPadding(
              padding: EdgeInsets.fromLTRB(
                size.width * 0.04,
                size.height * 0.02,
                size.width * 0.04,
                size.height * 0.02,
              ),
              sliver: merchandise.isEmpty
                  ? SliverToBoxAdapter(
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.shopping_bag_outlined,
                              size: 80,
                              color: Colors.grey[400],
                            ),
                            SizedBox(height: 20),
                            Text(
                              'Tidak ada merchandise tersedia',
                              style: TextStyle(
                                fontSize: baseFontSize,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  : SliverGrid(
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: size.width < 600 ? 2 : 3,
                        crossAxisSpacing: size.width * 0.03,
                        mainAxisSpacing: size.height * 0.015,
                        childAspectRatio: 0.75,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final item = merchandise[index];
                          return FadeInUp(
                            duration:
                                Duration(milliseconds: 300 + (index * 50)),
                            child: OptimizedMerchandiseCard(
                              merchandiseId: item['ID_MERCHANDISE'],
                              productName: item['NAMA'],
                              pointsRequired: item['POIN_DIBUTUHKAN'],
                              stock: item['STOK'],
                              imageUrl: item['URL_GAMBAR'],
                              userPoints: userPoints ?? 0,
                              isPopular: index == 0 || index == 3,
                              onExchangeSuccess: () {
                                _fetchUserPoints();
                                _fetchMerchandise();
                              },
                            ),
                          );
                        },
                        childCount: merchandise.length,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class OptimizedMerchandiseCard extends StatefulWidget {
  final int merchandiseId;
  final String productName;
  final int pointsRequired;
  final int stock;
  final String? imageUrl;
  final int userPoints;
  final bool isPopular;
  final VoidCallback onExchangeSuccess;

  const OptimizedMerchandiseCard({
    super.key,
    required this.merchandiseId,
    required this.productName,
    required this.pointsRequired,
    required this.stock,
    required this.imageUrl,
    required this.userPoints,
    this.isPopular = false,
    required this.onExchangeSuccess,
  });

  @override
  State<OptimizedMerchandiseCard> createState() =>
      _OptimizedMerchandiseCardState();
}

class _OptimizedMerchandiseCardState extends State<OptimizedMerchandiseCard> {
  bool _hasError = false;

  // Fungsi yang disederhanakan seperti di CatalogueScreen
  String? _getOptimizedImageUrl() {
    if (widget.imageUrl == null || widget.imageUrl!.isEmpty) {
      return null;
    }

    final url = widget.imageUrl!;

    // Pattern sederhana:
    // 1. Jika sudah full URL, gunakan langsung (dengan replace localhost)
    // 2. Jika relative path, tambahkan base URL

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url.replaceAll('localhost:8000', '10.0.2.2:8000');
    }

    // Untuk path relatif, asumsikan dari /storage/
    String cleanUrl = url;
    if (cleanUrl.startsWith('storage/')) {
      cleanUrl = cleanUrl.substring(8);
    }

    return 'http://10.0.2.2:8000/storage/$cleanUrl';
  }

  bool get canAfford => widget.userPoints >= widget.pointsRequired;
  bool get inStock => widget.stock > 0;

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final baseFontSize =
        size.width < 360 ? size.width * 0.035 : size.width * 0.04;
    final imageUrl = _getOptimizedImageUrl();

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: widget.isPopular
              ? const Color(0xFF77784A).withOpacity(0.3)
              : const Color(0xFF77784A).withOpacity(0.1),
          width: widget.isPopular ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
          if (widget.isPopular)
            BoxShadow(
              color: const Color(0xFF77784A).withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: canAfford && inStock
              ? () {
                  _showExchangeDialog(context, widget.merchandiseId);
                }
              : null,
          borderRadius: BorderRadius.circular(16),
          child: Stack(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Gambar Section - Dioptimasi
                  Expanded(
                    flex: 3,
                    child: Container(
                      width: double.infinity,
                      margin: EdgeInsets.all(size.width * 0.02),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.grey[100]!,
                            Colors.grey[50]!,
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: const Color(0xFF77784A).withOpacity(0.1),
                          width: 1,
                        ),
                      ),
                      child: Stack(
                        children: [
                          if (imageUrl != null)
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: CachedNetworkImage(
                                imageUrl: imageUrl,
                                fit: BoxFit.cover,
                                width: double.infinity,
                                height: double.infinity,
                                placeholder: (context, url) => Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [
                                        Colors.grey[100]!,
                                        Colors.grey[200]!,
                                      ],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    ),
                                  ),
                                  child: Center(
                                    child: CircularProgressIndicator(
                                      color: Color(0xFF77784A),
                                      strokeWidth: 2,
                                    ),
                                  ),
                                ),
                                errorWidget: (context, url, error) {
                                  return Center(
                                    child: Column(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Icon(
                                          Icons.broken_image_rounded,
                                          color: Colors.grey[400],
                                          size: baseFontSize * 2,
                                        ),
                                        SizedBox(height: 8),
                                        Text(
                                          'Gambar tidak\ntersedia',
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                            fontSize: baseFontSize * 0.6,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                                // Optimasi cache seperti di CatalogueScreen
                                fadeInDuration: Duration(milliseconds: 200),
                                fadeInCurve: Curves.easeIn,
                              ),
                            )
                          else
                            Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.image_not_supported_rounded,
                                    color: Color(0xFF77784A).withOpacity(0.5),
                                    size: baseFontSize * 2.5,
                                  ),
                                  SizedBox(height: 8),
                                  Text(
                                    'Tidak ada\ngambar',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: baseFontSize * 0.6,
                                      color: Color(0xFF77784A).withOpacity(0.7),
                                    ),
                                  ),
                                ],
                              ),
                            ),

                          // Gradient overlay untuk efek visual
                          Positioned.fill(
                            child: Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(12),
                                gradient: LinearGradient(
                                  colors: [
                                    Colors.transparent,
                                    Colors.white.withOpacity(0.3),
                                    Colors.transparent,
                                  ],
                                  stops: const [0.0, 0.5, 1.0],
                                  begin: const Alignment(-1.0, -0.3),
                                  end: const Alignment(1.0, 0.3),
                                ),
                              ),
                            ),
                          ),

                          // Overlay jika tidak bisa ditukar atau habis
                          if (!canAfford || !inStock)
                            Positioned.fill(
                              child: Container(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  color: Colors.black.withOpacity(0.5),
                                ),
                                child: Center(
                                  child: Text(
                                    !inStock ? 'HABIS' : 'POIN\nTIDAK CUKUP',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: baseFontSize * 0.75,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),

                  // Info Section
                  Expanded(
                    flex: 2,
                    child: Padding(
                      padding: EdgeInsets.fromLTRB(
                        size.width * 0.03,
                        0,
                        size.width * 0.03,
                        size.height * 0.015,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.productName,
                            style: TextStyle(
                              fontSize: baseFontSize * 0.725,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1A3C34),
                              height: 1.2,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          SizedBox(height: size.height * 0.01),
                          Row(
                            children: [
                              Icon(
                                Icons.inventory_2_outlined,
                                size: baseFontSize * 0.875,
                                color: inStock ? Colors.green : Colors.red,
                              ),
                              SizedBox(width: size.width * 0.01),
                              Text(
                                'Stok: ${widget.stock}',
                                style: TextStyle(
                                  fontSize: baseFontSize * 0.75,
                                  color: inStock
                                      ? Colors.green[700]
                                      : Colors.red[700],
                                  fontWeight: FontWeight.w600,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                          Spacer(),
                          Container(
                            padding: EdgeInsets.symmetric(
                              horizontal: size.width * 0.02,
                              vertical: size.height * 0.005,
                            ),
                            decoration: BoxDecoration(
                              gradient: canAfford
                                  ? const LinearGradient(
                                      colors: [
                                        Color(0xFF77784A),
                                        Color(0xFF8B8C5E)
                                      ],
                                    )
                                  : LinearGradient(
                                      colors: [
                                        Colors.grey[400]!,
                                        Colors.grey[500]!
                                      ],
                                    ),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.stars_rounded,
                                  color: Colors.white,
                                  size: baseFontSize * 0.875,
                                ),
                                SizedBox(width: size.width * 0.01),
                                Text(
                                  '${widget.pointsRequired} Poin',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: baseFontSize * 0.75,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  overflow: TextOverflow.ellipsis,
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

              // Popular badge
              if (widget.isPopular)
                Positioned(
                  top: size.height * 0.015,
                  left: size.width * 0.03,
                  child: Container(
                    padding: EdgeInsets.symmetric(
                      horizontal: size.width * 0.015,
                      vertical: size.height * 0.005,
                    ),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Colors.orange, Colors.deepOrange],
                      ),
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.orange.withOpacity(0.3),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Text(
                      'POPULER',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: baseFontSize * 0.5,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _showExchangeDialog(BuildContext context, int merchandiseId) {
    final size = MediaQuery.of(context).size;
    final baseFontSize =
        size.width < 360 ? size.width * 0.035 : size.width * 0.04;
    bool isProcessing = false;

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              title: Text(
                'Konfirmasi Penukaran',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1A3C34),
                  fontSize: baseFontSize * 1.125,
                ),
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Apakah Anda yakin ingin menukar:',
                    style: TextStyle(
                      fontSize: baseFontSize * 0.875,
                    ),
                  ),
                  SizedBox(height: size.height * 0.01),
                  Text(
                    widget.productName,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF77784A),
                      fontSize: baseFontSize,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: size.height * 0.01),
                  Text(
                    'Dengan ${widget.pointsRequired} poin?',
                    style: TextStyle(
                      fontSize: baseFontSize * 0.875,
                    ),
                  ),
                  if (isProcessing)
                    Padding(
                      padding: EdgeInsets.only(top: size.height * 0.02),
                      child: Center(
                        child: CircularProgressIndicator(
                          color: Color(0xFF77784A),
                        ),
                      ),
                    ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed:
                      isProcessing ? null : () => Navigator.of(context).pop(),
                  child: Text(
                    'Batal',
                    style: TextStyle(
                      fontSize: baseFontSize * 0.875,
                    ),
                  ),
                ),
                ElevatedButton(
                  onPressed: isProcessing
                      ? null
                      : () async {
                          setDialogState(() {
                            isProcessing = true;
                          });

                          final prefs = await SharedPreferences.getInstance();
                          final token = prefs.getString('token');
                          if (token == null) {
                            Navigator.of(context).pop();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  'Silakan login kembali.',
                                  style: TextStyle(
                                    fontSize: baseFontSize * 0.875,
                                  ),
                                ),
                                backgroundColor: Colors.red,
                              ),
                            );
                            return;
                          }

                          try {
                            final response = await http.post(
                              Uri.parse('http://10.0.2.2:8000/api/penukaran'),
                              headers: {
                                'Authorization': 'Bearer $token',
                                'Content-Type': 'application/json',
                              },
                              body:
                                  jsonEncode({'ID_MERCHANDISE': merchandiseId}),
                            );

                            Navigator.of(context).pop();
                            if (response.statusCode == 201) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Penukaran berhasil!',
                                    style: TextStyle(
                                      fontSize: baseFontSize * 0.875,
                                    ),
                                  ),
                                  backgroundColor: Color(0xFF77784A),
                                ),
                              );
                              widget.onExchangeSuccess();
                            } else {
                              final errorData = jsonDecode(response.body);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    errorData['message'] ?? 'Penukaran gagal.',
                                    style: TextStyle(
                                      fontSize: baseFontSize * 0.875,
                                    ),
                                  ),
                                  backgroundColor: Colors.red,
                                ),
                              );
                            }
                          } catch (e) {
                            Navigator.of(context).pop();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  'Terjadi kesalahan: ${e.toString()}',
                                  style: TextStyle(
                                    fontSize: baseFontSize * 0.875,
                                  ),
                                ),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF77784A),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    padding: EdgeInsets.symmetric(
                      horizontal: size.width * 0.04,
                      vertical: size.height * 0.015,
                    ),
                  ),
                  child: isProcessing
                      ? SizedBox(
                          width: baseFontSize * 1.25,
                          height: baseFontSize * 1.25,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : Text(
                          'Tukar',
                          style: TextStyle(
                            fontSize: baseFontSize * 0.875,
                          ),
                        ),
                ),
              ],
            );
          },
        );
      },
    );
  }
}
