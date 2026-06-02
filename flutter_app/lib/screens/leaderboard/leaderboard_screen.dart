import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../services/api_service.dart';
import '../../models/watch_provider.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  List<LeaderboardEntry> _leaderboard = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      _leaderboard = await ApiService().fetchLeaderboard();
    } catch (_) {}
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Top Critics')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _leaderboard.isEmpty
                ? const Center(child: Text('No critics yet', style: TextStyle(color: Colors.white54)))
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _leaderboard.length,
                    itemBuilder: (context, index) {
                      final entry = _leaderboard[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            radius: 20,
                            backgroundImage: entry.avatarUrl.isNotEmpty
                                ? CachedNetworkImageProvider(entry.avatarUrl)
                                : null,
                            backgroundColor: const Color(0xFF1A1A2E),
                            child: entry.avatarUrl.isEmpty
                                ? const Icon(Icons.person, color: Colors.white38)
                                : null,
                          ),
                          title: Row(
                            children: [
                              Text('#${index + 1}', style: const TextStyle(color: Color(0xFFF5C518), fontWeight: FontWeight.bold)),
                              const SizedBox(width: 8),
                              Text(entry.username, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                            ],
                          ),
                          subtitle: Text(entry.role, style: const TextStyle(color: Colors.white54)),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text('${entry.reviewCount} reviews',
                                  style: const TextStyle(color: Colors.white70, fontSize: 12)),
                              Text('${entry.averageRating.toStringAsFixed(1)} avg',
                                  style: const TextStyle(color: const Color(0xFFF5C518), fontSize: 11)),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
