import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/movie_provider.dart';
import '../../models/movie.dart';
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

  final _navItems = [
    {'label': 'Movies', 'route': '/'},
    {'label': 'Watchlist', 'route': '/watchlist'},
    {'label': 'Coming Soon', 'route': '/coming-soon'},
    {'label': 'Top Critics', 'route': '/leaderboard'},
    {'label': 'Lists', 'route': '/lists'},
    {'label': 'OTT Calendar', 'route': '/ott-calendar'},
    {'label': 'Community', 'route': '/community'},
  ];

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
      MaterialPageRoute(
        builder: (_) => MovieDetailsScreen(movieId: movieId),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final movieProvider = context.watch<MovieProvider>();

    return Scaffold(
      drawer: _buildDrawer(auth),
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          SliverAppBar(
            pinned: false,
            floating: true,
            backgroundColor: const Color(0xFF0A0A0F),
            leading: Builder(
              builder: (context) => IconButton(
                icon: const Icon(Icons.menu, color: Colors.white),
                onPressed: () => Scaffold.of(context).openDrawer(),
              ),
            ),
            title: Row(
              children: [
                Text('Thirai', style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                )),
                Text('Pedia', style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w300,
                  color: const Color(0xFFE50914),
                )),
              ],
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.search, color: Colors.white),
                onPressed: () => _navigateTo('/search'),
              ),
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () {
                    if (!auth.isLoggedIn) {
                      _navigateTo('/auth');
                    }
                  },
                  child: CircleAvatar(
                    radius: 16,
                    backgroundImage: auth.currentUser?.avatarUrl.isNotEmpty == true
                        ? NetworkImage(auth.currentUser!.avatarUrl)
                        : null,
                    backgroundColor: Colors.grey[800],
                    child: auth.currentUser == null
                        ? const Icon(Icons.person, size: 18, color: Colors.white70)
                        : null,
                  ),
                ),
              ),
            ],
          ),
        ],
        body: RefreshIndicator(
          onRefresh: () async {
            await movieProvider.loadMovies();
            await movieProvider.loadNewReleases();
          },
          child: ListView(
            padding: EdgeInsets.zero,
            children: [
              if (movieProvider.heroMovies.isNotEmpty)
                HeroCarousel(
                  movies: movieProvider.heroMovies,
                  onMovieTap: _navigateToMovie,
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
                  title: 'New Releases',
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
                  title: 'Staff Picks',
                  movies: movieProvider.staffPicks,
                  onMovieTap: _navigateToMovie,
                ),
              const SizedBox(height: 24),
              _buildFooter(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDrawer(AuthProvider auth) {
    return Drawer(
      backgroundColor: const Color(0xFF0A0A0F),
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(color: Color(0xFF1A1A2E)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text('Thirai', style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    )),
                    Text('Pedia', style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w300,
                      color: const Color(0xFFE50914),
                    )),
                  ],
                ),
                const Spacer(),
                if (auth.isLoggedIn)
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundImage: auth.currentUser!.avatarUrl.isNotEmpty
                            ? NetworkImage(auth.currentUser!.avatarUrl)
                            : null,
                        child: const Icon(Icons.person, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(auth.currentUser!.username,
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          Text(auth.currentUser!.role,
                              style: const TextStyle(color: Colors.grey, fontSize: 12)),
                        ],
                      ),
                    ],
                  )
                else
                  TextButton.icon(
                    onPressed: () => Navigator.pushNamed(context, '/auth'),
                    icon: const Icon(Icons.login, color: Color(0xFFE50914)),
                    label: const Text('Login / Register',
                        style: TextStyle(color: Color(0xFFE50914))),
                  ),
              ],
            ),
          ),
          ..._navItems.map((item) => ListTile(
            leading: Icon(_iconForRoute(item['route']!), color: Colors.white70),
            title: Text(item['label']!, style: const TextStyle(color: Colors.white)),
            onTap: () {
              Navigator.pop(context);
              _navigateTo(item['route']!);
            },
          )),
          if (auth.isAdmin)
            ListTile(
              leading: const Icon(Icons.admin_panel_settings, color: Color(0xFFF5C518)),
              title: const Text('Admin Control',
                  style: TextStyle(color: Color(0xFFF5C518))),
              onTap: () {
                Navigator.pop(context);
                _navigateTo('/admin');
              },
            ),
          const Divider(color: Colors.grey),
          ListTile(
            leading: const Icon(Icons.info_outline, color: Colors.white70),
            title: const Text('About', style: TextStyle(color: Colors.white)),
            onTap: () {
              Navigator.pop(context);
              _navigateTo('/about');
            },
          ),
          if (auth.isLoggedIn)
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: const Text('Logout', style: TextStyle(color: Colors.red)),
              onTap: () {
                Navigator.pop(context);
                auth.logout();
              },
            ),
        ],
      ),
    );
  }

  IconData _iconForRoute(String route) {
    switch (route) {
      case '/': return Icons.movie;
      case '/watchlist': return Icons.bookmark;
      case '/coming-soon': return Icons.upcoming;
      case '/leaderboard': return Icons.leaderboard;
      case '/lists': return Icons.list;
      case '/ott-calendar': return Icons.calendar_month;
      case '/community': return Icons.forum;
      default: return Icons.circle;
    }
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
            color: isSelected ? const Color(0xFFE50914) : const Color(0xFF1A1A2E),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(label, style: TextStyle(
            color: isSelected ? Colors.white : Colors.white70,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
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
              const Text('All Movies', style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              )),
              PopupMenuButton<String>(
                icon: const Icon(Icons.sort, color: Colors.white70, size: 20),
                color: const Color(0xFF1A1A2E),
                onSelected: (value) => provider.setSort(value),
                itemBuilder: (_) => [
                  PopupMenuItem(value: 'rating', child: Text('Rating',
                      style: TextStyle(color: provider.sortOption == 'rating' ? const Color(0xFFE50914) : Colors.white))),
                  PopupMenuItem(value: 'popular', child: Text('Popular',
                      style: TextStyle(color: provider.sortOption == 'popular' ? const Color(0xFFE50914) : Colors.white))),
                  PopupMenuItem(value: 'release-desc', child: Text('Latest',
                      style: TextStyle(color: provider.sortOption == 'release-desc' ? const Color(0xFFE50914) : Colors.white))),
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
            color: const Color(0xFF1A1A2E),
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: Color(0xFF1A1A2E))),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Thirai', style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              )),
              Text('Pedia', style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w300,
                color: const Color(0xFFE50914),
              )),
            ],
          ),
          const SizedBox(height: 8),
          Text('Premium Film Critique & Reviews',
              style: TextStyle(color: Colors.grey[600], fontSize: 12)),
          const SizedBox(height: 16),
          Wrap(
            spacing: 16,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: [
              TextButton(onPressed: () => _navigateTo('/about'), child: const Text('About', style: TextStyle(color: Colors.white70, fontSize: 12))),
              TextButton(onPressed: () => _navigateTo('/privacy'), child: const Text('Privacy', style: TextStyle(color: Colors.white70, fontSize: 12))),
              TextButton(onPressed: () => _navigateTo('/terms'), child: const Text('Terms', style: TextStyle(color: Colors.white70, fontSize: 12))),
              TextButton(onPressed: () => _navigateTo('/contact'), child: const Text('Contact', style: TextStyle(color: Colors.white70, fontSize: 12))),
              TextButton(onPressed: () => _navigateTo('/articles'), child: const Text('Articles', style: TextStyle(color: Colors.white70, fontSize: 12))),
              TextButton(onPressed: () => _navigateTo('/quiz'), child: const Text('Quiz', style: TextStyle(color: Colors.white70, fontSize: 12))),
            ],
          ),
        ],
      ),
    );
  }
}
