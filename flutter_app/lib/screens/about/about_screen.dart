import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('About ThiraiPedia')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Thirai', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppColors.textMain)),
              Text('Pedia', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w300, color: AppColors.accent)),
            ],
          ),
          const SizedBox(height: 8),
          const Center(child: Text('Premium Film Critique & Reviews', style: TextStyle(color: AppColors.textMuted))),
          const SizedBox(height: 32),
          _section('Our Mission',
              'ThiraiPedia is built for movie enthusiasts who believe cinema is more than entertainment — it is an art form. We provide a platform for honest, curated reviews and thoughtful critique.'),
          _section('What We Offer',
              'From the latest blockbusters to regional cinema in Tamil and Malayalam, our community rates and reviews films across languages and genres.'),
          _section('Our Community',
              'We believe the best film criticism comes from passionate audiences. Whether you are a casual viewer or a dedicated cinephile, your voice matters here.'),
          _section('Powered by TMDB',
              'Movie data and images on ThiraiPedia are provided by The Movie Database (TMDB). This product uses the TMDB API but is not endorsed or certified by TMDB.'),
        ],
      ),
    );
  }

  Widget _section(String heading, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(heading, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textMain)),
          const SizedBox(height: 8),
          Text(text, style: const TextStyle(color: AppColors.textMuted, fontSize: 14, height: 1.5)),
        ],
      ),
    );
  }
}
