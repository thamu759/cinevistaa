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
      MaterialPageRoute(builder: (_) => MovieDetailsScreen(movieId: movieId)),
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
            backgroundColor: AppColors.surfaceDark.withValues(alpha: 0.8),
            leading: Builder(
              builder: (context) => IconButton(
                icon: const Icon(Icons.menu, color: AppColors.textMuted, size: 22),
                onPressed: () => Scaffold.of(context).openDrawer(),
              ),
            ),
            title: GestureDetector(
              onTap: () {},
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Thirai',
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textMain,
                      )),
                  Text('Pedia',
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.accentGold,
                        shadows: [Shadow(color: AppColors.accentGold.withValues(alpha: 0.3), blurRadius: 10)],
                      )),
                ],
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.search, color: AppColors.textMuted, size: 20),
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
                    backgroundColor: AppColors.bgPanel,
                    child: auth.currentUser == null
                        ? Icon(Icons.person, size: 18, color: AppColors.textMuted)
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
                SizedBox(
                  height: 440,
                  child: HeroCarousel(
                    movies: movieProvider.heroMovies,
                    onMovieTap: _navigateToMovie,
                  ),
                ),
              const SizedBox(height: 28),
              _buildGenreFilter(movieProvider),
              const SizedBox(height: 16),
              if (movieProvider.isLoading)
                _buildShimmerGrid()
              else
                _buildMovieGrid(movieProvider.movies, movieProvider),
              const SizedBox(height: 32),
              if (movieProvider.newReleases.isNotEmpty)
                MovieSection(
                  title: 'New Releases',
                  movies: movieProvider.newReleases,
                  onMovieTap: _navigateToMovie,
                ),
              const SizedBox(height: 32),
              if (movieProvider.tamilMovies.isNotEmpty)
                MovieSection(
                  title: 'Tamil Cinema',
                  movies: movieProvider.tamilMovies,
                  onMovieTap: _navigateToMovie,
                ),
              const SizedBox(height: 32),
              if (movieProvider.malayalamMovies.isNotEmpty)
                MovieSection(
                  title: 'Malayalam Cinema',
                  movies: movieProvider.malayalamMovies,
                  onMovieTap: _navigateToMovie,
                ),
              const SizedBox(height: 32),
              if (movieProvider.staffPicks.isNotEmpty)
                MovieSection(
                  title: 'Staff Picks',
                  movies: movieProvider.staffPicks,
                  onMovieTap: _navigateToMovie,
                ),
              const SizedBox(height: 32),
              _buildFooter(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDrawer(AuthProvider auth) {
    return Drawer(
      backgroundColor: AppColors.bgDark,
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: BoxDecoration(color: AppColors.bgPanel),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text('Thirai',
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textMain,
                        )),
                    Text('Pedia',
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          color: AppColors.accentGold,
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
                        backgroundColor: AppColors.bgCard,
                        child: Icon(Icons.person, size: 20, color: AppColors.textMuted),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(auth.currentUser!.username,
                              style: const TextStyle(
                                  fontFamily: 'Outfit',
                                  color: AppColors.textMain,
                                  fontWeight: FontWeight.w600)),
                          Text(auth.currentUser!.role,
                              style: const TextStyle(
                                  fontFamily: 'Outfit',
                                  color: AppColors.textMuted,
                                  fontSize: 12)),
                        ],
                      ),
                    ],
                  )
                else
                  TextButton.icon(
                    onPressed: () => Navigator.pushNamed(context, '/auth'),
                    icon: Icon(Icons.login, color: AppColors.accentGold),
                    label: Text('Login / Register',
                        style: TextStyle(color: AppColors.accentGold)),
                  ),
              ],
            ),
          ),
          ..._navItems.map((item) => ListTile(
            leading: Icon(_iconForRoute(item['route']!), color: AppColors.textMuted, size: 20),
            title: Text(item['label']!,
                style: const TextStyle(fontFamily: 'Outfit', color: AppColors.textMain, fontSize: 14)),
            onTap: () {
              Navigator.pop(context);
              _navigateTo(item['route']!);
            },
          )),
          if (auth.isAdmin)
            ListTile(
              leading: Icon(Icons.admin_panel_settings, color: AppColors.accentGold, size: 20),
              title: const Text('Admin Control',
                  style: TextStyle(fontFamily: 'Outfit', color: AppColors.accentGold, fontSize: 14)),
              onTap: () {
                Navigator.pop(context);
                _navigateTo('/admin');
              },
            ),
          Divider(color: AppColors.border),
          ListTile(
            leading: Icon(Icons.info_outline, color: AppColors.textMuted, size: 20),
            title: const Text('About',
                style: TextStyle(fontFamily: 'Outfit', color: AppColors.textMain, fontSize: 14)),
            onTap: () {
              Navigator.pop(context);
              _navigateTo('/about');
            },
          ),
          if (auth.isLoggedIn)
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.red, size: 20),
              title: const Text('Logout',
                  style: TextStyle(fontFamily: 'Outfit', color: Colors.red, fontSize: 14)),
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
            color: isSelected ? AppColors.accentGold : AppColors.bgCard,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected ? AppColors.accentGold : AppColors.border,
            ),
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
                          color: provider.sortOption == 'rating' ? AppColors.accentGold : AppColors.textMain,
                        )),
                  ),
                  PopupMenuItem(
                    value: 'popular',
                    child: Text('Popular',
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          color: provider.sortOption == 'popular' ? AppColors.accentGold : AppColors.textMain,
                        )),
                  ),
                  PopupMenuItem(
                    value: 'release-desc',
                    child: Text('Latest',
                        style: TextStyle(
                          fontFamily: 'Outfit',
                          color: provider.sortOption == 'release-desc' ? AppColors.accentGold : AppColors.textMain,
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
                    color: AppColors.accentGold,
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
                child: const Text('About',
                    style: TextStyle(fontFamily: 'Outfit', color: AppColors.textMuted, fontSize: 12))),
              TextButton(
                onPressed: () => _navigateTo('/privacy'),
                child: const Text('Privacy',
                    style: TextStyle(fontFamily: 'Outfit', color: AppColors.textMuted, fontSize: 12))),
              TextButton(
                onPressed: () => _navigateTo('/terms'),
                child: const Text('Terms',
                    style: TextStyle(fontFamily: 'Outfit', color: AppColors.textMuted, fontSize: 12))),
              TextButton(
                onPressed: () => _navigateTo('/contact'),
                child: const Text('Contact',
                    style: TextStyle(fontFamily: 'Outfit', color: AppColors.textMuted, fontSize: 12))),
              TextButton(
                onPressed: () => _navigateTo('/articles'),
                child: const Text('Articles',
                    style: TextStyle(fontFamily: 'Outfit', color: AppColors.textMuted, fontSize: 12))),
              TextButton(
                onPressed: () => _navigateTo('/quiz'),
                child: const Text('Quiz',
                    style: TextStyle(fontFamily: 'Outfit', color: AppColors.textMuted, fontSize: 12))),
            ],
          ),
        ],
      ),
    );
  }
}
