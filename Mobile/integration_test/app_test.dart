import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:p3l_mobile/screens/dashboard.dart';
import 'package:p3l_mobile/screens/hunter/hunter_dashboard.dart';
import 'package:p3l_mobile/screens/kurir/courier_dashboard.dart';
import 'package:p3l_mobile/screens/otentikasi/login.dart';
import 'package:p3l_mobile/screens/penitip/dashboardPenitip.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  Widget appUnderTest() {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: const LoginScreen(),
      routes: {
        '/pembeli_dashboard': (_) => const PembeliDashboard(),
        '/penitip_dashboard': (_) => const PenitipDashboard(),
        '/hunter_dashboard': (_) => const HunterDashboard(),
        '/kurir_dashboard': (_) => const CourierDashboard(),
      },
    );
  }

  Future<void> resetSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  Future<void> login(WidgetTester tester, String email) async {
    await resetSession();
    await tester.pumpWidget(appUnderTest());
    await tester.pump(const Duration(milliseconds: 500));

    final fields = find.byType(TextFormField);
    expect(fields, findsNWidgets(2));

    await tester.enterText(fields.at(0), email);
    await tester.enterText(fields.at(1), '123456');
    await tester.tap(find.widgetWithText(ElevatedButton, 'Login'));
    await tester.pump();
  }

  Future<void> waitFor(
    WidgetTester tester,
    Finder finder, {
    Duration timeout = const Duration(seconds: 30),
  }) async {
    final end = DateTime.now().add(timeout);
    while (DateTime.now().isBefore(end)) {
      await tester.pump(const Duration(milliseconds: 250));
      if (finder.evaluate().isNotEmpty) {
        return;
      }
    }
    fail('Widget tidak ditemukan: $finder');
  }

  Future<void> tapNav(WidgetTester tester, String label) async {
    final target = find.text(label).last;
    await tester.ensureVisible(target);
    await tester.tap(target);
    await tester.pump(const Duration(milliseconds: 500));
  }

  testWidgets('KURIR - login, dashboard, deliveries, profile', (tester) async {
    await login(tester, 'ahmad.kurir1@email.com');
    await waitFor(tester, find.text('Courier Dashboard'));
    await waitFor(tester, find.textContaining('Halo, Ahmad Fauzi'));

    await tapNav(tester, 'Deliveries');
    await waitFor(tester, find.text('Riwayat Pengiriman'));

    await tapNav(tester, 'Profile');
    await waitFor(tester, find.text('Informasi Kontak'));
  });

  testWidgets('HUNTER - login, dashboard, commissions, profile',
      (tester) async {
    await login(tester, 'gilang.hunter1@email.com');
    await waitFor(tester, find.text('Hunter Dashboard'));
    await waitFor(tester, find.textContaining('Halo, Gilang Pratama'));

    await tapNav(tester, 'Commissions');
    await waitFor(tester, find.text('Riwayat Komisi'));

    await tapNav(tester, 'Profile');
    await waitFor(tester, find.text('Informasi Kontak'));
  });

  testWidgets('PEMBELI 2 - login, home, catalogue, orders, profile',
      (tester) async {
    await login(tester, 'sinclaircollins17@gmail.com');
    await waitFor(tester, find.textContaining('Kesempatan Baru'));

    await tapNav(tester, 'Catalogue');
    await waitFor(
      tester,
      find.textContaining('Temukan produk preloved'),
    );

    await tapNav(tester, 'Orders');
    await waitFor(tester, find.text('Riwayat Pesanan'));

    await tapNav(tester, 'Profile');
    await waitFor(tester, find.text('Informasi Kontak'));
  });

  testWidgets('PENITIP - login, dashboard, daftar barang, profile',
      (tester) async {
    await login(tester, 'mega10@mail.com');
    await waitFor(tester, find.text('Selamat Datang di Dashboard Penitip!'));

    await tapNav(tester, 'Daftar Barang');
    await waitFor(tester, find.textContaining('Barang Titipan'));

    await tapNav(tester, 'Profile');
    await waitFor(tester, find.text('Informasi Kontak'));
  });
}
