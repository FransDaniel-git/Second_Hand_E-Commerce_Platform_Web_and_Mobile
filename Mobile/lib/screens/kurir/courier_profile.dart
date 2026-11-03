import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:animate_do/animate_do.dart';
import '../../services/auth_service.dart';
import '../otentikasi/login.dart';
import '../dashboard.dart';

class CourierProfileScreen extends StatefulWidget {
  const CourierProfileScreen({super.key});

  @override
  _CourierProfileScreenState createState() => _CourierProfileScreenState();
}

class _CourierProfileScreenState extends State<CourierProfileScreen>
    with TickerProviderStateMixin {
  final _authService = AuthService();
  AnimationController? _fadeController;
  AnimationController? _slideController;
  AnimationController? _bounceController;
  Animation<double>? _fadeAnimation;
  Animation<Offset>? _slideAnimation;
  Animation<double>? _bounceAnimation;

  Map<String, dynamic>? userProfile;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _fetchUserProfile();
  }

  void _initializeAnimations() {
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _slideController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _bounceController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fadeController!, curve: Curves.easeInOut),
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(
        CurvedAnimation(parent: _slideController!, curve: Curves.easeOut));
    _bounceAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _bounceController!, curve: Curves.elasticOut),
    );

    _fadeController!.forward();
    _slideController!.forward();
    _bounceController!.forward();
  }

  Future<void> _fetchUserProfile() async {
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

      // Fetch user profile
      final profileResponse = await http.get(
        Uri.parse('http://10.0.2.2:8000/api/auth/profile'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (profileResponse.statusCode == 200) {
        final profileData = jsonDecode(profileResponse.body);
        if (profileData['user_type'] == 'pegawai' &&
            profileData['user']['role'].contains('kurir')) {
          // Fetch transactions assigned to this courier
          final transactionsResponse = await http.get(
            Uri.parse('http://10.0.2.2:8000/api/kurir/transaksi-penjualan'),
            headers: {
              'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
            },
          );

          int totalDeliveries = 0;
          int completedDeliveries = 0;
          if (transactionsResponse.statusCode == 200) {
            final transactions = jsonDecode(transactionsResponse.body)['data'];
            totalDeliveries = transactions.length;
            completedDeliveries = transactions
                .where((t) => t['status'] == 'Sudah Diterima')
                .length;
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
              userProfile = {
                'nama': profileData['user']['nama'],
                'email': profileData['user']['email'],
                'telepon': profileData['user']['telepon'] ?? 'Tidak tersedia',
                'alamat': profileData['user']['alamat'] ?? 'Tidak tersedia',
                'total_deliveries': totalDeliveries,
                'completed_deliveries': completedDeliveries,
                'role': 'Kurir',
              };
              _isLoading = false;
            });
          }
        } else {
          if (mounted) {
            setState(() {
              _errorMessage = 'Profil hanya tersedia untuk kurir';
              _isLoading = false;
            });
          }
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
          _errorMessage = 'Error mengambil profil: $e';
          _isLoading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _fadeController?.dispose();
    _slideController?.dispose();
    _bounceController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    const oliveGreen = Color(0xFF7A7C52);

    if (_isLoading) {
      return Scaffold(
        body: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                oliveGreen,
                oliveGreen.withOpacity(0.8),
                Colors.grey[50]!,
              ],
              stops: const [0.0, 0.4, 0.7],
            ),
          ),
          child: Center(
            child: CircularProgressIndicator(
              color: oliveGreen,
              strokeWidth: size.width * 0.01,
            ),
          ),
        ),
      );
    }

    if (_errorMessage != null) {
      return Scaffold(
        body: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                oliveGreen,
                oliveGreen.withOpacity(0.8),
                Colors.grey[50]!,
              ],
              stops: const [0.0, 0.4, 0.7],
            ),
          ),
          child: Center(
            child: Text(
              _errorMessage!,
              style: TextStyle(
                fontSize: size.width * 0.045,
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
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
              oliveGreen,
              oliveGreen.withOpacity(0.8),
              Colors.grey[50]!,
            ],
            stops: const [0.0, 0.4, 0.7],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              children: [
                _fadeAnimation != null
                    ? FadeTransition(
                        opacity: _fadeAnimation!,
                        child: _slideAnimation != null
                            ? SlideTransition(
                                position: _slideAnimation!,
                                child: _buildEnhancedHeader(size, oliveGreen),
                              )
                            : _buildEnhancedHeader(size, oliveGreen),
                      )
                    : _buildEnhancedHeader(size, oliveGreen),
                _bounceAnimation != null
                    ? ScaleTransition(
                        scale: _bounceAnimation!,
                        child: _buildStatsSection(),
                      )
                    : _buildStatsSection(),
                _fadeAnimation != null
                    ? FadeTransition(
                        opacity: _fadeAnimation!,
                        child: _buildContactInfoSection(),
                      )
                    : _buildContactInfoSection(),
                _fadeAnimation != null
                    ? FadeTransition(
                        opacity: _fadeAnimation!,
                        child: _buildMenuSection(oliveGreen),
                      )
                    : _buildMenuSection(oliveGreen),
                SizedBox(height: size.height * 0.09),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEnhancedHeader(Size size, Color oliveGreen) {
    return Container(
      height: size.height * 0.3,
      child: Stack(
        children: [
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    oliveGreen,
                    oliveGreen.withOpacity(0.9),
                    const Color(0xFF5A5D3A),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            top: -size.height * 0.06,
            right: -size.width * 0.12,
            child: Container(
              width: size.width * 0.35,
              height: size.width * 0.35,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.1),
              ),
            ),
          ),
          Positioned(
            top: size.height * 0.06,
            left: -size.width * 0.08,
            child: Container(
              width: size.width * 0.25,
              height: size.width * 0.25,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.05),
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.all(size.width * 0.05),
            child: Column(
              children: [
                SizedBox(height: size.height * 0.025),
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.white.withOpacity(0.6),
                        blurRadius: size.width * 0.012,
                      ),
                    ],
                  ),
                  child: CircleAvatar(
                    radius: size.width * 0.12,
                    backgroundColor: Colors.white,
                    child: CircleAvatar(
                      radius: size.width * 0.11,
                      backgroundColor: Colors.grey[300],
                      child: Icon(
                        Icons.person,
                        size: size.width * 0.14,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
                SizedBox(height: size.height * 0.02),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Flexible(
                      child: Text(
                        userProfile?['nama'] ?? 'Unknown User',
                        style: TextStyle(
                          fontSize: size.width * 0.06,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: size.height * 0.000001),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.local_shipping,
                      color: Colors.amber,
                      size: size.width * 0.05,
                    ),
                    SizedBox(width: size.width * 0.02),
                    Text(
                      userProfile?['role'] ?? 'Kurir',
                      style: TextStyle(
                        fontSize: size.width * 0.04,
                        color: Colors.white70,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
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

  Widget _buildStatsSection() {
    final size = MediaQuery.of(context).size;
    return Transform.translate(
      offset: Offset(0, -size.height * 0.04),
      child: Container(
        margin: EdgeInsets.symmetric(horizontal: size.width * 0.05),
        child: Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'Total Tugas',
                userProfile?['total_deliveries'].toString() ?? '0',
                Icons.local_shipping,
                Colors.blue,
              ),
            ),
            SizedBox(width: size.width * 0.04),
            Expanded(
              child: _buildStatCard(
                'Selesai',
                userProfile?['completed_deliveries'].toString() ?? '0',
                Icons.check_circle,
                Colors.green,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(
      String title, String value, IconData icon, Color color) {
    final size = MediaQuery.of(context).size;
    return Container(
      padding: EdgeInsets.all(size.width * 0.04),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(size.width * 0.04),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: size.width * 0.025,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: EdgeInsets.all(size.width * 0.02),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: size.width * 0.05),
          ),
          SizedBox(height: size.height * 0.01),
          Text(
            value,
            style: TextStyle(
              fontSize: size.width * 0.045,
              fontWeight: FontWeight.bold,
              color: color,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          SizedBox(height: size.height * 0.005),
          Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: size.width * 0.025,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildContactInfoSection() {
    final size = MediaQuery.of(context).size;
    return Container(
      margin: EdgeInsets.all(size.width * 0.05),
      padding: EdgeInsets.all(size.width * 0.05),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(size.width * 0.05),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: size.width * 0.025,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Informasi Kontak',
            style: TextStyle(
              fontSize: size.width * 0.04,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF7A7C52),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          SizedBox(height: size.height * 0.02),
          _buildContactInfo(
            Icons.email,
            'Email',
            userProfile?['email'] ?? 'Tidak tersedia',
            () => _copyToClipboard(userProfile?['email'] ?? ''),
          ),
          SizedBox(height: size.height * 0.015),
          _buildContactInfo(
            Icons.phone,
            'Nomor Telepon',
            userProfile?['telepon'] ?? 'Tidak tersedia',
            () => _copyToClipboard(userProfile?['telepon'] ?? ''),
          ),
          SizedBox(height: size.height * 0.015),
          _buildContactInfo(
            Icons.location_on,
            'Alamat',
            userProfile?['alamat'] ?? 'Tidak tersedia',
            () => _copyToClipboard(userProfile?['alamat'] ?? ''),
          ),
        ],
      ),
    );
  }

  Widget _buildContactInfo(
      IconData icon, String label, String value, VoidCallback onTap) {
    final size = MediaQuery.of(context).size;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.all(size.width * 0.03),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          borderRadius: BorderRadius.circular(size.width * 0.03),
          border: Border.all(color: Colors.grey[200]!),
        ),
        child: Row(
          children: [
            Container(
              padding: EdgeInsets.all(size.width * 0.02),
              decoration: BoxDecoration(
                color: const Color(0xFF7A7C52).withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon,
                  color: const Color(0xFF7A7C52), size: size.width * 0.04),
            ),
            SizedBox(width: size.width * 0.03),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: size.width * 0.03,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    value,
                    style: TextStyle(
                      fontSize: size.width * 0.035,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            Icon(Icons.copy, color: Colors.grey[400], size: size.width * 0.04),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuSection(Color oliveGreen) {
    final size = MediaQuery.of(context).size;
    final menuItems = [
      {
        'icon': Icons.logout,
        'title': 'Keluar Akun',
        'subtitle': 'Logout dari aplikasi',
        'color': Colors.red,
        'onTap': () async {
          final bool? confirm = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(size.width * 0.04),
              ),
              title: Text(
                'Konfirmasi Logout',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF7A7C52),
                  fontSize: size.width * 0.045,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              content: Text(
                'Apakah Anda yakin ingin keluar dari akun?',
                style: TextStyle(
                  color: Colors.black87,
                  fontSize: size.width * 0.04,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: Text(
                    'Batal',
                    style: TextStyle(
                      color: Colors.grey,
                      fontSize: size.width * 0.035,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                TextButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: Text(
                    'Keluar',
                    style: TextStyle(
                      color: const Color(0xFF7A7C52),
                      fontSize: size.width * 0.035,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          );

          if (confirm == true && mounted) {
            final result = await _authService.logout();
            if (result['success']) {
              if (mounted) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(
                      builder: (context) => const PembeliDashboard()),
                );
              }
            } else {
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      result['message'],
                      style: TextStyle(fontSize: size.width * 0.035),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(size.width * 0.025),
                    ),
                  ),
                );
              }
            }
          }
        },
      },
    ];

    return Container(
      margin: EdgeInsets.symmetric(horizontal: size.width * 0.05),
      child: Column(
        children:
            menuItems.map((item) => _buildEnhancedMenuItem(item)).toList(),
      ),
    );
  }

  Widget _buildEnhancedMenuItem(Map<String, dynamic> item) {
    final size = MediaQuery.of(context).size;
    return Container(
      margin: EdgeInsets.only(bottom: size.height * 0.015),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: item['onTap'],
          borderRadius: BorderRadius.circular(size.width * 0.04),
          child: Container(
            padding: EdgeInsets.all(size.width * 0.04),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(size.width * 0.04),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: size.width * 0.025,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: EdgeInsets.all(size.width * 0.03),
                  decoration: BoxDecoration(
                    color: (item['color'] as Color).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(size.width * 0.03),
                  ),
                  child: Icon(
                    item['icon'],
                    color: item['color'],
                    size: size.width * 0.06,
                  ),
                ),
                SizedBox(width: size.width * 0.04),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item['title'],
                        style: TextStyle(
                          fontSize: size.width * 0.04,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      SizedBox(height: size.height * 0.005),
                      Text(
                        item['subtitle'],
                        style: TextStyle(
                          fontSize: size.width * 0.03,
                          color: Colors.grey[600],
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: EdgeInsets.all(size.width * 0.02),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.arrow_forward_ios,
                    size: size.width * 0.03,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _copyToClipboard(String text) {
    final size = MediaQuery.of(context).size;
    if (text.isNotEmpty) {
      Clipboard.setData(ClipboardData(text: text));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '$text disalin ke clipboard',
              style: TextStyle(fontSize: size.width * 0.035),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(size.width * 0.025),
            ),
          ),
        );
      }
    }
  }
}
