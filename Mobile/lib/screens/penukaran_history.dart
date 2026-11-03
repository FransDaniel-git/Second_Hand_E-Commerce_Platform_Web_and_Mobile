import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:animate_do/animate_do.dart';

class PenukaranHistoryScreen extends StatefulWidget {
  const PenukaranHistoryScreen({super.key});

  @override
  State<PenukaranHistoryScreen> createState() => _PenukaranHistoryScreenState();
}

class _PenukaranHistoryScreenState extends State<PenukaranHistoryScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  List<dynamic> penukaran = [];

  @override
  void initState() {
    super.initState();
    _fetchPenukaran();
  }

  Future<void> _fetchPenukaran() async {
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
        Uri.parse('http://10.0.2.2:8000/api/penukaran'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          penukaran = data is List ? data : [data];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage =
              'Gagal memuat riwayat penukaran. Status: ${response.statusCode}';
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

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final baseFontSize =
        size.width < 360 ? size.width * 0.035 : size.width * 0.04;

    return Scaffold(
      backgroundColor: Colors.grey[100],
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            floating: false,
            elevation: 8,
            backgroundColor: Colors.transparent,
            expandedHeight: size.height * 0.01,
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
                    child: Padding(
                      padding: EdgeInsets.all(size.width * 0.04),
                      child: Row(
                        children: [
                          SizedBox(width: size.width * 0.1),
                          Expanded(
                            child: FadeInDown(
                              duration: const Duration(milliseconds: 800),
                              child: Text(
                                'Riwayat Penukaran',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: baseFontSize * 1.25,
                                  fontWeight: FontWeight.bold,
                                  height: 1.2,
                                ),
                                maxLines: 1,
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
            ),
          ),
          SliverToBoxAdapter(
            child: _isLoading
                ? Center(
                    child: CircularProgressIndicator(
                      color: Color(0xFF77784A),
                    ),
                  )
                : _errorMessage != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.error_outline,
                              color: Colors.redAccent,
                              size: baseFontSize * 1.25,
                            ),
                            SizedBox(height: size.height * 0.01),
                            Text(
                              _errorMessage!,
                              style: TextStyle(
                                fontSize: baseFontSize,
                                color: Colors.black54,
                                fontWeight: FontWeight.w500,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      )
                    : penukaran.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.history_toggle_off,
                                  color: Colors.grey,
                                  size: baseFontSize * 1.25,
                                ),
                                SizedBox(height: size.height * 0.01),
                                Text(
                                  'Belum ada riwayat penukaran.',
                                  style: TextStyle(
                                    fontSize: baseFontSize,
                                    color: Colors.grey[600],
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : Padding(
                            padding: EdgeInsets.symmetric(
                              horizontal: size.width * 0.03,
                              vertical: size.height * 0,
                            ),
                            child: ListView.builder(
                              shrinkWrap: true,
                              physics: NeverScrollableScrollPhysics(),
                              itemCount: penukaran.length,
                              itemBuilder: (context, index) {
                                final item = penukaran[index];
                                return Card(
                                  color: Colors.white,
                                  elevation: 5,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(15),
                                  ),
                                  margin: EdgeInsets.symmetric(
                                    vertical: size.height * 0.01,
                                    
                                  ),
                                  child: Padding(
                                    padding: EdgeInsets.all(size.width * 0.04),
                                    child: Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Container(
                                          padding:
                                              EdgeInsets.all(size.width * 0.02),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF77784A)
                                                .withOpacity(0.1),
                                            borderRadius:
                                                BorderRadius.circular(10),
                                          ),
                                          child: Icon(
                                            Icons.redeem,
                                            color: Color(0xFF77784A),
                                            size: baseFontSize * 0.7,
                                          ),
                                        ),
                                        SizedBox(width: size.width * 0.04),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                item['NAMA_MERCHANDISE'] ??
                                                    'Nama Tidak Tersedia',
                                                style: TextStyle(
                                                  fontSize: baseFontSize,
                                                  fontWeight: FontWeight.bold,
                                                  color: Colors.black87,
                                                ),
                                              ),
                                              SizedBox(
                                                  height: size.height * 0.006),
                                              Text(
                                                'Tanggal: ${item['TANGGAL_PENUKARAN'] ?? 'Tidak Tersedia'}',
                                                style: TextStyle(
                                                  fontSize:
                                                      baseFontSize * 0.875,
                                                  color: Colors.grey[600],
                                                ),
                                              ),
                                              SizedBox(
                                                  height: size.height * 0.004),
                                              Text(
                                                'Kode Penukaran: ${item['KODE_PENUKARAN'] ?? 'Tidak Tersedia'}',
                                                style: TextStyle(
                                                  fontSize:
                                                      baseFontSize * 0.875,
                                                  color: Colors.grey[600],
                                                ),
                                              ),
                                              SizedBox(
                                                  height: size.height * 0.004),
                                              Text(
                                                'Tanggal Diklaim: ${item['TANGGAL_DIKLAIM'] ?? 'Belum Diklaim'}',
                                                style: TextStyle(
                                                  fontSize:
                                                      baseFontSize * 0.875,
                                                  color:
                                                      item['TANGGAL_DIKLAIM'] ==
                                                              null
                                                          ? Colors.orangeAccent
                                                          : Colors.grey[600],
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Container(
                                          padding: EdgeInsets.symmetric(
                                            horizontal: size.width * 0.03,
                                            vertical: size.height * 0.01,
                                          ),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF77784A)
                                                .withOpacity(0.9),
                                            borderRadius:
                                                BorderRadius.circular(12),
                                          ),
                                          child: Text(
                                            '${item['POIN_DIGUNAKAN'] ?? '0'} Poin',
                                            style: TextStyle(
                                              fontSize: baseFontSize * 0.875,
                                              color: Colors.white,
                                              fontWeight: FontWeight.w600,
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
        ],
      ),
    );
  }
}
