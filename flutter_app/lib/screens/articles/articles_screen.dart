import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/movie_provider.dart';
import '../../theme/app_colors.dart';

class ArticlesScreen extends StatelessWidget {
  const ArticlesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<MovieProvider>();
    final staffPicks = provider.staffPicks;

    return Scaffold(
      appBar: AppBar(title: const Text('Articles & Critique')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Staff Picks', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textMain)),
          const SizedBox(height: 12),
          ...staffPicks.map((movie) => Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: const Icon(Icons.article, color: AppColors.accent),
              title: Text(movie.title, style: const TextStyle(color: AppColors.textMain)),
              subtitle: Text('Critic Score: ${movie.criticScore}', style: const TextStyle(color: AppColors.textMuted)),
              onTap: () => Navigator.pushNamed(context, '/article-detail', arguments: movie.id),
            ),
          )),
        ],
      ),
    );
  }
}
