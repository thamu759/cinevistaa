import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/movie_provider.dart';

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
          const Text('Staff Picks', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 12),
          ...staffPicks.map((movie) => Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: const Icon(Icons.article, color: Color(0xFFF5C518)),
              title: Text(movie.title, style: const TextStyle(color: Colors.white)),
              subtitle: Text('Critic Score: ${movie.criticScore}', style: const TextStyle(color: Colors.white54)),
              onTap: () => Navigator.pushNamed(context, '/article-detail', arguments: movie.id),
            ),
          )),
        ],
      ),
    );
  }
}
