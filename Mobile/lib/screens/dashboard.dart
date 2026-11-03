import 'package:flutter/material.dart';
import 'package:p3l_mobile/services/auth_service.dart';
import 'home.dart';
import 'catalogue_screen.dart';
import 'riwayat_pesanan.dart';
import 'profile.dart';
import '../screens/otentikasi/login.dart';

class PembeliDashboard extends StatefulWidget {
  const PembeliDashboard({super.key});

  @override
  _PembeliDashboardState createState() => _PembeliDashboardState();
}

class _PembeliDashboardState extends State<PembeliDashboard>
    with TickerProviderStateMixin {
  int _selectedIndex = 0;
  final AuthService authService = AuthService();
  AnimationController? _animationController;
  Animation<double>? _scaleAnimation;
  String? _selectedCategory; // Store selected category for CatalogueScreen

  final List<Widget> _pages = [
    const HomeScreen(),
    const CatalogueScreen(),
    const OrderHistoryScreen(),
    const ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    // Initialize pages with a callback for category selection
    _pages[0] = HomeScreen(
      onCategorySelected: (category) {
        setState(() {
          _selectedCategory = category;
          _selectedIndex = 1; // Switch to Catalogue tab
        });
        _animationController?.forward().then((_) {
          _animationController?.reverse();
        });
      },
    );
    _pages[1] = CatalogueScreen(selectedCategory: _selectedCategory);
  }

  void _initializeAnimations() {
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _animationController!,
      curve: Curves.elasticOut,
    ));
  }

  @override
  void dispose() {
    _animationController?.dispose();
    super.dispose();
  }

  void _onItemTapped(int index, {String? category}) async {
    if (index == 2 || index == 3) {
      final token = await authService.getToken();
      if (token == null) {
        bool? shouldLogin = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            title: const Text(
              'Login Diperlukan',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Color(0xFF77784A),
              ),
            ),
            content: const Text(
                'Anda harus login untuk mengakses halaman ini. Apakah Anda ingin login sekarang?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text(
                  'Batal',
                  style: TextStyle(color: Colors.grey),
                ),
              ),
              TextButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text(
                  'Login',
                  style: TextStyle(color: Color(0xFF77784A)),
                ),
              ),
            ],
          ),
        );

        if (shouldLogin == true && mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => const LoginScreen(),
            ),
          );
        }
        return;
      }
    }

    if (_selectedIndex != index || category != null) {
      setState(() {
        _selectedIndex = index;
        if (category != null) {
          _selectedCategory = category;
          _pages[1] = CatalogueScreen(selectedCategory: _selectedCategory);
        }
      });
      _animationController?.forward().then((_) {
        _animationController?.reverse();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final Size size = MediaQuery.of(context).size;

    return Scaffold(
      body: LayoutBuilder(
        builder: (context, constraints) {
          return Stack(
            children: [
              // Main content
              _pages[_selectedIndex],

              // Bottom Navigation Bar
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  height: constraints.maxHeight * 0.1, // Responsive height
                  margin: const EdgeInsets.symmetric(horizontal: 0),
                  child: Stack(
                    children: [
                      // Actual Bottom Bar with curved corners
                      PhysicalModel(
                        color: Colors.transparent,
                        elevation: 10,
                        shadowColor: Colors.black.withOpacity(0.4),
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(25),
                          topRight: Radius.circular(25),
                        ),
                        child: ClipRRect(
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(25),
                            topRight: Radius.circular(25),
                          ),
                          child: Container(
                            height: constraints.maxHeight * 0.1,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  const Color(0xFF7A7C52),
                                  const Color(0xFF6A6D42),
                                  const Color(0xFF5A5D32),
                                ],
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                              children:
                                  List.generate(_navItems.length, (index) {
                                return Expanded(
                                  child: _buildNavItem(index, constraints),
                                );
                              }),
                            ),
                          ),
                        ),
                      ),

                      // Animated indicator
                      AnimatedPositioned(
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeOutQuint,
                        left: (_selectedIndex * (size.width / 4)) +
                            (size.width / 8) -
                            25,
                        top: 5,
                        child: Container(
                          width: 50,
                          height: 4,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.white.withOpacity(0.5),
                                blurRadius: 8,
                                spreadRadius: 1,
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
          );
        },
      ),
    );
  }

  Widget _buildNavItem(int index, BoxConstraints constraints) {
    final isSelected = _selectedIndex == index;
    final navItem = _navItems[index];
    final fontSize = constraints.maxWidth < 360 ? 10.0 : 12.0;

    return GestureDetector(
      onTap: () => _onItemTapped(index),
      child: Container(
        height: constraints.maxHeight * 0.1,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Background highlight for selected item
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              width: isSelected ? 60 : 0,
              height: isSelected ? 60 : 0,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(isSelected ? 0.15 : 0),
                borderRadius: BorderRadius.circular(30),
              ),
            ),

            // Icon and label
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                AnimatedBuilder(
                  animation:
                      _scaleAnimation ?? const AlwaysStoppedAnimation(1.0),
                  builder: (context, child) {
                    return Transform.scale(
                      scale: isSelected &&
                              (_animationController?.isAnimating == true)
                          ? _scaleAnimation?.value ?? 1.0
                          : 1.0,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        padding: EdgeInsets.all(isSelected ? 8 : 6),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? Colors.white.withOpacity(0.2)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(15),
                        ),
                        child: Icon(
                          navItem.icon,
                          color: Colors.white,
                          size: isSelected ? 26 : 24,
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 2),
                AnimatedDefaultTextStyle(
                  duration: const Duration(milliseconds: 300),
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: isSelected ? fontSize : fontSize - 2,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  ),
                  child: AnimatedOpacity(
                    duration: const Duration(milliseconds: 300),
                    opacity: isSelected ? 1.0 : 0.7,
                    child: Text(navItem.label, textAlign: TextAlign.center),
                  ),
                ),
              ],
            ),

            // Radial highlight effect
            if (isSelected)
              Positioned.fill(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 600),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(40),
                    gradient: RadialGradient(
                      center: Alignment.center,
                      radius: 1.0,
                      colors: [
                        Colors.white.withOpacity(0.1),
                        Colors.transparent,
                      ],
                      stops: const [0.0, 1.0],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  final List<NavItem> _navItems = [
    NavItem(icon: Icons.home_rounded, label: 'Home'),
    NavItem(icon: Icons.search_rounded, label: 'Catalogue'),
    NavItem(icon: Icons.receipt_long_rounded, label: 'Orders'),
    NavItem(icon: Icons.person_rounded, label: 'Profile'),
  ];
}

class NavItem {
  final IconData icon;
  final String label;

  NavItem({required this.icon, required this.label});
}
