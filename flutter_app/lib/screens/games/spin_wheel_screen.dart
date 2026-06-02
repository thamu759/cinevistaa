import 'dart:math';
import 'package:flutter/material.dart';

class SpinWheelScreen extends StatefulWidget {
  const SpinWheelScreen({super.key});

  @override
  State<SpinWheelScreen> createState() => _SpinWheelScreenState();
}

class _SpinWheelScreenState extends State<SpinWheelScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  final _movies = ['Inception', 'Interstellar', 'Dune', 'The Batman', 'Blade Runner', 'Oppenheimer'];
  String? _result;
  bool _isSpinning = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    );
    _animation = CurvedAnimation(parent: _controller, curve: Curves.easeOut);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _spin() {
    if (_isSpinning) return;
    setState(() {
      _isSpinning = true;
      _result = null;
    });
    _controller.reset();
    _controller.forward().then((_) {
      final index = Random().nextInt(_movies.length);
      setState(() {
        _result = _movies[index];
        _isSpinning = false;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Card Flix')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedBuilder(
              animation: _animation,
              builder: (context, child) {
                return Transform.rotate(
                  angle: _animation.value * 2 * pi,
                  child: Container(
                    width: 200,
                    height: 200,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const SweepGradient(
                        colors: [
                          Color(0xFFE50914),
                          Color(0xFFF5C518),
                          Color(0xFFE50914),
                        ],
                      ),
                    ),
                    child: Center(
                      child: Container(
                        width: 60,
                        height: 60,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFF0A0A0F),
                        ),
                        child: const Icon(Icons.movie, color: Colors.white, size: 30),
                      ),
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 32),
            if (_result != null)
              Column(
                children: [
                  const Text('Your movie:', style: TextStyle(color: Colors.white54, fontSize: 16)),
                  const SizedBox(height: 8),
                  Text(_result!, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
                ],
              ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _spin,
              child: Text(_isSpinning ? 'Spinning...' : 'Spin the Wheel'),
            ),
          ],
        ),
      ),
    );
  }
}
