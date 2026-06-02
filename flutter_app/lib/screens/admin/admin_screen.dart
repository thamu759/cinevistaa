import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_colors.dart';

class AdminScreen extends StatelessWidget {
  const AdminScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (!auth.isLoggedIn || !auth.isAdmin) {
      return Scaffold(
        appBar: AppBar(title: const Text('Admin Panel')),
        body: const Center(child: Text('Access denied. Admin only.',
            style: TextStyle(color: Colors.red))),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Admin Control')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _card(
            icon: Icons.movie,
            title: 'Manage Movies',
            subtitle: 'Add, edit, or remove movies',
            onTap: () => _showComingSoon(context, 'Movie Management'),
          ),
          _card(
            icon: Icons.people,
            title: 'Manage Users',
            subtitle: 'View and manage user accounts',
            onTap: () => _showComingSoon(context, 'User Management'),
          ),
          _card(
            icon: Icons.rate_review,
            title: 'Seed Reviews',
            subtitle: 'Generate AI reviews for movies',
            onTap: () => _showComingSoon(context, 'Seed Reviews'),
          ),
          _card(
            icon: Icons.refresh,
            title: 'Refresh Posters',
            subtitle: 'Refresh HD posters from TMDB',
            onTap: () => _showComingSoon(context, 'Refresh Posters'),
          ),
          _card(
            icon: Icons.forum,
            title: 'Manage Threads',
            subtitle: 'Delete community threads',
            onTap: () => _showComingSoon(context, 'Thread Management'),
          ),
        ],
      ),
    );
  }

  Widget _card({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(icon, color: AppColors.accentGold),
        title: Text(title, style: const TextStyle(color: AppColors.textMain)),
        subtitle: Text(subtitle, style: const TextStyle(color: AppColors.textMuted)),
        trailing: const Icon(Icons.chevron_right, color: Colors.white38),
        onTap: onTap,
      ),
    );
  }

  void _showComingSoon(BuildContext context, String feature) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$feature - Coming soon')),
    );
  }
}
