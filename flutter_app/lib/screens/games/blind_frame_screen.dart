import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

class BlindFrameScreen extends StatefulWidget {
  const BlindFrameScreen({super.key});

  @override
  State<BlindFrameScreen> createState() => _BlindFrameScreenState();
}

class _BlindFrameScreenState extends State<BlindFrameScreen> {
  bool _revealed = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Blind Frame')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 250,
                height: 350,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  color: AppColors.bgPanel,
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: _revealed
                      ? Image.network(
                          'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => const Center(child: Text('Poster', style: TextStyle(color: AppColors.textMuted))),
                        )
                      : Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.blur_on, size: 64, color: Colors.white24),
                              const SizedBox(height: 16),
                              const Text('Blurred poster', style: TextStyle(color: AppColors.textMuted)),
                              TextButton(
                                onPressed: () => setState(() => _revealed = true),
                                child: const Text('Reveal', style: TextStyle(color: AppColors.accentGold)),
                              ),
                            ],
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 24),
              const Text('Can you guess the movie?', style: TextStyle(color: AppColors.textMuted, fontSize: 16)),
            ],
          ),
        ),
      ),
    );
  }
}
