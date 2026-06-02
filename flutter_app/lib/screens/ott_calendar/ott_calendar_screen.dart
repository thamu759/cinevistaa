import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/movie_provider.dart';
import '../../theme/app_colors.dart';

class OttCalendarScreen extends StatelessWidget {
  const OttCalendarScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<MovieProvider>();
    final ottMovies = provider.upcomingOttMovies;

    return Scaffold(
      appBar: AppBar(title: const Text('OTT Calendar')),
      body: ottMovies.isEmpty
          ? const Center(child: Text('No OTT releases found', style: TextStyle(color: AppColors.textMuted)))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: ottMovies.length,
              itemBuilder: (context, index) {
                final movie = ottMovies[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: const Icon(Icons.tv, color: AppColors.accentGold),
                    title: Text(movie.title, style: const TextStyle(color: AppColors.textMain)),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (movie.ott?.platform != null)
                          Text('Platform: ${movie.ott!.platform}', style: const TextStyle(color: AppColors.textMuted)),
                        if (movie.ott?.releaseDate != null)
                          Text('Release: ${movie.ott!.releaseDate}', style: const TextStyle(color: AppColors.accentGold)),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
