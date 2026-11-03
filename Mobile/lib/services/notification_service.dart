import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:p3l_mobile/services/auth_service.dart';

class NotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  void initialize(BuildContext context) {
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Received foreground message: ${message.messageId}');
      print(
          'Foreground message: ${message.notification?.title} - ${message.notification?.body}');
      print('Data: ${message.data}');
      if (message.notification != null) {
        _showNotificationDialog(
          context,
          message.notification!.title ?? 'Notification',
          message.notification!.body ?? '',
          message.data,
        );
      } else {
        print('No notification payload, handling data only: ${message.data}');
      }
    });

    // Handle message opened from background/terminated state
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('Message opened from background: ${message.messageId}');
      print('Background message data: ${message.data}');
      _handleNotificationNavigation(context, message.data);
    });
  }

  Future<void> checkInitialMessage(BuildContext context) async {
    RemoteMessage? initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      print('App opened from terminated state: ${initialMessage.messageId}');
      print('Initial message data: ${initialMessage.data}');
      _handleNotificationNavigation(context, initialMessage.data);
    } else {
      print('No initial message found');
    }
  }

  void _showNotificationDialog(BuildContext context, String title, String body,
      Map<String, dynamic> data) {
    print('Showing notification dialog: $title, $body, Data: $data');
    try {
      showDialog(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: Text(title),
          content: Text(body),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
                _handleNotificationNavigation(dialogContext, data);
              },
              child: const Text('View'),
            ),
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Dismiss'),
            ),
          ],
        ),
      ).catchError((error) {
        print('Error showing dialog: $error');
      });
    } catch (e) {
      print('Exception in showDialog: $e');
    }
  }

  void _handleNavigation(
      BuildContext context, String role, Map<String, dynamic> data) {
    print('Navigating with role: $role, Data: $data');
    try {
      if (role == 'kurir' && data.containsKey('transaksi_id')) {
        print(
            'Navigating to kurir_dashboard with transaksi_id: ${data['transaksi_id']}');
        Navigator.pushNamed(context, '/kurir_dashboard', arguments: {
          'tab': 'transactions',
          'transaksi_id': data['transaksi_id'],
          'schedule_date': data['schedule_date'],
          'session_time': data['session_time'],
        });
      } else if (role == 'pembeli' && data.containsKey('transaksi_id')) {
        print(
            'Navigating to pembeli_dashboard with transaksi_id: ${data['transaksi_id']}');
        Navigator.pushNamed(context, '/pembeli_dashboard', arguments: {
          'tab': 'transactions',
          'transaksi_id': data['transaksi_id'],
        });
      } else if (role == 'penitip' && data.containsKey('barang_id')) {
        print(
            'Navigating to penitip_dashboard with barang_id: ${data['barang_id']}');
        Navigator.pushNamed(context, '/penitip_dashboard', arguments: {
          'tab': 'products',
          'barang_id': data['barang_id'],
        });
      } else {
        print('No matching navigation condition for role: $role, data: $data');
      }
    } catch (e) {
      print('Navigation error: $e');
    }
  }

  void _handleNotificationNavigation(
      BuildContext context, Map<String, dynamic> data) {
    print('Handling notification navigation with data: $data');
    AuthService().getRole().then((role) {
      print('User role: $role');
      if (role == null) {
        print('No role found, skipping navigation');
        return;
      }
      _handleNavigation(context, role, data);
    }).catchError((error) {
      print('Error retrieving role: $error');
    });
  }
}
