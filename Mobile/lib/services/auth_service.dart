import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  static const String baseUrl = 'http://10.0.2.2:8000/api/auth';

  // Jangan akses Firebase saat object dibuat. FirebaseMessaging.instance
  // melempar error jika Firebase belum diinisialisasi (mis. integration test).
  FirebaseMessaging get _messaging => FirebaseMessaging.instance;

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  Future<String?> getRole() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('role');
  }

  Future<String?> getUserType() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('user_type');
  }

  Future<String?> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('user_id');
  }

  Future<void> _requestNotificationPermission() async {
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );
    if (settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional) {
      print('Notification permission granted');
    } else {
      print('Notification permission denied');
    }
  }

  Future<void> sendFcmTokenToBackend(String? fcmToken) async {
    if (fcmToken == null) return;
    final token = await getToken();
    if (token == null) return;

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/update-fcm-token'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'fcm_token': fcmToken}),
      );

      if (response.statusCode == 200) {
        print('FCM token sent to backend');
      } else {
        print('Failed to send FCM token: ${response.body}');
      }
    } catch (e) {
      print('Error sending FCM token: $e');
    }
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'EMAIL': email,
          'PASSWORD': password,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', data['token']);
        await prefs.setString('user_type', data['user_type']);
        await prefs.setString('role', data['user']['role'][0] ?? '');
        await prefs.setString('user_id', data['user']['id'].toString());

        // Notifikasi/Firebase bersifat opsional. Jangan gagalkan login hanya
        // karena Firebase belum tersedia (mis. saat integration test).
        try {
          await _requestNotificationPermission();
          final fcmToken = await _messaging.getToken();
          if (fcmToken != null) {
            await sendFcmTokenToBackend(fcmToken);
            print('FCM Token: $fcmToken');
          }
        } catch (e) {
          print('Notification setup skipped: $e');
        }

        return {
          'success': true,
          'data': {
            'token': data['token'],
            'user_type': data['user_type'],
            'role': data['user']['role'][0],
            'user_id': data['user']['id'],
          },
        };
      } else {
        return {
          'success': false,
          'message': data['error'] ?? 'Login failed due to an unknown error.',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error occurred. Please try again later.',
      };
    }
  }

  Future<Map<String, dynamic>> register(
    String nama,
    String email,
    String telepon,
    String password,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/register/pembeli'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'NAMA': nama,
          'EMAIL': email,
          'TELEPON': telepon,
          'PASSWORD': password,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 201) {
        await _requestNotificationPermission();
        final fcmToken = await _messaging.getToken();
        if (fcmToken != null) {
          print('FCM token retrieved: $fcmToken');
        }

        return {
          'success': true,
          'message': data['message'],
        };
      } else {
        return {
          'success': false,
          'message': data['errors']?['EMAIL']?.first ??
              data['message'] ??
              'Registration failed.',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error occurred. Please try again later.',
      };
    }
  }

  Future<Map<String, dynamic>> logout() async {
    try {
      final token = await getToken();
      final prefs = await SharedPreferences.getInstance();

      if (token == null) {
        await prefs.remove('token');
        await prefs.remove('user_type');
        await prefs.remove('role');
        await prefs.remove('user_id');
        return {'success': true, 'message': 'Logged out locally'};
      }

      final response = await http.post(
        Uri.parse('$baseUrl/logout'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      await prefs.remove('token');
      await prefs.remove('user_type');
      await prefs.remove('role');
      await prefs.remove('user_id');

      if (response.statusCode == 200) {
        return {'success': true, 'message': 'Successfully logged out'};
      } else {
        return {
          'success': true,
          'message': 'Logged out locally, but server sync failed',
        };
      }
    } catch (e) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('token');
      await prefs.remove('user_type');
      await prefs.remove('role');
      await prefs.remove('user_id');
      return {
        'success': true,
        'message': 'Logged out locally due to network error',
      };
    }
  }
}
