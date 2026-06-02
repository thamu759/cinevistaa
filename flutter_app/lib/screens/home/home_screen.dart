import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/movie_provider.dart';
import '../../models/movie.dart';
import '../../theme/app_colors.dart';
import '../movie_details/movie_details_screen.dart';
import 'widgets/hero_carousel.dart';
import 'widgets/movie_card.dart';
import 'widgets/movie_section.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentNavIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AuthProvider>().verifySession();
      context.read<MovieProvider>().loadMovies();
      context.read<MovieProvider>().loadNewReleases();
    });
  }

  void _navigateTo(String route, {String? movieId}) {
    Navigator.pushNamed(context, route, arguments: movieId);
  }

  void _navigateToMovie(String movieId) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => MovieDetailsScreen(movieId: movieId)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final movieProvider = context.watch<MovieProvider>();

    return Scaffold(
      bottomNavigationBar: _buildBottomNav(auth),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: false,
            floating: true,
            backgroundColor: AppColors.bgDark.withValues(alpha: 0.95),
            centerTitle: true,
            title: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Thirai',
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textMain,
                    )),
                Text('Pedia',
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: AppColors.accent,
                      shadows: [Shadow(color: AppColors.accent.withValues(alpha: 0.3), blurRadius: 10)],
                    )),
              ],
            ),
          ),
          SliverToBoxAdapter(
            child: RefreshIndicator(
              onRefresh: () async {
                await movieProvider.loadMovies();
                await movieProvider.loadNewReleases();
              },
              child: ListView(
                padding: EdgeInsets.zero,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  if (movieProvider.heroMovies.isNotEmpty)
                    SizedBox(
                      height: 440,
                      child: HeroCarousel(
                        movies: movieProvider.heroMovies,
                        onMovieTap: _navigateToMovie,
                      ),
                    ),
                  const SizedBox(height: 24),
                  _buildGenreFilter(movieProvider),
                  const SizedBox(height: 16),
                  if (movieProvider.isLoading)
                    _buildShimmerGrid()
                  else
                    _buildMovieGrid(movieProvider.movies, movieProvider),
                  const SizedBox(height: 24),
                  if (movieProvider.newReleases.isNotEmpty)
                    MovieSection(
                      title: 'Trending Now',
                      movies: movieProvider.newReleases,
                      onMovieTap: _navigateToMovie,
                    ),
                  const SizedBox(height: 24),
                  if (movieProvider.tamilMovies.isNotEmpty)
                    MovieSection(
                      title: 'Tamil Cinema',
                      movies: movieProvider.tamilMovies,
                      onMovieTap: _navigateToMovie,
                    ),
                  const SizedBox(height: 24),
                  if (movieProvider.malayalamMovies.isNotEmpty)
                    MovieSection(
                      title: 'Malayalam Cinema',
                      movies: movieProvider.malayalamMovies,
                      onMovieTap: _navigateToMovie,
                    ),
                  const SizedBox(height: 24),
                  if (movieProvider.staffPicks.isNotEmpty)
                    MovieSection(
                      title: 'Popular on thiraipedia',
                      movies: movieProvider.staffPicks,
                      onMovieTap: _navigateToMovie,
                    ),
                  const SizedBox(height: 24),
                  _buildFooter(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomNav(AuthProvider auth) {
    return Container(
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: BottomNavigationBar(
        currentIndex: _currentNavIndex,
        onTap: (i) {
          setState(() => _currentNavIndex = i);
          switch (i) {
            case 0: break;
            case 1: _navigateTo('/search'); break;
            case 2: _navigateTo('/watchlist'); break;
            case 3: _navigateTo('/community'); break;
            case 4:
              if (!auth.isLoggedIn) {
                _navigateTo('/auth');
              } else {
                _navigateTo('/profile');
              }
              break;
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Search'),
          BottomNavigationBarItem(icon: Icon(Icons.bookmark_border), activeIcon: Icon(Icons.bookmark), label: 'Watchlist'),
          BottomNavigationBarItem(icon: Icon(Icons.forum_outlined), activeIcon: Icon(Icons.forum), label: 'Community'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }

  Widget _buildGenreFilter(MovieProvider provider) {
    final genres = ['Action', 'Drama', 'Sci-Fi', 'Comedy', 'Thriller', 'Tamil', 'Crime'];
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          _filterChip('All', '', provider.selectedGenre, () => provider.setGenre('')),
          ...genres.map((g) => _filterChip(g, g, provider.selectedGenre, () => provider.setGenre(g))),
        ],
      ),
    );
  }

  Widget _filterChip(String label, String value, String selected, VoidCallback onTap) {
    final isSelected = selected == value || (value.isEmpty && selected.isEmpty);
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.accent : AppColors.bgCard,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isSelected ? AppColors.accent : AppColors.border),
          ),
          child: Text(label,
              style: TextStyle(
                fontFamily: 'Outfit',
                color: isSelected ? Colors.black : AppColors.textMuted,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                fontSize: 13,
              )),
        ),
      ),
    );
  }

  Widget _buildMovieGrid(List<Movie> movies, MovieProvider provider) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('All Movies',
                  style: TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textMain,
                  )),
              PopupMenuButton<String>(
                icon: Icon(Icons.sort, color: AppColors.textMuted, size: 20),
                color: AppColors.bgPanel,
                onSelected: (value) => provider.setSort(value),
                itemBuilder: (_) => [
                  PopupMenuItem(
                    value: 'rating',
                    child: Text('Rating',
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          color: provider.sortOption == 'rating' ? AppColors.accent : AppColors.textMain,
                        )),
                  ),
                  PopupMenuItem(
                    value: 'popular',
                    child: Text('Popular',
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          color: provider.sortOption == 'popular' ? AppColors.accent : AppColors.textMain,
                        )),
                  ),
                  PopupMenuItem(
                    value: 'release-desc',
                    child: Text('Latest',
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          color: provider.sortOption == 'release-desc' ? AppColors.accent : AppColors.textMain,
                        )),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.7,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: movies.length,
            itemBuilder: (context, index) => MovieCard(
              movie: movies[index],
              onTap: () => _navigateToMovie(movies[index].id),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShimmerGrid() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.7,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemCount: 6,
        itemBuilder: (context, index) => Container(
          decoration: BoxDecoration(
            color: AppColors.bgCard,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
        ),
      ),
    );
  }

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Thirai',
                  style: TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textMain,
                  )),
              Text('Pedia',
                  style: TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.accent,
                  )),
            ],
          ),
          const SizedBox(height: 8),
          const Text('Premium Film Critique & Reviews',
              style: TextStyle(fontFamily: 'Outfit', color: AppColors.textMuted, fontSize: 12)),
          const SizedBox(height: 16),
          Wrap(
            spacing: 16,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: [
              TextButton(
                onPressed: () => _navigateTo('/about'),
                child: const Text('About', style: TextStyle(fontFamily: 'Outfit', color: AppColors.textMuted, fontSize: 12))),
              TextButton(
                onPressed: () => _navigateTo('/privacy'),
                child: const Text('Privacy', style: TextStyle(fontFamily: 'Outfit', color: AppColors.textMuted, fontSize: 12))),
              TextButton(
                onPressed: () => _navigateTo('/terms'),
                child: const Text('Terms', style: TextStyle(fontFamily: 'Outfit', color: AppColors.textMuted, fontSize: 12))),
              TextButton(
                onPressed: () => _navigateTo('/contact'),
                child: const Text('Contact', style: TextStyle(fontFamily: 'Outfit', color: AppColors.textMuted, fontSize: 12))),
            ],
          ),
        ],
      ),
    );
  }
}
