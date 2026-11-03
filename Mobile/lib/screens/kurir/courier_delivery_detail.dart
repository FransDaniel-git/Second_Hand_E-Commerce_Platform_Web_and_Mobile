import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:animate_do/animate_do.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../otentikasi/login.dart';

String _formatDate(String date) {
  try {
    final parsedDate = DateTime.parse(date);
    final formatter = DateFormat('d MMMM y HH:mm', 'id_ID');
    return formatter.format(parsedDate);
  } catch (e) {
    return date;
  }
}

class CourierDeliveryDetailScreen extends StatefulWidget {
  final Map<String, dynamic> delivery;
  final VoidCallback onStatusUpdated;

  const CourierDeliveryDetailScreen({
    super.key,
    required this.delivery,
    required this.onStatusUpdated,
  });

  @override
  _CourierDeliveryDetailScreenState createState() =>
      _CourierDeliveryDetailScreenState();
}

class _CourierDeliveryDetailScreenState
    extends State<CourierDeliveryDetailScreen> {
  Future<void> _updateStatus() async {
    String? newStatus;
    String confirmationMessage;
    String actionText;

    if (widget.delivery['status'] == 'Siap Dikirim') {
      newStatus = 'Sedang Dikirim';
      confirmationMessage = 'Konfirmasi bahwa pengiriman telah dimulai?';
      actionText = 'Konfirmasi Pengiriman';
    } else if (widget.delivery['status'] == 'Sedang Dikirim') {
      newStatus = 'Sudah Diterima';
      confirmationMessage = 'Konfirmasi bahwa pengiriman telah diterima?';
      actionText = 'Konfirmasi Diterima';
    } else {
      return; // No action for 'Sudah Diterima' or other statuses
    }

    final size = MediaQuery.of(context).size;
    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(size.width * 0.04),
        ),
        title: Text(
          'Konfirmasi Status',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: const Color(0xFF7A7C52),
            fontSize: size.width * 0.045,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        content: Text(
          confirmationMessage,
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
              actionText,
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
      try {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('token');
        if (token == null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => const LoginScreen()),
            );
          });
          return;
        }

        print(
            'Sending request to update status: $newStatus for id_penjualan: ${widget.delivery['id_penjualan']}'); // Debug log

        final response = await http.put(
          Uri.parse(
              'http://10.0.2.2:8000/api/kurir/transaksi-penjualan/${widget.delivery['id_penjualan']}'),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
          body: jsonEncode({
            'STATUS': newStatus,
          }),
        );

        if (response.statusCode == 200) {
          setState(() {
            widget.delivery['status'] = newStatus;
          });
          widget.onStatusUpdated();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Status diubah menjadi $newStatus',
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
        } else {
          final responseBody = jsonDecode(response.body);
          final errorMessage = responseBody['message'] ??
              'Gagal memperbarui status: ${response.statusCode}';
          print(
              'API Error: ${response.statusCode}, Response: ${response.body}'); // Debug log
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                errorMessage,
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
      } catch (e) {
        print('Exception during status update: $e'); // Debug log
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Error memperbarui status: $e',
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

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Sudah Diterima':
        return Colors.green;
      case 'Sedang Dikirim':
        return Colors.blue;
      case 'Siap Dikirim':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'Sudah Diterima':
        return Icons.check_circle;
      case 'Sedang Dikirim':
        return Icons.local_shipping;
      case 'Siap Dikirim':
        return Icons.hourglass_empty;
      default:
        return Icons.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    const oliveGreen = Color(0xFF7A7C52);

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
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(size.width * 0.06),
                      bottomRight: Radius.circular(size.width * 0.06),
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
                                'Detail Pengiriman',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: size.width * 0.05,
                                  fontWeight: FontWeight.bold,
                                  height: 1,
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
                              colors: [
                                Colors.white,
                                Colors.grey[50]!,
                              ],
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
                                mainAxisAlignment: MainAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Text(
                                      '${widget.delivery['order_id']}',
                                      style: TextStyle(
                                        fontSize: size.width * 0.045,
                                        fontWeight: FontWeight.bold,
                                        color: const Color(0xFF1A3C34),
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  Container(
                                    padding: EdgeInsets.symmetric(
                                      horizontal: size.width * 0.03,
                                      vertical: size.height * 0.01,
                                    ),
                                    decoration: BoxDecoration(
                                      color: _getStatusColor(
                                              widget.delivery['status'])
                                          .withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(
                                          size.width * 0.03),
                                      border: Border.all(
                                        color: _getStatusColor(
                                                widget.delivery['status'])
                                            .withOpacity(0.3),
                                        width: 1,
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                          _getStatusIcon(
                                              widget.delivery['status']),
                                          color: _getStatusColor(
                                              widget.delivery['status']),
                                          size: size.width * 0.032,
                                        ),
                                        SizedBox(width: size.width * 0.01),
                                        Text(
                                          widget.delivery['status'],
                                          style: TextStyle(
                                            fontSize: size.width * 0.025,
                                            fontWeight: FontWeight.w600,
                                            color: _getStatusColor(
                                                widget.delivery['status']),
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: size.height * 0.02),
                              _buildDetailRow('Pelanggan',
                                  widget.delivery['customer_name']),
                              _buildAddressRow(
                                  'Alamat', widget.delivery['address']),
                              _buildDetailRow('Tanggal',
                                  _formatDate(widget.delivery['date'])),
                              _buildDetailRow(
                                  'Status', widget.delivery['status']),
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
                              colors: [
                                Colors.white,
                                Colors.grey[50]!,
                              ],
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
                                'Items in Delivery',
                                style: TextStyle(
                                  fontSize: size.width * 0.04,
                                  fontWeight: FontWeight.bold,
                                  color: const Color(0xFF1A3C34),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              SizedBox(height: size.height * 0.02),
                              ...(widget.delivery['items'] as List<dynamic>? ??
                                      [])
                                  .map((item) => Padding(
                                        padding: EdgeInsets.only(
                                            bottom: size.height * 0.015),
                                        child: Row(
                                          children: [
                                            ClipRRect(
                                              borderRadius:
                                                  BorderRadius.circular(
                                                      size.width * 0.03),
                                              child: CachedNetworkImage(
                                                imageUrl:
                                                    item['image'] as String,
                                                height: size.width * 0.15,
                                                width: size.width * 0.15,
                                                fit: BoxFit.cover,
                                                placeholder: (context, url) =>
                                                    Shimmer.fromColors(
                                                  baseColor: Colors.grey[300]!,
                                                  highlightColor:
                                                      Colors.grey[100]!,
                                                  child: Container(
                                                    color: Colors.grey,
                                                  ),
                                                ),
                                                errorWidget:
                                                    (context, url, error) =>
                                                        Container(
                                                  height: size.width * 0.15,
                                                  width: size.width * 0.15,
                                                  decoration: BoxDecoration(
                                                    color: Colors.grey[200],
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            size.width * 0.03),
                                                  ),
                                                  child: Icon(
                                                    Icons
                                                        .image_not_supported_outlined,
                                                    color: Colors.grey,
                                                    size: size.width * 0.08,
                                                  ),
                                                ),
                                              ),
                                            ),
                                            SizedBox(width: size.width * 0.04),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    item['name'] as String,
                                                    style: TextStyle(
                                                      fontSize:
                                                          size.width * 0.037,
                                                      fontWeight:
                                                          FontWeight.w600,
                                                      color: const Color(
                                                          0xFF1A3C34),
                                                    ),
                                                    maxLines: 2,
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                  ),
                                                  SizedBox(
                                                      height:
                                                          size.height * 0.01),
                                                  Text(
                                                    item['price'] as String,
                                                    style: TextStyle(
                                                      fontSize:
                                                          size.width * 0.035,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                      color: const Color(
                                                          0xFF7A7C52),
                                                    ),
                                                    maxLines: 1,
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ))
                                  .toList(),
                            ],
                          ),
                        ),
                      ),
                    ),
                    SizedBox(height: size.height * 0.02),
                    FadeInUp(
                      duration: const Duration(milliseconds: 1000),
                      child: Align(
                        alignment: Alignment.centerRight,
                        child: ElevatedButton(
                          onPressed:
                              widget.delivery['status'] == 'Sudah Diterima'
                                  ? null
                                  : _updateStatus,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF7A7C52),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius:
                                  BorderRadius.circular(size.width * 0.02),
                            ),
                            padding: EdgeInsets.symmetric(
                              horizontal: size.width * 0.04,
                              vertical: size.height * 0.01,
                            ),
                            elevation: 2,
                          ),
                          child: Text(
                            widget.delivery['status'] == 'Siap Dikirim'
                                ? 'Konfirmasi Pengiriman'
                                : widget.delivery['status'] == 'Sedang Dikirim'
                                    ? 'Konfirmasi Diterima'
                                    : 'Selesai',
                            style: TextStyle(
                              fontSize: size.width * 0.035,
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ),
                    ),
                    SizedBox(height: size.height * 0.04),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value,
      {bool isBold = false, Color? valueColor}) {
    final size = MediaQuery.of(context).size;
    return Padding(
      padding: EdgeInsets.only(bottom: size.height * 0.01),
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
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
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

  Widget _buildAddressRow(String label, String value) {
    final size = MediaQuery.of(context).size;
    return Padding(
      padding: EdgeInsets.only(bottom: size.height * 0.01),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: size.width * 0.035,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          SizedBox(width: size.width * 0.04),
          Flexible(
            child: Text(
              value,
              style: TextStyle(
                fontSize: size.width * 0.035,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF1A3C34),
              ),
              textAlign: TextAlign.right,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
