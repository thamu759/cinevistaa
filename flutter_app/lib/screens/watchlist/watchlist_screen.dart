import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/movie_provider.dart';
import '../../providers/watchlist_provider.dart';
import '../home/widgets/movie_card.dart';

class WatchlistScreen extends StatefulWidget {
  const WatchlistScreen({super.key});

  @override
  State<WatchlistScreen> createState() => _WatchlistScreenState();
}

class _WatchlistScreenState extends State<WatchlistScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<WatchlistProvider>().loadWatchlist();
    });
  }

  @override
  Widget build(BuildContext context) {
    final watchlist = context.watch<WatchlistProvider>();
    final movieProvider = context.watch<MovieProvider>();
    final watchlistMovies = movieProvider.movies
        .where((m) => watchlist.isInWatchlist(m.id))
        .toList();

    return Scaffold(
      appBar: AppBar(title: const Text('My Watchlist')),
      body: watchlistMovies.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.bookmark_border, size: 64, color: Colors.white24),
                  SizedBox(height: 16),
                  Text('Your watchlist is empty',
                      style: TextStyle(color: Colors.white54, fontSize: 16)),
                  SizedBox(height: 8),
                  Text('Add movies by tapping the bookmark icon',
                      style: TextStyle(color: Colors.white38, fontSize: 13)),
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
              itemCount: watchlistMovies.length,
              itemBuilder: (context, index) => MovieCard(
                movie: watchlistMovies[index],
                onTap: () {
                  Navigator.pushNamed(context, '/movie-details',
                      arguments: watchlistMovies[index].id);
                },
              ),
            ),
    );
  }
}
