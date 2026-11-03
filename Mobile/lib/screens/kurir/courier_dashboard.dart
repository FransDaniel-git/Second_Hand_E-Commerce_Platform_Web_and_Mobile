import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'courier_profile.dart';
import 'courier_delivery_history.dart';
import 'courier_dashboard_content.dart';
import '../../services/auth_service.dart';

class CourierDashboard extends StatefulWidget {
  const CourierDashboard({super.key});

  @override
  _CourierDashboardState createState() => _CourierDashboardState();
}

class _CourierDashboardState extends State<CourierDashboard>
    with TickerProviderStateMixin {
  int _selectedIndex = 0;
  AnimationController? _animationController;
  Animation<double>? _scaleAnimation;
  final AuthService _authService = AuthService();
  bool _isLoading = true;
  String? _errorMessage;

  final List<Widget> _pages = [
    const CourierDashboardContent(),
    const DeliveryHistoryScreen(),
    const CourierProfileScreen(),
  ];

  final List<NavItem> _navItems = [
    NavItem(icon: Icons.dashboard, label: 'Dashboard'),
    NavItem(icon: Icons.history, label: 'Deliveries'),
    NavItem(icon: Icons.person, label: 'Profile'),
  ];

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _checkAuthStatus();
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

  Future<void> _checkAuthStatus() async {
    try {
      final token = await _authService.getToken();
      final role = await _authService.getRole();
      if (token == null || role != 'kurir') {
        if (mounted) {
          setState(() {
            _errorMessage = 'Akses tidak sah. Silakan login sebagai Kurir.';
            _isLoading = false;
          });
          Navigator.pushReplacementNamed(context, '/login');
        }
        return;
      }
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Error memeriksa status: $e';
          _isLoading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _animationController?.dispose();
    super.dispose();
  }

  void _onItemTapped(int index) {
    if (_selectedIndex != index) {
      setState(() {
        _selectedIndex = index;
      });
      _animationController?.forward().then((_) {
        _animationController?.reverse();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final Size size = MediaQuery.of(context).size;

    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_errorMessage != null) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 80, color: Colors.red),
              const SizedBox(height: 16),
              Text(
                _errorMessage!,
                style: const TextStyle(fontSize: 16, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      body: Stack(
        children: [
          _pages[_selectedIndex],
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 80,
              margin: const EdgeInsets.symmetric(horizontal: 0),
              child: Stack(
                children: [
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
                        height: 80,
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
                          children: List.generate(_navItems.length, (index) {
                            return Expanded(
                              child: _buildNavItem(index),
                            );
                          }),
                        ),
                      ),
                    ),
                  ),
                  AnimatedPositioned(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeOutQuint,
                    left: (_selectedIndex * (size.width / _navItems.length)) +
                        (size.width / (_navItems.length * 2)) -
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
      ),
    );
  }

  Widget _buildNavItem(int index) {
    final isSelected = _selectedIndex == index;
    final navItem = _navItems[index];

    return GestureDetector(
      onTap: () => _onItemTapped(index),
      child: Container(
        height: 80,
        child: Stack(
          alignment: Alignment.center,
          children: [
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
                    fontSize: isSelected ? 12 : 10,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  ),
                  child: AnimatedOpacity(
                    duration: const Duration(milliseconds: 300),
                    opacity: isSelected ? 1.0 : 0.7,
                    child: Text(navItem.label),
                  ),
                ),
              ],
            ),
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
}

class NavItem {
  final IconData icon;
  final String label;

  NavItem({required this.icon, required this.label});
}
