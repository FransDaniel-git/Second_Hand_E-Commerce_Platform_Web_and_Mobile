import 'package:flutter/material.dart';
import 'login.dart';
import 'package:p3l_mobile/screens/dashboard.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF2F3E2A),
      body: SafeArea(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Logo
            Padding(
              padding: const EdgeInsets.fromLTRB(30, 110, 0, 0),
              child: Opacity(
                opacity: 0.4, // Adjust opacity here (0.0 to 1.0)
                child: Image.asset(
                  'assets/images/logobig.png',
                  height: 230,
                ),
              ),
            ),
            const SizedBox(
                height: 50), // Minimal spacing between logo and quote
            // Quote
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 30.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '\u201D', // Curly quote opening
                    style: TextStyle(
                      fontFamily: 'Poppins',
                      fontSize: 60,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      height: 0.3,
                    ),
                  ),
                  const Text(
                    'Reuse before you refuse. A second life for things means a better life for all.',
                    textAlign: TextAlign.justify,
                    style: TextStyle(
                      fontFamily: 'Poppins',
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 18),
                  const Text(
                    '- ReuseMart',
                    style: TextStyle(
                      fontFamily: 'Poppins',
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                      fontStyle: FontStyle.italic,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
            const Spacer(), // Pushes button to the bottom
            // Get Started Button
            Padding(
              padding:
                  const EdgeInsets.only(bottom: 40.0, left: 24.0, right: 24.0),
              child: SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                          builder: (context) => const PembeliDashboard()),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4A5E2A),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Text(
                        'Get Started',
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      SizedBox(width: 8),
                      Icon(
                        Icons.chevron_right,
                        color: Colors.white,
                        size: 20,
                      ),
                    ],
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
