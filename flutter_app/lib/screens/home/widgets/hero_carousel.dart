import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:carousel_slider/carousel_slider.dart';
import '../../../models/movie.dart';

class HeroCarousel extends StatelessWidget {
  final List<Movie> movies;
  final void Function(String movieId) onMovieTap;

  const HeroCarousel({
    super.key,
    required this.movies,
    required this.onMovieTap,
  });

  @override
  Widget build(BuildContext context) {
    return CarouselSlider(
      items: movies.map((movie) => _buildHeroItem(context, movie)).toList(),
      options: CarouselOptions(
        height: 420,
        autoPlay: true,
        autoPlayInterval: const Duration(seconds: 6),
        autoPlayAnimationDuration: const Duration(milliseconds: 800),
        enlargeCenterPage: true,
        viewportFraction: 1.0,
      ),
    );
  }

  Widget _buildHeroItem(BuildContext context, Movie movie) {
    return GestureDetector(
      onTap: () => onMovieTap(movie.id),
      child: Stack(
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
                  Colors.black.withValues(alpha: 0.8),
                ],
              ),
            ),
          ),
          Positioned(
            bottom: 24,
            left: 24,
            right: 24,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(movie.title,
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    )),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.star, color: Color(0xFFF5C518), size: 18),
                    const SizedBox(width: 4),
                    Text('${movie.rating}/10',
                        style: const TextStyle(color: Colors.white70)),
                    const SizedBox(width: 16),
                    Text(movie.genre,
                        style: const TextStyle(color: Colors.white54, fontSize: 13)),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  movie.description.length > 120
                      ? '${movie.description.substring(0, 120)}...'
                      : movie.description,
                  style: const TextStyle(color: Colors.white60, fontSize: 13),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
