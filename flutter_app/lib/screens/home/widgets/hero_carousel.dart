import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../models/movie.dart';
import '../../../theme/app_colors.dart';

class HeroCarousel extends StatefulWidget {
  final List<Movie> movies;
  final void Function(String movieId) onMovieTap;

  const HeroCarousel({
    super.key,
    required this.movies,
    required this.onMovieTap,
  });

  @override
  State<HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends State<HeroCarousel> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 420,
      child: Stack(
        children: [
          PageView.builder(
            itemCount: widget.movies.length,
            onPageChanged: (i) => setState(() => _currentIndex = i),
            itemBuilder: (context, index) => _buildSlide(widget.movies[index], index),
          ),
          if (widget.movies.length > 1)
            ..._buildNavButtons(),
          if (widget.movies.length > 1)
            Positioned(
              bottom: 16,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(widget.movies.length, (i) => _indicator(i)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSlide(Movie movie, int index) {
    final isActive = index == _currentIndex;
    return GestureDetector(
      onTap: () => widget.onMovieTap(movie.id),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 800),
        curve: Curves.easeInOut,
        margin: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          fit: StackFit.expand,
          children: [
            AnimatedOpacity(
              duration: const Duration(milliseconds: 700),
              opacity: isActive ? 1.0 : 0.0,
              child: AnimatedScale(
                scale: isActive ? 1.0 : 1.08,
                duration: const Duration(milliseconds: 7000),
                child: movie.backdropUrl.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: movie.backdropUrl,
                        fit: BoxFit.cover,
                        placeholder: (_, _) => Container(color: Colors.black),
                        errorWidget: (_, _, _) => Container(color: Colors.black),
                      )
                    : Container(color: Colors.black),
              ),
            ),
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Color(0xCC0A0A0A),
                    Color(0xFF0A0A0A),
                  ],
                ),
              ),
            ),
            Positioned(
              top: 16,
              left: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.gradientStart, AppColors.gradientEnd],
                  ),
                  borderRadius: BorderRadius.circular(50),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.star, size: 14, color: AppColors.accentSecondary),
                    const SizedBox(width: 6),
                    Text('${movie.rating}/10',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        )),
                  ],
                ),
              ),
            ),
            AnimatedOpacity(
              duration: const Duration(milliseconds: 700),
              opacity: isActive ? 1.0 : 0.0,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 40),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(movie.title.toUpperCase(),
                        style: const TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 36,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: -0.5,
                          shadows: [Shadow(color: Color(0x80000000), blurRadius: 10)],
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _infoChip(movie.genre),
                        const SizedBox(width: 8),
                        Text(movie.releaseYear.toString(),
                            style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
                        const SizedBox(width: 8),
                        Text(movie.runtime,
                            style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      movie.description.length > 100
                          ? '${movie.description.substring(0, 100)}...'
                          : movie.description,
                      style: const TextStyle(
                        fontFamily: 'Outfit',
                        color: AppColors.textMuted,
                        fontSize: 14,
                        height: 1.5,
                        shadows: [Shadow(color: Color(0x60000000), blurRadius: 5)],
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _heroButton('View Details', () => widget.onMovieTap(movie.id)),
                        const SizedBox(width: 12),
                        _heroSecondaryButton('Watch Trailer', () {}),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoChip(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.border,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(text.toUpperCase(),
          style: const TextStyle(
            fontFamily: 'Outfit',
            color: AppColors.textMuted,
            fontSize: 10,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.5,
          )),
    );
  }

  Widget _heroButton(String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.gradientStart, AppColors.gradientEnd],
          ),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(label,
            style: const TextStyle(
              fontFamily: 'Outfit',
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            )),
      ),
    );
  }

  Widget _heroSecondaryButton(String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.border,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(label,
            style: const TextStyle(
              fontFamily: 'Outfit',
              color: Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            )),
      ),
    );
  }

  List<Widget> _buildNavButtons() {
    return [
      if (_currentIndex > 0)
        Positioned(
          left: 28,
          top: 0,
          bottom: 0,
          child: Center(
            child: GestureDetector(
              onTap: () {
                if (_currentIndex > 0) setState(() => _currentIndex--);
              },
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: const Icon(Icons.chevron_left, color: Colors.white, size: 22),
              ),
            ),
          ),
        ),
      if (_currentIndex < widget.movies.length - 1)
        Positioned(
          right: 28,
          top: 0,
          bottom: 0,
          child: Center(
            child: GestureDetector(
              onTap: () {
                if (_currentIndex < widget.movies.length - 1) setState(() => _currentIndex++);
              },
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: const Icon(Icons.chevron_right, color: Colors.white, size: 22),
              ),
            ),
          ),
        ),
    ];
  }

  Widget _indicator(int index) {
    final isActive = index == _currentIndex;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.symmetric(horizontal: 4),
      width: isActive ? 36 : 24,
      height: 4,
      decoration: BoxDecoration(
        color: isActive ? AppColors.accent : AppColors.border,
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }
}
