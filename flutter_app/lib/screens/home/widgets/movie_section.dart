import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../models/movie.dart';

class MovieSection extends StatelessWidget {
  final String title;
  final List<Movie> movies;
  final void Function(String movieId) onMovieTap;

  const MovieSection({
    super.key,
    required this.title,
    required this.movies,
    required this.onMovieTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 16, right: 16, bottom: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              )),
              TextButton(
                onPressed: () {},
                child: const Text('View All',
                    style: TextStyle(color: Color(0xFFE50914), fontSize: 13)),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 200,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: movies.length,
            itemBuilder: (context, index) {
              final movie = movies[index];
              return GestureDetector(
                onTap: () => onMovieTap(movie.id),
                child: Container(
                  width: 130,
                  margin: const EdgeInsets.only(right: 12),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    color: const Color(0xFF1A1A2E),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: movie.posterUrl.isNotEmpty
                            ? CachedNetworkImage(
                                imageUrl: movie.posterUrl,
                                width: double.infinity,
                                fit: BoxFit.cover,
                                placeholder: (_, __) => Container(color: const Color(0xFF16213E)),
                                errorWidget: (_, __, ___) => Container(
                                  color: const Color(0xFF16213E),
                                  child: const Icon(Icons.movie, color: Colors.white24),
                                ),
                              )
                            : Container(
                                color: const Color(0xFF16213E),
                                child: const Icon(Icons.movie, color: Colors.white24),
                              ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(movie.title,
                                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                const Icon(Icons.star, color: Color(0xFFF5C518), size: 12),
                                const SizedBox(width: 2),
                                Text('${movie.rating}',
                                    style: const TextStyle(color: Colors.white54, fontSize: 11)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
