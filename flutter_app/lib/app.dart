import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'screens/home/home_screen.dart';
import 'screens/search/search_screen.dart';
import 'screens/auth/auth_screen.dart';
import 'screens/watchlist/watchlist_screen.dart';
import 'screens/coming_soon/coming_soon_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'screens/community/community_screen.dart';
import 'screens/admin/admin_screen.dart';
import 'screens/lists/lists_screen.dart';
import 'screens/leaderboard/leaderboard_screen.dart';
import 'screens/ott_calendar/ott_calendar_screen.dart';
import 'screens/articles/articles_screen.dart';
import 'screens/games/quiz_screen.dart';
import 'screens/games/spin_wheel_screen.dart';
import 'screens/games/blind_frame_screen.dart';
import 'screens/games/mood_matcher_screen.dart';
import 'screens/legal/legal_screen.dart';
import 'screens/about/about_screen.dart';
import 'screens/contact/contact_screen.dart';
import 'screens/movie_details/actor_screen.dart';

class ThiraiPediaApp extends StatelessWidget {
  const ThiraiPediaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ThiraiPedia',
      debugShowCheckedModeBanner: false,
      theme: _buildTheme(),
      home: const HomeScreen(),
      routes: _buildRoutes(),
    );
  }

  ThemeData _buildTheme() {
    return AppTheme.darkTheme;
  }

  Map<String, WidgetBuilder> _buildRoutes() {
    return {
      '/search': (_) => const SearchScreen(),
      '/auth': (_) => const AuthScreen(),
      '/watchlist': (_) => const WatchlistScreen(),
      '/coming-soon': (_) => const ComingSoonScreen(),
      '/profile': (_) => const ProfileScreen(),
      '/community': (_) => const CommunityScreen(),
      '/admin': (_) => const AdminScreen(),
      '/lists': (_) => const ListsScreen(),
      '/leaderboard': (_) => const LeaderboardScreen(),
      '/ott-calendar': (_) => const OttCalendarScreen(),
      '/articles': (_) => const ArticlesScreen(),
      '/quiz': (_) => const QuizScreen(),
      '/wheel': (_) => const SpinWheelScreen(),
      '/blind-frame': (_) => const BlindFrameScreen(),
      '/mood-matcher': (_) => const MoodMatcherScreen(),
      '/privacy': (_) => const LegalScreen(page: 'privacy'),
      '/terms': (_) => const LegalScreen(page: 'terms'),
      '/about': (_) => const AboutScreen(),
      '/contact': (_) => const ContactScreen(),
      '/article-detail': (_) => const ArticleDetailScreen(),
      '/list-detail': (_) => const ListDetailScreen(),
      '/actor': (_) => const ActorScreen(),
    };
  }
}
