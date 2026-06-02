import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/auth_provider.dart';
import '../../providers/profile_provider.dart';
import '../../providers/movie_provider.dart';
import '../../theme/app_colors.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _editingProfile = false;
  late TextEditingController _bioController;
  late TextEditingController _avatarController;

  @override
  void initState() {
    super.initState();
    _bioController = TextEditingController();
    _avatarController = TextEditingController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      if (auth.currentUser != null) {
        context.read<ProfileProvider>().loadProfile(auth.currentUser!.username);
        context.read<ProfileProvider>().loadPublicUsers();
      }
    });
  }

  @override
  void dispose() {
    _bioController.dispose();
    _avatarController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final profile = context.watch<ProfileProvider>();
    final movieProvider = context.watch<MovieProvider>();

    if (!auth.isLoggedIn) {
      return Scaffold(
        appBar: AppBar(title: const Text('Profile')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.person_outline, size: 64, color: Colors.white24),
              const SizedBox(height: 16),
              const Text('Login to view your profile',
                  style: TextStyle(color: AppColors.textMuted)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.pushNamed(context, '/auth'),
                child: const Text('Login / Register'),
              ),
            ],
          ),
        ),
      );
    }

    final current = auth.currentUser;
    final user = profile.profileData ?? current!;
    final userReviewCount = movieProvider.movies
        .expand((m) => m.reviews)
        .where((r) => r.user == user.username)
        .length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          if (!_editingProfile)
            IconButton(
              icon: const Icon(Icons.edit, color: Colors.white54),
              onPressed: () {
                _bioController.text = user.bio;
                _avatarController.text = user.avatarUrl;
                setState(() => _editingProfile = true);
              },
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            CircleAvatar(
              radius: 50,
              backgroundImage: user.avatarUrl.isNotEmpty
                  ? CachedNetworkImageProvider(user.avatarUrl)
                  : null,
              backgroundColor: AppColors.bgPanel,
              child: user.avatarUrl.isEmpty
                  ? const Icon(Icons.person, size: 40, color: Colors.white38)
                  : null,
            ),
            const SizedBox(height: 12),
            Text(user.username,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textMain)),
            Text(user.role,
                style: TextStyle(color: AppColors.accent, fontSize: 14)),
            const SizedBox(height: 8),
            Text(user.bio.isNotEmpty ? user.bio : 'No bio yet',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 14),
                textAlign: TextAlign.center),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _statItem('${user.followers.length}', 'Followers'),
                const SizedBox(width: 32),
                _statItem('$userReviewCount', 'Reviews'),
                const SizedBox(width: 32),
                _statItem('${user.following.length}', 'Following'),
              ],
            ),
            if (_editingProfile) _buildEditProfile(profile),
            const SizedBox(height: 24),
            const Divider(color: AppColors.border),
            const SizedBox(height: 16),
            const Align(
              alignment: Alignment.centerLeft,
              child: Text('Community Members',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textMain)),
            ),
            const SizedBox(height: 12),
            ...profile.allUsers.map((u) => ListTile(
              leading: CircleAvatar(
                radius: 18,
                backgroundImage: u.avatarUrl.isNotEmpty
                    ? CachedNetworkImageProvider(u.avatarUrl)
                    : null,
                child: u.avatarUrl.isEmpty ? const Icon(Icons.person, size: 16, color: Colors.white38) : null,
              ),
              title: Text(u.username, style: const TextStyle(color: AppColors.textMain, fontSize: 14)),
              subtitle: Text(u.role, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
              trailing: u.username != user.username
                  ? TextButton(
                      onPressed: () {
                        if (u.followers.contains(user.username)) {
                          profile.unfollowUser(u.username);
                        } else {
                          profile.followUser(u.username);
                        }
                      },
                      child: Text(
                        u.followers.contains(user.username) ? 'Following' : 'Follow',
                        style: TextStyle(
                          color: u.followers.contains(user.username)
                              ? AppColors.accent
                              : AppColors.textMuted,
                        ),
                      ),
                    )
                  : null,
            )),
          ],
        ),
      ),
    );
  }

  Widget _statItem(String value, String label) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textMain)),
        Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
      ],
    );
  }

  Widget _buildEditProfile(ProfileProvider profile) {
    return Container(
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          TextField(
            controller: _bioController,
            maxLines: 3,
            decoration: const InputDecoration(hintText: 'Bio'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _avatarController,
            decoration: const InputDecoration(hintText: 'Avatar URL'),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () async {
                    await profile.updateProfile({
                      'bio': _bioController.text.trim(),
                      'avatarUrl': _avatarController.text.trim(),
                    });
                    setState(() => _editingProfile = false);
                  },
                  child: const Text('Save'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(foregroundColor: AppColors.textMuted),
                  onPressed: () => setState(() => _editingProfile = false),
                  child: const Text('Cancel'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
