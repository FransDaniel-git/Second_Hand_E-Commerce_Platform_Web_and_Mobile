import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:animate_do/animate_do.dart';
import 'package:shimmer/shimmer.dart';
import 'ConsignedItemsScreen.dart';
import 'profile_penitip.dart';

class PenitipDashboard extends StatefulWidget {
  const PenitipDashboard({super.key});

  @override
  _PenitipDashboardState createState() => _PenitipDashboardState();
}

class _PenitipDashboardState extends State<PenitipDashboard>
    with TickerProviderStateMixin {
  int _selectedIndex = 0;
  AnimationController? _animationController;
  Animation<double>? _scaleAnimation;
  bool _isLoading = true;

  // Data Statistik
  final List<Map<String, dynamic>> stats = [
    {
      'title': 'Total Barang',
      'value': 156,
      'icon': Icons.inventory_2,
      'color': Colors.blue,
      'change': 12,
    },
    {
      'title': 'Barang Terjual',
      'value': 89,
      'icon': Icons.check_circle,
      'color': Colors.green,
      'change': 8,
    },
    {
      'title': 'Pendapatan Bulan Ini',
      'value': 12500000,
      'icon': Icons.attach_money,
      'color': Colors.amber,
      'change': 15,
      'isMonetary': true,
    },
    {
      'title': 'Rata-rata Penjualan',
      'value': 140000,
      'icon': Icons.trending_up,
      'color': Colors.purple,
      'change': 5,
      'isMonetary': true,
    },
  ];

  // Data Tren Penjualan
  final List<Map<String, dynamic>> salesData = [
    {'date': '2024-01-01', 'penjualan': 12, 'pendapatan': 1800000},
    {'date': '2024-01-02', 'penjualan': 8, 'pendapatan': 1200000},
    {'date': '2024-01-03', 'penjualan': 15, 'pendapatan': 2250000},
    {'date': '2024-01-04', 'penjualan': 10, 'pendapatan': 1500000},
    {'date': '2024-01-05', 'penjualan': 18, 'pendapatan': 2700000},
    {'date': '2024-01-06', 'penjualan': 14, 'pendapatan': 2100000},
    {'date': '2024-01-07', 'penjualan': 12, 'pendapatan': 1800000},
  ];

  // Data Distribusi Kategori
  final List<Map<String, dynamic>> categoryData = [
    {'name': 'Elektronik', 'value': 35, 'color': Colors.blue},
    {'name': 'Pakaian', 'value': 28, 'color': Colors.green},
    {'name': 'Aksesoris', 'value': 20, 'color': Colors.amber},
    {'name': 'Peralatan', 'value': 17, 'color': Colors.orange},
  ];

  // Data Performa Bulanan
  final List<Map<String, dynamic>> monthlyData = [
    {'month': 'Jan', 'barang': 20, 'terjual': 18, 'pendapatan': 2500000},
    {'month': 'Feb', 'barang': 25, 'terjual': 22, 'pendapatan': 3200000},
    {'month': 'Mar', 'barang': 30, 'terjual': 26, 'pendapatan': 3800000},
    {'month': 'Apr', 'barang': 28, 'terjual': 24, 'pendapatan': 3600000},
    {'month': 'May', 'barang': 35, 'terjual': 28, 'pendapatan': 4200000},
    {'month': 'Jun', 'barang': 32, 'terjual': 30, 'pendapatan': 4500000},
  ];

  final List<Widget> _pages = [
    const DashboardContent(),
    const ConsignedItemsScreen(),
    const ProfilePenitipScreen(),
  ];

  final List<NavItem> _navItems = [
    NavItem(icon: Icons.dashboard, label: 'Dashboard'),
    NavItem(icon: Icons.list, label: 'Daftar Barang'),
    NavItem(icon: Icons.person, label: 'Profile'),
  ];

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _loadData();
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

  Future<void> _loadData() async {
    print('Memulai pengambilan data...');
    await Future.delayed(const Duration(seconds: 1));
    print('Selesai menunggu, mengubah _isLoading menjadi false');
    setState(() {
      _isLoading = false;
    });
    print('_isLoading sekarang: $_isLoading');
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

  String _getDisplayText(double availableWidth) {
    return availableWidth < 280 ? 'Dashboard\nPenitip' : 'Dashboard Penitip';
  }

  double _getFontSize(double availableWidth) {
    return availableWidth < 280 ? 18 : 20;
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
                              children: List.generate(_navItems.length, (index) {
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
                        left: (_selectedIndex * (size.width / 3)) +
                            (size.width / 6) -
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

  Widget _buildDashboardContent() {
    final oliveGreen = const Color(0xFF7A7C52);

    return Scaffold(
      body: LayoutBuilder(
        builder: (context, constraints) {
          return Container(
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
                  leading: Padding(
                    padding: const EdgeInsets.all(8.0),
                  ),
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
                    height: constraints.maxHeight * 0.2,
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
                            padding: EdgeInsets.symmetric(
                              horizontal: constraints.maxWidth * 0.05,
                              vertical: 12.0,
                            ),
                            child: Row(
                              children: [
                                SizedBox(width: constraints.maxWidth * 0.05),
                                Expanded(
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
                                            maxLines:
                                                availableWidth < 280 ? 2 : 1,
                                            overflow: TextOverflow.ellipsis,
                                            softWrap: true,
                                          );
                                        },
                                      ),
                                      const SizedBox(height: 8),
                                      Flexible(
                                        child: Text(
                                          '${stats[0]['value']} Barang Titipan',
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
                  child: Padding(
                    padding: EdgeInsets.all(constraints.maxWidth * 0.04),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        FadeInDown(
                          duration: const Duration(milliseconds: 800),
                          child: _buildWelcomeSection(constraints),
                        ),
                        FadeInUp(
                          duration: const Duration(milliseconds: 1000),
                          child: _buildStatsGrid(constraints),
                        ),
                        SizedBox(height: constraints.maxHeight * 0.03),
                        FadeInLeft(
                          duration: const Duration(milliseconds: 1200),
                          child: _buildSalesTrendChart(constraints),
                        ),
                        SizedBox(height: constraints.maxHeight * 0.03),
                        FadeInRight(
                          duration: const Duration(milliseconds: 1400),
                          child: _buildCategoryPieChart(constraints),
                        ),
                        SizedBox(height: constraints.maxHeight * 0.03),
                        FadeInUp(
                          duration: const Duration(milliseconds: 1600),
                          child: _buildMonthlyBarChart(constraints),
                        ),
                        SizedBox(height: constraints.maxHeight * 0.1),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildWelcomeSection(BoxConstraints constraints) {
    return Container(
      padding: EdgeInsets.all(constraints.maxWidth * 0.04),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF7A7C52), Color(0xFF5A5D3A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Selamat Datang di Dashboard Penitip!',
            style: TextStyle(
              color: Colors.white,
              fontSize: constraints.maxWidth < 360 ? 18 : 20,
              fontWeight: FontWeight.bold,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          Text(
            'Kelola barang titipan Anda dan pantau penjualan dengan mudah',
            style: TextStyle(
              color: Colors.white.withOpacity(0.9),
              fontSize: constraints.maxWidth < 360 ? 12 : 14,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(BoxConstraints constraints) {
    return FutureBuilder(
      future: Future.delayed(const Duration(seconds: 2)),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: constraints.maxWidth < 600 ? 2 : 4,
              childAspectRatio: constraints.maxWidth < 360 ? 1.1 : 1.2,
              crossAxisSpacing: constraints.maxWidth * 0.04,
              mainAxisSpacing: constraints.maxWidth * 0.04,
            ),
            itemCount: 4,
            itemBuilder: (context, index) => _buildStatCardLoading(),
          );
        } else {
          return GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: constraints.maxWidth < 600 ? 2 : 4,
              childAspectRatio: constraints.maxWidth < 360 ? 1.1 : 1.2,
              crossAxisSpacing: constraints.maxWidth * 0.04,
              mainAxisSpacing: constraints.maxWidth * 0.04,
            ),
            itemCount: stats.length,
            itemBuilder: (context, index) => _buildStatCard(stats[index], constraints),
          );
        }
      },
    );
  }

  Widget _buildStatCardLoading() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Card(
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    color: Colors.white,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Container(
                      height: 14,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Container(
                height: 20,
                width: 100,
                color: Colors.white,
              ),
              const SizedBox(height: 4),
              Container(
                height: 12,
                width: 80,
                color: Colors.white,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(Map<String, dynamic> stat, BoxConstraints constraints) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.white, stat['color'].withOpacity(0.1)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Padding(
          padding: EdgeInsets.all(constraints.maxWidth * 0.04),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(stat['icon'], color: stat['color'], size: constraints.maxWidth < 360 ? 24 : 28),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      stat['title'],
                      style: TextStyle(
                        fontSize: constraints.maxWidth < 360 ? 12 : 14,
                        fontWeight: FontWeight.bold,
                      ),
                      softWrap: true,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  stat['isMonetary'] == true
                      ? 'Rp ${stat['value'].toStringAsFixed(0)}'
                      : stat['value'].toString(),
                  style: TextStyle(
                    fontSize: constraints.maxWidth < 360 ? 18 : 20,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${stat['change'] > 0 ? '+' : ''}${stat['change']}% dari bulan lalu',
                style: TextStyle(
                  color: stat['change'] > 0 ? Colors.green : Colors.red,
                  fontSize: constraints.maxWidth < 360 ? 10 : 12,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSalesTrendChart(BoxConstraints constraints) {
    return FutureBuilder(
      future: Future.delayed(const Duration(seconds: 2)),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Shimmer.fromColors(
            baseColor: Colors.grey[300]!,
            highlightColor: Colors.grey[100]!,
            child: Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: EdgeInsets.all(constraints.maxWidth * 0.04),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 16,
                      width: 200,
                      color: Colors.white,
                    ),
                    const SizedBox(height: 16),
                    Container(
                      height: constraints.maxHeight * 0.25,
                      color: Colors.white,
                    ),
                  ],
                ),
              ),
            ),
          );
        } else {
          return Card(
            elevation: 4,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: EdgeInsets.all(constraints.maxWidth * 0.04),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Trend Penjualan 7 Hari Terakhir',
                    style: TextStyle(
                      fontSize: constraints.maxWidth < 360 ? 14 : 16,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: constraints.maxHeight * 0.25,
                    width: double.infinity,
                    child: LineChart(
                      LineChartData(
                        gridData: FlGridData(show: true),
                        titlesData: FlTitlesData(
                          leftTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              reservedSize: constraints.maxWidth < 360 ? 30 : 40,
                              getTitlesWidget: (value, meta) {
                                return Text(
                                  value.toInt().toString(),
                                  style: TextStyle(fontSize: constraints.maxWidth < 360 ? 10 : 12),
                                );
                              },
                            ),
                          ),
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              reservedSize: 30,
                              getTitlesWidget: (value, meta) {
                                final index = value.toInt();
                                if (index >= 0 && index < salesData.length) {
                                  return Padding(
                                    padding: const EdgeInsets.only(top: 8.0),
                                    child: Text(
                                      salesData[index]['date'].substring(5),
                                      style: TextStyle(fontSize: constraints.maxWidth < 360 ? 10 : 12),
                                    ),
                                  );
                                }
                                return const Text('');
                              },
                            ),
                          ),
                          rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        ),
                        borderData: FlBorderData(show: true),
                        lineBarsData: [
                          LineChartBarData(
                            spots: salesData
                                .asMap()
                                .entries
                                .map((e) => FlSpot(e.key.toDouble(), e.value['penjualan'].toDouble()))
                                .toList(),
                            isCurved: true,
                            color: Colors.blue,
                            barWidth: 2,
                          ),
                          LineChartBarData(
                            spots: salesData
                                .asMap()
                                .entries
                                .map((e) => FlSpot(e.key.toDouble(), e.value['pendapatan'].toDouble() / 100000))
                                .toList(),
                            isCurved: true,
                            color: Colors.green,
                            barWidth: 2,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }
      },
    );
  }

  Widget _buildCategoryPieChart(BoxConstraints constraints) {
    return FutureBuilder(
      future: Future.delayed(const Duration(seconds: 2)),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Shimmer.fromColors(
            baseColor: Colors.grey[300]!,
            highlightColor: Colors.grey[100]!,
            child: Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: EdgeInsets.all(constraints.maxWidth * 0.04),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 16,
                      width: 200,
                      color: Colors.white,
                    ),
                    const SizedBox(height: 16),
                    Container(
                      height: constraints.maxHeight * 0.25,
                      color: Colors.white,
                    ),
                  ],
                ),
              ),
            ),
          );
        } else {
          return Card(
            elevation: 4,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: EdgeInsets.all(constraints.maxWidth * 0.04),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Distribusi Kategori Barang',
                    style: TextStyle(
                      fontSize: constraints.maxWidth < 360 ? 14 : 16,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: constraints.maxHeight * 0.25,
                    width: double.infinity,
                    child: PieChart(
                      PieChartData(
                        sections: categoryData
                            .map((e) => PieChartSectionData(
                                  color: e['color'],
                                  value: e['value'].toDouble(),
                                  title: '${e['name']}\n${e['value']}%',
                                  radius: constraints.maxWidth < 360 ? 40 : 50,
                                  titleStyle: TextStyle(
                                    fontSize: constraints.maxWidth < 360 ? 10 : 12,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ))
                            .toList(),
                        sectionsSpace: 2,
                        centerSpaceRadius: constraints.maxWidth < 360 ? 30 : 40,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }
      },
    );
  }

  Widget _buildMonthlyBarChart(BoxConstraints constraints) {
    return FutureBuilder(
      future: Future.delayed(const Duration(seconds: 2)),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Shimmer.fromColors(
            baseColor: Colors.grey[300]!,
            highlightColor: Colors.grey[100]!,
            child: Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: EdgeInsets.all(constraints.maxWidth * 0.04),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 16,
                      width: 200,
                      color: Colors.white,
                    ),
                    const SizedBox(height: 16),
                    Container(
                      height: constraints.maxHeight * 0.25,
                      color: Colors.white,
                    ),
                  ],
                ),
              ),
            ),
          );
        } else {
          return Card(
            elevation: 4,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: EdgeInsets.all(constraints.maxWidth * 0.04),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Performa Bulanan',
                    style: TextStyle(
                      fontSize: constraints.maxWidth < 360 ? 14 : 16,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: constraints.maxHeight * 0.25,
                    width: double.infinity,
                    child: BarChart(
                      BarChartData(
                        alignment: BarChartAlignment.spaceAround,
                        barGroups: monthlyData
                            .asMap()
                            .entries
                            .map((e) => BarChartGroupData(
                                  x: e.key,
                                  barRods: [
                                    BarChartRodData(
                                      toY: e.value['barang'].toDouble(),
                                      color: Colors.blue,
                                      width: constraints.maxWidth < 360 ? 8 : 10,
                                    ),
                                    BarChartRodData(
                                      toY: e.value['terjual'].toDouble(),
                                      color: Colors.green,
                                      width: constraints.maxWidth < 360 ? 8 : 10,
                                    ),
                                  ],
                                  barsSpace: constraints.maxWidth < 360 ? 2 : 4,
                                ))
                            .toList(),
                        titlesData: FlTitlesData(
                          leftTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              reservedSize: constraints.maxWidth < 360 ? 30 : 40,
                              getTitlesWidget: (value, meta) {
                                return Text(
                                  value.toInt().toString(),
                                  style: TextStyle(fontSize: constraints.maxWidth < 360 ? 10 : 12),
                                );
                              },
                            ),
                          ),
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              reservedSize: 30,
                              getTitlesWidget: (value, meta) {
                                final index = value.toInt();
                                if (index >= 0 && index < monthlyData.length) {
                                  return Padding(
                                    padding: const EdgeInsets.only(top: 8.0),
                                    child: Text(
                                      monthlyData[index]['month'],
                                      style: TextStyle(fontSize: constraints.maxWidth < 360 ? 10 : 12),
                                    ),
                                  );
                                }
                                return const Text('');
                              },
                            ),
                          ),
                          rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        ),
                        borderData: FlBorderData(show: true),
                        barTouchData: BarTouchData(enabled: true),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }
      },
    );
  }
}

class NavItem {
  final IconData icon;
  final String label;

  NavItem({required this.icon, required this.label});
}

class DashboardContent extends StatelessWidget {
  const DashboardContent({super.key});

  @override
  Widget build(BuildContext context) {
    return _PenitipDashboardState()._buildDashboardContent();
  }
}