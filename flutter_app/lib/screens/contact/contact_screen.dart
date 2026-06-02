import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

class ContactScreen extends StatelessWidget {
  const ContactScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Contact Support')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _contactItem(Icons.email, 'Email', 'support@thiraipedia.com'),
          _contactItem(Icons.forum, 'Community', 'Post in our Community Forum for discussions, suggestions, and help.'),
          _contactItem(Icons.facebook, 'Social', 'Follow us on Facebook and Instagram for updates.'),
        ],
      ),
    );
  }

  Widget _contactItem(IconData icon, String title, String subtitle) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: ListTile(
        leading: Icon(icon, color: AppColors.accentGold),
        title: Text(title, style: const TextStyle(color: AppColors.textMain)),
        subtitle: Text(subtitle, style: const TextStyle(color: AppColors.textMuted)),
      ),
    );
  }
}
