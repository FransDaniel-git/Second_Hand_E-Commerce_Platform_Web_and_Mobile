import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/otentikasi/login.dart';
import 'screens/otentikasi/register.dart';
import 'screens/dashboard.dart';
import 'screens/hunter/hunter_dashboard.dart';
import 'screens/kurir/courier_dashboard.dart';
import 'screens/penitip/dashboardPenitip.dart';
import 'screens/otentikasi/loadingPage.dart';
import 'firebase_options.dart';
import 'services/auth_service.dart';
import 'services/notification_service.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  print('Handling background message: ${message.messageId}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  FlutterNativeSplash.preserve(widgetsBinding: WidgetsBinding.instance);

  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  final authService = AuthService();
  final token = await authService.getToken();
  if (token != null) {
    final fcmToken = await FirebaseMessaging.instance.getToken();
    if (fcmToken != null) {
      await authService.sendFcmTokenToBackend(fcmToken);
    }
  }

  FirebaseMessaging.instance.onTokenRefresh.listen((fcmToken) async {
    await authService.sendFcmTokenToBackend(fcmToken);
    print('FCM token refreshed: $fcmToken');
  }).onError((err) {
    print('Error refreshing FCM token: $err');
  });

  FlutterNativeSplash.remove();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  Future<Widget> _getInitialScreen() async {
    final authService = AuthService();
    final token = await authService.getToken();
    if (token == null) {
      return const PembeliDashboard(); // Default to LoginScreen if no token
    }

    final userType = await authService.getUserType();
    final role = await authService.getRole();
    if (userType == 'pembeli' && role == 'pembeli') {
      return const PembeliDashboard();
    } else if (userType == 'penitip' && role == 'penitip') {
      return const PenitipDashboard();
    } else if (userType == 'pegawai' && role == 'hunter') {
      return const HunterDashboard();
    } else if (userType == 'pegawai' && role == 'kurir') {
      return const CourierDashboard();
    }
    return const LoginScreen(); // Fallback to LoginScreen for invalid roles
  }

  @override
  Widget build(BuildContext context) {
    final notificationService = NotificationService();

    return MaterialApp(
      title: 'ReuseMart',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: const Color(0xFF4A5E2A),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF4A5E2A),
        ),
        useMaterial3: true,
        fontFamily: 'Poppins',
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.grey[100],
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey[300]!),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey[300]!),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF4A5E2A)),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF4A5E2A),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
        ),
      ),
      // Set initialRoute to avoid conflicts with home
      initialRoute: '/loading',
      routes: {
        '/loading': (context) => FutureBuilder<Widget>(
              future: _getInitialScreen(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const SplashScreen();
                }
                return snapshot.data ?? const LoginScreen();
              },
            ),
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/pembeli_dashboard': (context) => const PembeliDashboard(),
        '/hunter_dashboard': (context) => const HunterDashboard(),
        '/kurir_dashboard': (context) => const CourierDashboard(),
        '/penitip_dashboard': (context) => const PenitipDashboard(),
      },
      builder: (context, child) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          notificationService.initialize(context);
          notificationService.checkInitialMessage(context);
        });
        return child!;
      },
    );
  }
}

extension AuthServiceExtension on AuthService {
  Future<String?> getUserType() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('user_type');
  }
}
