import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
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
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: const Color(0xFF0A0A0F),
      colorScheme: const ColorScheme.dark(
        primary: Color(0xFFE50914),
        secondary: Color(0xFFF5C518),
        surface: Color(0xFF1A1A2E),
      ),
      textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF0A0A0F),
        elevation: 0,
        centerTitle: true,
      ),
      cardTheme: CardThemeData(
        color: const Color(0xFF1A1A2E),
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF1A1A2E),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE50914), width: 1.5),
        ),
        hintStyle: TextStyle(color: Colors.grey[600]),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFE50914),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Color(0xFF0A0A0F),
        selectedItemColor: Color(0xFFE50914),
        unselectedItemColor: Color(0xFF6B7280),
      ),
    );
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
