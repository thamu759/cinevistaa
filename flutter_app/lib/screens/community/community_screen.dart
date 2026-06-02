import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/community_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/community_thread.dart';
import '../../theme/app_colors.dart';

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key});

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  bool _showNewThread = false;
  final _titleController = TextEditingController();
  final _bodyController = TextEditingController();
  String _selectedTag = 'General';
  final Map<String, TextEditingController> _replyControllers = {};

  final _tags = ['General', 'Recommendations', 'Sound Design', 'Discussion', 'News'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CommunityProvider>().loadThreads();
    });
  }

  @override
  void dispose() {
    _titleController.dispose();
    _bodyController.dispose();
    for (var c in _replyControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final community = context.watch<CommunityProvider>();
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Community Forum'),
        actions: [
          if (auth.isLoggedIn)
            IconButton(
              icon: const Icon(Icons.add, color: Colors.white),
              onPressed: () => setState(() => _showNewThread = !_showNewThread),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => community.loadThreads(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (_showNewThread) _buildNewThreadForm(community),
            if (community.isLoading)
              const Center(child: Padding(
                padding: EdgeInsets.all(32),
                child: CircularProgressIndicator(),
              ))
            else if (community.error != null)
              Center(child: Text(community.error!, style: const TextStyle(color: Colors.red)))
            else
              ...community.threads.map((thread) => _buildThreadCard(thread, auth, community)),
          ],
        ),
      ),
    );
  }

  Widget _buildNewThreadForm(CommunityProvider community) {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          TextField(
            controller: _titleController,
            decoration: const InputDecoration(hintText: 'Thread title'),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _bodyController,
            maxLines: 3,
            decoration: const InputDecoration(hintText: 'What\'s on your mind?'),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              DropdownButton<String>(
                value: _selectedTag,
                dropdownColor: AppColors.bgPanel,
                items: _tags.map((t) => DropdownMenuItem(
                  value: t,
                  child: Text(t, style: const TextStyle(color: AppColors.textMain)),
                )).toList(),
                onChanged: (v) => setState(() => _selectedTag = v!),
              ),
              const Spacer(),
              ElevatedButton(
                onPressed: () async {
                  try {
                    await community.createThread(
                      _titleController.text.trim(),
                      _bodyController.text.trim(),
                      _selectedTag,
                    );
                    _titleController.clear();
                    _bodyController.clear();
                    setState(() => _showNewThread = false);
                  } catch (e) {
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('$e')),
                    );
                  }
                },
                child: const Text('Post'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildThreadCard(CommunityThread thread, AuthProvider auth, CommunityProvider community) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundImage: thread.avatarUrl.isNotEmpty
                    ? CachedNetworkImageProvider(thread.avatarUrl)
                    : null,
                backgroundColor: AppColors.bgPanel,
                child: thread.avatarUrl.isEmpty ? const Icon(Icons.person, size: 14, color: Colors.white54) : null,
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(thread.author, style: const TextStyle(color: AppColors.textMain, fontWeight: FontWeight.w600, fontSize: 13)),
                  Text(thread.role, style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
                ],
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.accent.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(thread.tag, style: const TextStyle(color: AppColors.accent, fontSize: 10)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(thread.title, style: const TextStyle(color: AppColors.textMain, fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Text(thread.body, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.thumb_up_outlined, color: Colors.white38, size: 16),
              const SizedBox(width: 4),
              Text('${thread.likes}', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
              const SizedBox(width: 16),
              const Icon(Icons.chat_bubble_outline, color: Colors.white38, size: 16),
              const SizedBox(width: 4),
              Text('${thread.replies.length}', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
              const Spacer(),
              Text(thread.timestamp, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
            ],
          ),
          if (thread.replies.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Column(
                children: thread.replies.map((reply) => Padding(
                  padding: const EdgeInsets.only(bottom: 8, left: 16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const CircleAvatar(
                        radius: 10,
                        backgroundColor: AppColors.bgDark,
                        child: Icon(Icons.person, size: 10, color: Colors.white38),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(reply.author, style: const TextStyle(color: AppColors.accent, fontSize: 11, fontWeight: FontWeight.w600)),
                            Text(reply.body, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                          ],
                        ),
                      ),
                    ],
                  ),
                )).toList(),
              ),
            ),
          if (auth.isLoggedIn)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _replyControllers.putIfAbsent(thread.id, () => TextEditingController()),
                      decoration: const InputDecoration(
                        hintText: 'Write a reply...',
                        isDense: true,
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: const Icon(Icons.send, color: AppColors.accent),
                    onPressed: () async {
                      final controller = _replyControllers[thread.id]!;
                      if (controller.text.trim().isEmpty) return;
                      try {
                        await community.addReply(thread.id, controller.text.trim());
                        controller.clear();
                      } catch (e) {
                        if (!mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('$e')),
                        );
                      }
                    },
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
