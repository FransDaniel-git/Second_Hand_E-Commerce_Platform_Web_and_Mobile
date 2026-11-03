import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:shimmer/shimmer.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../models/comission.dart';
import 'dart:developer' as developer;

class CommissionDetailScreen extends StatelessWidget {
  final Commission commission;

  const CommissionDetailScreen({super.key, required this.commission});

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return Icons.check_circle;
      case 'pending':
        return Icons.hourglass_empty;
      default:
        return Icons.info;
    }
  }

  String _formatDate(String date) {
    if (date == '-') return 'N/A';
    try {
      final parsedDate = DateTime.parse(date);
      final formatter = DateFormat('d MMMM y', 'id_ID');
      return formatter.format(parsedDate);
    } catch (e) {
      return date.split(' ')[0];
    }
  }

  @override
  Widget build(BuildContext context) {
    final oliveGreen = const Color(0xFF7A7C52);
    final size = MediaQuery.of(context).size;

    // Log the image URL for debugging
    developer.log('Image URL: ${commission.imagePath}',
        name: 'CommissionDetailScreen');

    return Scaffold(
      body: Container(
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
                padding: EdgeInsets.all(size.width * 0.02),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(size.width * 0.025),
                    color: oliveGreen.withOpacity(0.7),
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new_rounded,
                        color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
              ),
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
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
                        blurRadius: size.width * 0.04,
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
                                'Detail ${commission.status == 'Terjual' ? 'Komisi' : 'Barang'}',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: size.width * 0.05,
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
              expandedHeight: size.height * 0.05,
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(size.width * 0.04),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    FadeInUp(
                      duration: const Duration(milliseconds: 600),
                      child: Card(
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(size.width * 0.03),
                        ),
                        child: Container(
                          decoration: BoxDecoration(
                            borderRadius:
                                BorderRadius.circular(size.width * 0.03),
                            gradient: LinearGradient(
                              colors: [Colors.white, Colors.grey[50]!],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            border: Border.all(
                              color: oliveGreen.withOpacity(0.2),
                              width: 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: size.width * 0.025,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          padding: EdgeInsets.all(size.width * 0.04),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Kode: ${commission.commissionId}',
                                    style: TextStyle(
                                      fontSize: size.width * 0.045,
                                      fontWeight: FontWeight.bold,
                                      color: const Color(0xFF1A3C34),
                                    ),
                                  ),
                                  // Tampilkan status dengan warna sesuai status
                                  Container(
                                    padding: EdgeInsets.symmetric(
                                      horizontal: size.width * 0.02,
                                      vertical: size.height * 0.005,
                                    ),
                                    decoration: BoxDecoration(
                                      color: _getStatusColor(commission.status),
                                      borderRadius: BorderRadius.circular(
                                          size.width * 0.02),
                                    ),
                                    child: Text(
                                      commission.status,
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: size.width * 0.025,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: size.height * 0.02),
                              _buildDetailRow(
                                label: 'Nama Barang',
                                value: commission.productName,
                                size: size,
                              ),
                              _buildDetailRow(
                                label: 'Penitip',
                                value: commission.penitipName,
                                size: size,
                              ),
                              _buildDetailRow(
                                label: 'Tanggal Transaksi',
                                value: commission.status == 'Terjual'
                                    ? _formatDate(commission.transactionDate)
                                    : 'N/A',
                                size: size,
                              ),
                              _buildDetailRow(
                                label: 'Tanggal Penitipan',
                                value: _formatDate(commission.consignmentDate),
                                size: size,
                              ),
                              // Hanya tampilkan komisi jika status adalah 'Terjual'
                              if (commission.status == 'Terjual')
                                _buildDetailRow(
                                  label: 'Jumlah Komisi',
                                  value:
                                      'Rp ${NumberFormat("#,##0", "id_ID").format(commission.amount)}',
                                  size: size,
                                  isBold: true,
                                  valueColor: const Color(0xFF7A7C52),
                                ),
                              _buildDetailRow(
                                label: 'Harga Jual',
                                value:
                                    'Rp ${NumberFormat("#,##0", "id_ID").format(commission.sellingPrice)}',
                                size: size,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    SizedBox(height: size.height * 0.02),
                    FadeInUp(
                      duration: const Duration(milliseconds: 800),
                      child: Card(
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(size.width * 0.03),
                        ),
                        child: Container(
                          decoration: BoxDecoration(
                            borderRadius:
                                BorderRadius.circular(size.width * 0.03),
                            gradient: LinearGradient(
                              colors: [Colors.white, Colors.grey[50]!],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            border: Border.all(
                              color: oliveGreen.withOpacity(0.2),
                              width: 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: size.width * 0.025,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          padding: EdgeInsets.all(size.width * 0.04),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Foto Produk',
                                style: TextStyle(
                                  fontSize: size.width * 0.04,
                                  fontWeight: FontWeight.bold,
                                  color: const Color(0xFF1A3C34),
                                ),
                              ),
                              SizedBox(height: size.height * 0.02),
                              Center(
                                child: Container(
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(
                                        size.width * 0.03),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.1),
                                        blurRadius: size.width * 0.02,
                                        offset: const Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(
                                        size.width * 0.03),
                                    child: CachedNetworkImage(
                                      imageUrl: commission.imagePath,
                                      height: size.width * 0.5,
                                      width: size.width * 0.5,
                                      fit: BoxFit.cover,
                                      placeholder: (context, url) =>
                                          Shimmer.fromColors(
                                        baseColor: Colors.grey[300]!,
                                        highlightColor: Colors.grey[100]!,
                                        child: Container(
                                          height: size.width * 0.5,
                                          width: size.width * 0.5,
                                          color: Colors.grey,
                                        ),
                                      ),
                                      errorWidget: (context, url, error) {
                                        developer.log(
                                            'Image load error: $error, URL: $url',
                                            name: 'CommissionDetailScreen');
                                        return Container(
                                          height: size.width * 0.5,
                                          width: size.width * 0.5,
                                          decoration: BoxDecoration(
                                            color: Colors.grey[200],
                                            borderRadius: BorderRadius.circular(
                                                size.width * 0.03),
                                          ),
                                          child: Icon(
                                            Icons.image_not_supported_outlined,
                                            color: Colors.grey,
                                            size: size.width * 0.1,
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    SizedBox(height: size.height * 0.1),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Fungsi untuk mendapatkan warna status
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

  Widget _buildDetailRow({
    required String label,
    required String value,
    required Size size,
    bool isBold = false,
    Color? valueColor,
  }) {
    return Padding(
      padding: EdgeInsets.only(bottom: size.height * 0.015),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: size.width * 0.035,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          Flexible(
            child: Text(
              value,
              style: TextStyle(
                fontSize: size.width * 0.035,
                fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
                color: valueColor ?? const Color(0xFF1A3C34),
              ),
              textAlign: TextAlign.right,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
