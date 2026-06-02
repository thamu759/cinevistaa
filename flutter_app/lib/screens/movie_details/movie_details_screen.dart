import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/movie.dart';
import '../../providers/movie_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/watchlist_provider.dart';
import 'widgets/cast_section.dart';
import 'widgets/review_card.dart';

class MovieDetailsScreen extends StatefulWidget {
  final String movieId;
  const MovieDetailsScreen({super.key, required this.movieId});

  @override
  State<MovieDetailsScreen> createState() => _MovieDetailsScreenState();
}

class _MovieDetailsScreenState extends State<MovieDetailsScreen> {
  bool _showFullDescription = false;
  bool _isWriteReviewOpen = false;
  int _reviewRating = 8;
  final _reviewTextController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<MovieProvider>();
      provider.loadMovieById(widget.movieId);
    });
  }

  @override
  void dispose() {
    _reviewTextController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<MovieProvider>();
    final movie = provider.selectedMovie;
    final auth = context.watch<AuthProvider>();
    final watchlist = context.watch<WatchlistProvider>();

    if (movie == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          _buildSliverAppBar(movie),
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildTitleSection(movie),
                _buildActionButtons(movie, auth, watchlist),
                _buildSynopsis(movie),
                _buildCastSection(movie),
                _buildReviewsSection(movie, auth, provider),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSliverAppBar(Movie movie) {
    return SliverAppBar(
      expandedHeight: 300,
      pinned: true,
      backgroundColor: const Color(0xFF0A0A0F),
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            if (movie.backdropUrl.isNotEmpty)
              CachedNetworkImage(
                imageUrl: movie.backdropUrl,
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(color: const Color(0xFF1A1A2E)),
                errorWidget: (_, __, ___) => Container(color: const Color(0xFF1A1A2E)),
              ),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    const Color(0xFF0A0A0F).withValues(alpha: 0.9),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTitleSection(Movie movie) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: SizedBox(
                  width: 100,
                  height: 150,
                  child: movie.posterUrl.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: movie.posterUrl,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => Container(color: const Color(0xFF1A1A2E)),
                        )
                      : Container(color: const Color(0xFF1A1A2E), child: const Icon(Icons.movie, color: Colors.white24)),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(movie.title,
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.star, color: Color(0xFFF5C518), size: 20),
                        const SizedBox(width: 4),
                        Text('${movie.rating}/10',
                            style: const TextStyle(color: Colors.white70, fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(width: 12),
                        Text('${movie.criticScore}',
                            style: const TextStyle(color: const Color(0xFFE50914), fontSize: 14)),
                        const SizedBox(width: 4),
                        const Text('Critic Score', style: TextStyle(color: Colors.white54, fontSize: 12)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    _infoChip(movie.genre),
                    const SizedBox(height: 4),
                    _infoChip('${movie.releaseYear} | ${movie.runtime}'),
                    const SizedBox(height: 4),
                    if (movie.director.isNotEmpty)
                      Text('Director: ${movie.director}',
                          style: const TextStyle(color: Colors.white54, fontSize: 13)),
                    if (movie.studio.isNotEmpty)
                      Text('Studio: ${movie.studio}',
                          style: const TextStyle(color: Colors.white54, fontSize: 13)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (movie.trailerUrl.isNotEmpty)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => setState(() => _showTrailer = true),
                icon: const Icon(Icons.play_arrow),
                label: const Text('Watch Trailer'),
              ),
            ),
        ],
      ),
    );
  }

  Widget _infoChip(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(text, style: const TextStyle(color: Colors.white54, fontSize: 12)),
    );
  }

  Widget _buildActionButtons(Movie movie, AuthProvider auth, WatchlistProvider watchlist) {
    final inWatchlist = watchlist.isInWatchlist(movie.id);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () => watchlist.toggleWatchlist(movie.id),
              icon: Icon(inWatchlist ? Icons.bookmark : Icons.bookmark_border),
              label: Text(inWatchlist ? 'In Watchlist' : 'Add to Watchlist'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: const BorderSide(color: Colors.white24),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () {
                if (!auth.isLoggedIn) {
                  Navigator.pushNamed(context, '/auth');
                  return;
                }
                setState(() => _isWriteReviewOpen = true);
              },
              icon: const Icon(Icons.edit),
              label: const Text('Write Review'),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFFF5C518),
                side: const BorderSide(color: Color(0xFFF5C518)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSynopsis(Movie movie) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Synopsis', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 8),
          Text(
            _showFullDescription || movie.description.length <= 200
                ? movie.description
                : '${movie.description.substring(0, 200)}...',
            style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.5),
          ),
          if (movie.description.length > 200)
            TextButton(
              onPressed: () => setState(() => _showFullDescription = !_showFullDescription),
              child: Text(_showFullDescription ? 'Show Less' : 'Read More',
                  style: const TextStyle(color: Color(0xFFE50914))),
            ),
        ],
      ),
    );
  }

  Widget _buildCastSection(Movie movie) {
    if (movie.cast.isEmpty) return const SizedBox.shrink();
    return CastSection(cast: movie.cast);
  }

  Widget _buildReviewsSection(Movie movie, AuthProvider auth, MovieProvider provider) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Reviews (${movie.reviews.length})',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
            ],
          ),
          const SizedBox(height: 12),
          if (movie.reviews.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Center(child: Text('No reviews yet. Be the first!',
                  style: TextStyle(color: Colors.white54))),
            )
          else
            ...movie.reviews.map((r) => ReviewCard(
              review: r,
              movieId: movie.id,
              currentUser: auth.currentUser,
              onLike: () => provider.toggleLike(movie.id, r.id),
            )),
          _buildWriteReviewModal(movie, auth, provider),
        ],
      ),
    );
  }

  Widget _buildWriteReviewModal(Movie movie, AuthProvider auth, MovieProvider provider) {
    if (!_isWriteReviewOpen) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.all(20),
      margin: const EdgeInsets.only(top: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Write Your Review',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
              IconButton(
                icon: const Icon(Icons.close, color: Colors.white54),
                onPressed: () => setState(() => _isWriteReviewOpen = false),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Text('Rating: ', style: TextStyle(color: Colors.white70)),
              ...List.generate(10, (index) {
                final star = index + 1;
                return GestureDetector(
                  onTap: () => setState(() => _reviewRating = star),
                  child: Icon(
                    star <= _reviewRating ? Icons.star : Icons.star_border,
                    color: const Color(0xFFF5C518),
                    size: 28,
                  ),
                );
              }),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _reviewTextController,
            maxLines: 4,
            decoration: const InputDecoration(
              hintText: 'Share your thoughts...',
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () async {
                if (_reviewTextController.text.trim().isEmpty) return;
                try {
                  await provider.addReview(movie.id, {
                    'rating': _reviewRating,
                    'text': _reviewTextController.text.trim(),
                  });
                  setState(() {
                    _isWriteReviewOpen = false;
                    _reviewTextController.clear();
                    _reviewRating = 8;
                  });
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('$e')),
                  );
                }
              },
              child: const Text('Submit Review'),
            ),
          ),
        ],
      ),
    );
  }
}
