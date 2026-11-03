import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:p3l_mobile/services/auth_service.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'product_detail.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';
import '../screens/otentikasi/login.dart';
import '../screens/catalogue_screen.dart'; // Import CatalogueScreen
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart'; // <--- TAMBAHKAN

const String baseUrl = 'http://10.0.2.2:8000/api';

class HomeScreen extends StatefulWidget {
  final Function(String)? onCategorySelected; // Callback for category selection

  const HomeScreen({super.key, this.onCategorySelected});

  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isLoggedIn = false;
  final AuthService _authService = AuthService();
  List<dynamic> _categories = [];
  List<dynamic> _products = [];
  bool _isLoadingCategories = true;
  bool _isLoadingProducts = true;
  String? _errorMessage;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  @override
  void initState() {
    super.initState();
    _checkLoginStatus();
    _fetchCategories();
    _fetchProducts();

    // --- 1. SETUP NOTIFIKASI LOKAL (Agar bisa muncul di System Tray) ---
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings(
            '@mipmap/ic_launcher'); // Icon default aplikasi

    const DarwinInitializationSettings initializationSettingsIOS =
        DarwinInitializationSettings();

    const InitializationSettings initializationSettings =
        InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsIOS,
    );

    _localNotifications.initialize(initializationSettings);
    // ------------------------------------------------------------------

    // Firebase/notifikasi opsional: jangan crash jika Firebase belum siap.
    try {
      // --- 2. DAPATKAN TOKEN (Biarkan tetap ada) ---
      FirebaseMessaging.instance.getToken().then((token) {
        print("========================================");
        print("TOKEN FCM BARU:");
        print(token);
        print("========================================");
      }).catchError((e) {
        print('Gagal mengambil token FCM: $e');
      });

      // --- 3. PERMISSION (Khusus Android 13+) ---
      // Meminta izin notifikasi jika belum diizinkan
      FirebaseMessaging.instance.requestPermission();

      // --- 4. LISTENER FOREGROUND (Aplikasi Dibuka) ---
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        print("Pesan masuk (Foreground): ${message.notification?.title}");

        // Jika ada notifikasi, kita PAKSA munculkan di System Tray menggunakan Local Notifications
        if (message.notification != null) {
          // Setup detail notifikasi Android
          const AndroidNotificationDetails androidPlatformChannelSpecifics =
              AndroidNotificationDetails(
            'high_importance_channel', // ID Channel
            'High Importance Notifications', // Nama Channel
            importance: Importance.max,
            priority: Priority.high,
            showWhen: true,
          );

          const NotificationDetails platformChannelSpecifics =
              NotificationDetails(android: androidPlatformChannelSpecifics);

          // Tampilkan Notifikasi!
          _localNotifications.show(
            message.hashCode, // ID notifikasi (unik)
            message.notification?.title, // Judul dari Firebase
            message.notification?.body, // Isi pesan dari Firebase
            platformChannelSpecifics,
          );
        }
      });
    } catch (e) {
      print('Firebase notification init skipped: $e');
    }
  }

  Future<void> _checkLoginStatus() async {
    final token = await _authService.getToken();
    if (mounted) {
      setState(() {
        _isLoggedIn = token != null;
      });
    }
  }

  Future<void> _fetchCategories() async {
    const maxRetries = 3;
    const retryDelay = Duration(seconds: 2);
    int attempt = 0;

    while (attempt < maxRetries) {
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
          List<dynamic> categories;

          if (jsonResponse is List) {
            categories = jsonResponse;
          } else if (jsonResponse is Map && jsonResponse.containsKey('data')) {
            categories = jsonResponse['data'];
          } else {
            throw Exception('Unexpected response format: ${response.body}');
          }

          if (categories.isNotEmpty &&
              categories
                  .every((cat) => cat is Map && cat.containsKey('NAMA'))) {
            if (mounted) {
              setState(() {
                _categories = categories;
                _isLoadingCategories = false;
                _errorMessage = null;
              });
            }
            return;
          } else {
            throw Exception('Categories missing NAMA field: ${response.body}');
          }
        } else {
          throw Exception(
              'Failed to load categories: ${response.statusCode} - ${response.body}');
        }
      } catch (e) {
        attempt++;
        if (attempt == maxRetries) {
          if (mounted) {
            setState(() {
              _isLoadingCategories = false;
              _errorMessage = e.toString();
            });
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Gagal memuat kategori: $e'),
                backgroundColor: Colors.red,
              ),
            );
          }
          return;
        }
        await Future.delayed(retryDelay);
      }
    }
  }

  IconData _getIconForCategory(String categoryName) {
    switch (categoryName.toLowerCase()) {
      case 'elektronik & gadget':
        return Icons.devices;
      case 'perabotan rumah tangga':
        return Icons.home;
      case 'pakaian & aksesori':
        return Icons.shopping_bag;
      case 'buku, alat tulis, & peralatan sekolah':
        return Icons.book;
      case 'hobi, mainan, & koleksi':
        return Icons.toys;
      case 'perlengkapan bayi & anak':
        return Icons.child_care;
      case 'otomotif & aksesori':
        return Icons.directions_car;
      case 'perlengkapan taman & outdoor':
        return Icons.local_florist;
      case 'peralatan kantor & industri':
        return Icons.print;
      case 'kosmetik & perawatan diri':
        return Icons.spa;
      default:
        return Icons.category;
    }
  }

  Future<void> _fetchProducts() async {
    const maxRetries = 3;
    const retryDelay = Duration(seconds: 2);
    int attempt = 0;

    while (attempt < maxRetries) {
      try {
        final response = await http.get(
          Uri.parse('$baseUrl/products/mobile'),
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        ).timeout(const Duration(seconds: 30));

        if (response.statusCode == 200) {
          var jsonResponse = json.decode(response.body);
          List<dynamic> products;

          if (jsonResponse['success'] && jsonResponse['data'] is List) {
            products = jsonResponse['data'].map((product) {
              product['image'] = product['image'] != '/api/placeholder/60/60'
                  ? '$baseUrl/products/${product['id']}/thumbnail'
                  : '/api/placeholder/60/60';
              return product;
            }).toList();
            products.shuffle();
            products = products.take(10).toList();
            if (mounted) {
              setState(() {
                _products = products;
                _isLoadingProducts = false;
                _errorMessage = null;
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
        attempt++;
        if (attempt == maxRetries) {
          if (mounted) {
            setState(() {
              _isLoadingProducts = false;
              _errorMessage = e.toString();
            });
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Gagal memuat produk: $e'),
                backgroundColor: Colors.red,
              ),
            );
          }
          return;
        }
        await Future.delayed(retryDelay);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final oliveGreen = const Color(0xFF7A7C52);
    final backgroundColor = Colors.white;
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Stack(
        children: [
          Container(
            height: double.infinity,
            decoration: const BoxDecoration(
              image: DecorationImage(
                image: AssetImage('assets/images/hero-bg.png'),
                fit: BoxFit.cover,
              ),
            ),
            child: Container(
              color: oliveGreen.withOpacity(0.7),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: EdgeInsets.all(size.width * 0.04),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      FadeInDown(
                        duration: const Duration(milliseconds: 800),
                        child: Row(
                          children: [
                            Expanded(
                              child: Container(
                                height: size.height * 0.05 > 40
                                    ? 40
                                    : size.height * 0.05,
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.9),
                                  borderRadius:
                                      BorderRadius.circular(size.width * 0.05),
                                ),
                                child: TextField(
                                  decoration: InputDecoration(
                                    hintText: 'Cari Produk....',
                                    prefixIcon:
                                        Icon(Icons.search, color: Colors.grey),
                                    border: InputBorder.none,
                                    contentPadding: EdgeInsets.symmetric(
                                        vertical: size.height * 0.012),
                                  ),
                                ),
                              ),
                            ),
                            SizedBox(width: size.width * 0.03),
                            _isLoggedIn
                                ? Container(
                                    height: size.height * 0.05 > 40
                                        ? 40
                                        : size.height * 0.05,
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.4),
                                      borderRadius: BorderRadius.circular(
                                          size.width * 0.025),
                                    ),
                                    child: IconButton(
                                      icon: const Icon(Icons.notifications,
                                          color: Colors.white),
                                      onPressed: () {},
                                    ),
                                  )
                                : Container(
                                    height: size.height * 0.05 > 40
                                        ? 40
                                        : size.height * 0.05,
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.4),
                                      borderRadius: BorderRadius.circular(
                                          size.width * 0.025),
                                    ),
                                    child: IconButton(
                                      icon: const Icon(Icons.login,
                                          color: Colors.white),
                                      onPressed: () {
                                        Navigator.pushReplacement(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) =>
                                                const LoginScreen(),
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                          ],
                        ),
                      ),
                      SizedBox(height: size.height * 0.03),
                      FadeInLeft(
                        duration: const Duration(milliseconds: 1000),
                        child: Text(
                          'Temukan\nKesempatan Baru\ndalam Barang Lama',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: size.width * 0.05,
                            fontWeight: FontWeight.w600,
                            height: 1.3,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: size.height * 0.02),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: size.width * 0.04),
                  child: FadeInUp(
                    duration: const Duration(milliseconds: 1200),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: const [
                        _StatItem(
                          label: '200+',
                          description: 'Pembeli Puas',
                        ),
                        _StatItem(
                          label: '100+',
                          description: 'Dipercaya Penitip',
                        ),
                        _StatItem(
                          label: '100%',
                          description: 'Barang Layak Pakai',
                        ),
                      ],
                    ),
                  ),
                ),
                SizedBox(height: size.height * 0.02),
                Expanded(
                  child: Stack(
                    children: [
                      PhysicalModel(
                        color: Colors.transparent,
                        elevation: 10,
                        shadowColor: Colors.black.withOpacity(0.2),
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(30),
                          topRight: Radius.circular(30),
                        ),
                        child: ClipRRect(
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(30),
                            topRight: Radius.circular(30),
                          ),
                          child: Container(
                            width: double.infinity,
                            color: backgroundColor,
                          ),
                        ),
                      ),
                      SingleChildScrollView(
                        physics: const ClampingScrollPhysics(),
                        child: Column(
                          children: [
                            ProductSection(
                              products: _products,
                              isLoading: _isLoadingProducts,
                              errorMessage: _errorMessage,
                              onRetry: _fetchProducts,
                            ),
                            CategorySection(
                              categories: _categories,
                              getIcon: _getIconForCategory,
                              isLoading: _isLoadingCategories,
                              errorMessage: _errorMessage,
                              onRetry: _fetchCategories,
                              onCategorySelected: (categoryName) {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => CatalogueScreen(
                                      selectedCategory: categoryName,
                                    ),
                                  ),
                                );
                              },
                            ),
                            SizedBox(height: size.height * 0.03),
                            FadeInUp(
                              duration: const Duration(milliseconds: 1000),
                              child: Container(
                                color: oliveGreen.withOpacity(0.3),
                                width: double.infinity,
                                padding: EdgeInsets.fromLTRB(
                                    size.width * 0.04,
                                    size.height * 0.03,
                                    size.width * 0.04,
                                    size.height * 0.03),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    Text(
                                      'Mengapa Memilih ReuseMart',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: size.width * 0.045,
                                        color: oliveGreen,
                                      ),
                                    ),
                                    SizedBox(height: size.height * 0.03),
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        _InfoCard(
                                          icon: Icons.eco,
                                          label: 'Ramah Lingkungan',
                                        ),
                                        SizedBox(width: size.width * 0.03),
                                        _InfoCard(
                                          icon: Icons.verified,
                                          label: 'Terpercaya',
                                        ),
                                      ],
                                    ),
                                    SizedBox(height: size.height * 0.015),
                                    _InfoCard(
                                      icon: Icons.savings,
                                      label: 'Hemat Budget',
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            SizedBox(height: size.height * 0.03),
                            FadeInUp(
                              duration: const Duration(milliseconds: 1200),
                              child: Padding(
                                padding: EdgeInsets.fromLTRB(
                                    size.width * 0.04,
                                    size.height * 0.03,
                                    size.width * 0.04,
                                    size.height * 0.03),
                                child: Container(
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(
                                        size.width * 0.04),
                                    image: const DecorationImage(
                                      image: AssetImage(
                                          'assets/images/hero-bg.png'),
                                      fit: BoxFit.cover,
                                    ),
                                  ),
                                  height: size.height * 0.4 > 350
                                      ? 350
                                      : size.height * 0.4,
                                  width: double.infinity,
                                  child: Container(
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(
                                          size.width * 0.04),
                                      gradient: const LinearGradient(
                                        colors: [
                                          Colors.black12,
                                          Colors.black54,
                                          Colors.black,
                                        ],
                                        begin: Alignment.topCenter,
                                        end: Alignment.bottomCenter,
                                      ),
                                    ),
                                    padding: EdgeInsets.all(size.width * 0.04),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        SizedBox(height: size.height * 0.1),
                                        Text(
                                          'Temukan Barang Berkualitas dengan Mudah',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: size.width * 0.045,
                                            fontWeight: FontWeight.bold,
                                          ),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        SizedBox(height: size.height * 0.005),
                                        Text(
                                          'Daftar sekarang sebagai pembeli dan jelajahi ribuan produk preloved yang telah dikurasi. Hemat lebih banyak, temukan lebih cepat.',
                                          style: TextStyle(
                                            color: Colors.white70,
                                            fontSize: size.width * 0.035,
                                          ),
                                          textAlign: TextAlign.justify,
                                          maxLines: 3,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        SizedBox(height: size.height * 0.01),
                                        Center(
                                          child: ElevatedButton(
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: oliveGreen,
                                              shape: RoundedRectangleBorder(
                                                borderRadius:
                                                    BorderRadius.circular(
                                                        size.width * 0.03),
                                              ),
                                              padding: EdgeInsets.symmetric(
                                                  vertical: size.height * 0.01,
                                                  horizontal:
                                                      size.width * 0.04),
                                            ),
                                            onPressed: () {},
                                            child: Text(
                                              'Lanjutkan Pembelian di Website Kami',
                                              style: TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold,
                                                fontSize: size.width * 0.032,
                                              ),
                                              textAlign: TextAlign.center,
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            SizedBox(height: size.height * 0.03),
                            SlideInUp(
                              duration: const Duration(milliseconds: 1000),
                              child: Container(
                                width: double.infinity,
                                padding: EdgeInsets.fromLTRB(
                                    size.width * 0.04,
                                    size.height * 0.03,
                                    size.width * 0.04,
                                    size.height * 0.03),
                                color: const Color(0xFF7A7C52),
                                constraints: BoxConstraints(
                                  minHeight: size.height * 0.3,
                                ),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    Text(
                                      'ReuseMart',
                                      style: TextStyle(
                                        fontSize: size.width * 0.045,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.white,
                                      ),
                                      textAlign: TextAlign.right,
                                    ),
                                    SizedBox(height: size.height * 0.01),
                                    Text(
                                      'ReuseMart adalah platform jual beli barang bekas terpercaya di Yogyakarta, mendukung transaksi mudah dan ramah lingkungan. Gabunglah dengan kami untuk menemukan barang berkualitas dengan harga terjangkau.',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                          fontSize: size.width * 0.03,
                                          color: Colors.white70),
                                    ),
                                    SizedBox(height: size.height * 0.005),
                                    Text(
                                      '© 2025 ReuseMart. All Rights Reserved.',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                          fontSize: size.width * 0.03,
                                          color: Colors.white70),
                                    ),
                                    SizedBox(height: size.height * 0.005),
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          'Privacy Policy',
                                          style: TextStyle(
                                            fontSize: size.width * 0.03,
                                            color: Colors.white70,
                                            decoration:
                                                TextDecoration.underline,
                                          ),
                                        ),
                                        SizedBox(width: size.width * 0.04),
                                        Text(
                                          'Terms of Service',
                                          style: TextStyle(
                                            fontSize: size.width * 0.03,
                                            color: Colors.white70,
                                            decoration:
                                                TextDecoration.underline,
                                          ),
                                        ),
                                      ],
                                    ),
                                    SizedBox(height: size.height * 0.12),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
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

class ProductSection extends StatelessWidget {
  final List<dynamic> products;
  final bool isLoading;
  final String? errorMessage;
  final VoidCallback onRetry;

  const ProductSection({
    super.key,
    required this.products,
    required this.isLoading,
    this.errorMessage,
    required this.onRetry,
  });

  Widget _buildProductLoadingShimmer(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return ListView.builder(
      scrollDirection: Axis.horizontal,
      itemCount: 3,
      itemBuilder: (context, index) => Padding(
        padding: EdgeInsets.symmetric(horizontal: size.width * 0.015),
        child: Shimmer.fromColors(
          baseColor: Colors.grey[300]!,
          highlightColor: Colors.grey[100]!,
          child: Container(
            width: size.width * 0.4,
            height: size.width * 0.4,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(size.width * 0.03),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: size.width * 0.25,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.grey,
                    borderRadius: BorderRadius.vertical(
                        top: Radius.circular(size.width * 0.03)),
                  ),
                ),
                Padding(
                  padding: EdgeInsets.all(size.width * 0.02),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        height: size.width * 0.04,
                        width: size.width * 0.25,
                        color: Colors.grey,
                      ),
                      SizedBox(height: size.width * 0.01),
                      Container(
                        height: size.width * 0.03,
                        width: size.width * 0.2,
                        color: Colors.grey,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Padding(
      padding: EdgeInsets.all(size.width * 0.04),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Temukan Barang Berkualitas dan Mudah',
            style: TextStyle(
              fontSize: size.width * 0.05,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF1A3C34),
            ),
          ),
          SizedBox(height: size.height * 0.015),
          SizedBox(
            height: size.width * 0.45 > 180 ? 180 : size.width * 0.45,
            child: isLoading
                ? _buildProductLoadingShimmer(context)
                : errorMessage != null
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'Error: $errorMessage',
                              style: const TextStyle(color: Colors.red),
                              textAlign: TextAlign.center,
                            ),
                            SizedBox(height: size.height * 0.01),
                            ElevatedButton(
                              onPressed: onRetry,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF7A7C52),
                              ),
                              child: Text(
                                'Coba Lagi',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontSize: size.width * 0.035),
                              ),
                            ),
                          ],
                        ),
                      )
                    : products.isEmpty
                        ? const Center(child: Text('Tidak ada produk tersedia'))
                        : PageView.builder(
                            itemCount: (products.length / 2).ceil(),
                            itemBuilder: (context, index) {
                              final int firstProductIndex = index * 2;
                              final int secondProductIndex =
                                  firstProductIndex + 1;
                              return Padding(
                                padding: EdgeInsets.symmetric(
                                    horizontal: size.width * 0.015),
                                child: Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    ProductCard(
                                      id: products[firstProductIndex]['id'],
                                      title: products[firstProductIndex]
                                          ['name'],
                                      price: products[firstProductIndex]
                                              ['price']
                                          .toString(),
                                      imageUrl: products[firstProductIndex]
                                          ['image'],
                                    ),
                                    if (secondProductIndex < products.length)
                                      ProductCard(
                                        id: products[secondProductIndex]['id'],
                                        title: products[secondProductIndex]
                                            ['name'],
                                        price: products[secondProductIndex]
                                                ['price']
                                            .toString(),
                                        imageUrl: products[secondProductIndex]
                                            ['image'],
                                      ),
                                  ],
                                ),
                              );
                            },
                          ),
          ),
          SizedBox(height: size.height * 0.015),
          Center(
            child: Text(
              'Lanjutkan Pembelian di Website Kami',
              style: TextStyle(
                fontSize: size.width * 0.035,
                color: const Color(0xFF1A3C34),
                decoration: TextDecoration.underline,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class ProductCard extends StatelessWidget {
  final String id;
  final String title;
  final String price;
  final String imageUrl;

  const ProductCard({
    super.key,
    required this.id,
    required this.title,
    required this.price,
    required this.imageUrl,
  });

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    String formatRupiah(String price) {
      final number = int.tryParse(price.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
      return 'Rp ${NumberFormat("#,##0", "id_ID").format(number)}';
    }

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ProductDetailScreen(productId: id),
          ),
        );
      },
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(size.width * 0.03)),
        child: Container(
          width: size.width * 0.4,
          height: size.width * 0.4,
          color: Colors.white,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: size.width * 0.25,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(
                      top: Radius.circular(size.width * 0.03)),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.vertical(
                      top: Radius.circular(size.width * 0.03)),
                  child: imageUrl != '/api/placeholder/60/60'
                      ? CachedNetworkImage(
                          imageUrl: imageUrl,
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Shimmer.fromColors(
                            baseColor: Colors.grey[300]!,
                            highlightColor: Colors.grey[100]!,
                            child: Container(
                              color: Colors.grey,
                            ),
                          ),
                          errorWidget: (context, url, error) {
                            print('Image load error: $error, URL: $url');
                            return Image.asset(
                              'assets/images/placeholder.png',
                              fit: BoxFit.cover,
                            );
                          },
                        )
                      : Image.asset(
                          'assets/images/placeholder.png',
                          fit: BoxFit.cover,
                        ),
                ),
              ),
              Padding(
                padding: EdgeInsets.all(size.width * 0.02),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: size.width * 0.035,
                        fontWeight: FontWeight.w600,
                        color: Colors.black,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: size.width * 0.01),
                    Text(
                      formatRupiah(price),
                      style: TextStyle(
                        fontSize: size.width * 0.03,
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

class CategorySection extends StatelessWidget {
  final List<dynamic> categories;
  final IconData Function(String) getIcon;
  final bool isLoading;
  final String? errorMessage;
  final VoidCallback onRetry;
  final Function(String)? onCategorySelected;

  const CategorySection({
    super.key,
    required this.categories,
    required this.getIcon,
    required this.isLoading,
    this.errorMessage,
    required this.onRetry,
    this.onCategorySelected,
  });

  List<List<Map<String, dynamic>>> _groupCategories() {
    List<List<Map<String, dynamic>>> grouped = [];
    for (int i = 0; i < categories.length; i += 2) {
      grouped.add(
        categories
            .sublist(i, i + 2 > categories.length ? categories.length : i + 2)
            .map((cat) => {
                  'name': cat['NAMA'],
                  'icon': getIcon(cat['NAMA']),
                })
            .toList(),
      );
    }
    return grouped;
  }

  Widget _buildCategoryLoadingShimmer(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return ListView.builder(
      scrollDirection: Axis.horizontal,
      itemCount: 3,
      itemBuilder: (context, index) {
        return Padding(
          padding: EdgeInsets.only(right: size.width * 0.04),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(2, (i) {
              return Shimmer.fromColors(
                baseColor: Colors.grey[300]!,
                highlightColor: Colors.grey[100]!,
                child: Container(
                  width: size.width * 0.45,
                  height: size.width * 0.15,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(size.width * 0.02),
                  ),
                ),
              );
            }),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final groupedCategories = _groupCategories();
    final size = MediaQuery.of(context).size;
    final double cardWidth = size.width * 0.45;

    return Padding(
      padding: EdgeInsets.symmetric(
          horizontal: size.width * 0.04, vertical: size.height * 0.01),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Kategori Barang Bekas ReuseMart',
            style: TextStyle(
              fontSize: size.width * 0.04,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1A3C34),
            ),
          ),
          SizedBox(height: size.height * 0.01),
          SizedBox(
            height: size.width * 0.3 > 120 ? 120 : size.width * 0.3,
            child: isLoading
                ? _buildCategoryLoadingShimmer(context)
                : errorMessage != null
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'Error: $errorMessage',
                              style: const TextStyle(color: Colors.red),
                              textAlign: TextAlign.center,
                            ),
                            SizedBox(height: size.height * 0.01),
                            ElevatedButton(
                              onPressed: onRetry,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF7A7C52),
                              ),
                              child: Text(
                                'Coba Lagi',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontSize: size.width * 0.035),
                              ),
                            ),
                          ],
                        ),
                      )
                    : groupedCategories.isEmpty
                        ? const Center(
                            child: Text('Tidak ada kategori tersedia'))
                        : ListView.builder(
                            scrollDirection: Axis.horizontal,
                            itemCount: groupedCategories.length,
                            itemBuilder: (context, index) {
                              final pair = groupedCategories[index];
                              return Padding(
                                padding:
                                    EdgeInsets.only(right: size.width * 0.04),
                                child: Column(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: pair.map((category) {
                                    return GestureDetector(
                                      onTap: () {
                                        onCategorySelected!(category['name']);
                                      },
                                      child: SizedBox(
                                        width: cardWidth,
                                        height: size.width * 0.145,
                                        child: Card(
                                          color: Colors.white,
                                          shape: RoundedRectangleBorder(
                                              borderRadius:
                                                  BorderRadius.circular(
                                                      size.width * 0.02)),
                                          child: Padding(
                                            padding: EdgeInsets.symmetric(
                                                horizontal: size.width * 0.03,
                                                vertical: size.height * 0.01),
                                            child: Row(
                                              children: [
                                                Icon(
                                                  category['icon'],
                                                  size: size.width * 0.06,
                                                  color:
                                                      const Color(0xFF1A3C34),
                                                ),
                                                SizedBox(
                                                    width: size.width * 0.02),
                                                Expanded(
                                                  child: Text(
                                                    category['name'],
                                                    style: TextStyle(
                                                      fontSize:
                                                          size.width * 0.03,
                                                      color: Colors.black,
                                                    ),
                                                    textAlign: TextAlign.left,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),
                                    );
                                  }).toList(),
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String description;

  const _StatItem({
    required this.label,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: size.width * 0.04,
            color: Colors.white,
          ),
        ),
        Text(
          description,
          style: TextStyle(
            fontSize: size.width * 0.03,
            color: Colors.white70,
          ),
        ),
      ],
    );
  }
}

class _InfoCard extends StatelessWidget {
  final IconData icon;
  final String label;
  static const oliveGreen = Color(0xFF7A7C52);

  const _InfoCard({
    required this.icon,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Container(
      width: (size.width - 56) / 2,
      height: size.width * 0.3 > 120 ? 120 : size.width * 0.3,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size.width * 0.03),
        gradient: const LinearGradient(
          colors: [
            oliveGreen,
            Color(0xFF5A5D32),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Colors.white, size: size.width * 0.07),
            SizedBox(height: size.height * 0.01),
            Text(
              label,
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: size.width * 0.035,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
