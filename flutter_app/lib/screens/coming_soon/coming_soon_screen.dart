import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/movie_provider.dart';
import '../home/widgets/movie_card.dart';

class ComingSoonScreen extends StatelessWidget {
  const ComingSoonScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final movieProvider = context.watch<MovieProvider>();
    final comingSoon = movieProvider.movies.where((m) => m.isUpcoming).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Coming Soon')),
      body: comingSoon.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.upcoming, size: 64, color: Colors.white24),
                  SizedBox(height: 16),
                  Text('No upcoming movies',
                      style: TextStyle(color: Colors.white54, fontSize: 16)),
                ],
              ),
            )
          : GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.7,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: comingSoon.length,
              itemBuilder: (context, index) => MovieCard(
                movie: comingSoon[index],
                onTap: () {
                  Navigator.pushNamed(context, '/movie-details',
                      arguments: comingSoon[index].id);
                },
              ),
            ),
    );
  }
}
