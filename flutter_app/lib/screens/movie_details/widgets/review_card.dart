import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../models/review.dart';
import '../../../models/user.dart';

class ReviewCard extends StatefulWidget {
  final Review review;
  final String movieId;
  final User? currentUser;
  final VoidCallback onLike;

  const ReviewCard({
    super.key,
    required this.review,
    required this.movieId,
    required this.currentUser,
    required this.onLike,
  });

  @override
  State<ReviewCard> createState() => _ReviewCardState();
}

class _ReviewCardState extends State<ReviewCard> {
  bool _showReplies = false;
  final _replyController = TextEditingController();

  @override
  void dispose() {
    _replyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.review;
    final isLiked = widget.currentUser != null && r.likedBy.contains(widget.currentUser!.username);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundImage: r.avatarUrl.isNotEmpty
                    ? CachedNetworkImageProvider(r.avatarUrl)
                    : null,
                backgroundColor: Colors.grey[800],
                child: r.avatarUrl.isEmpty ? const Icon(Icons.person, size: 16, color: Colors.white54) : null,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(r.user, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
                    Text(r.role, style: const TextStyle(color: Colors.white54, fontSize: 11)),
                  ],
                ),
              ),
              Row(
                children: List.generate(10, (i) => Icon(
                  i < r.rating ? Icons.star : Icons.star_border,
                  color: const Color(0xFFF5C518),
                  size: 14,
                )),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(r.text, style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4)),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(r.timestamp, style: const TextStyle(color: Colors.white38, fontSize: 11)),
              const Spacer(),
              IconButton(
                icon: Icon(isLiked ? Icons.thumb_up : Icons.thumb_up_outlined,
                    color: isLiked ? const Color(0xFFE50914) : Colors.white54, size: 18),
                onPressed: widget.onLike,
                constraints: const BoxConstraints(),
                padding: const EdgeInsets.all(4),
              ),
              const SizedBox(width: 4),
              Text('${r.likes}', style: const TextStyle(color: Colors.white54, fontSize: 12)),
              const SizedBox(width: 12),
              IconButton(
                icon: const Icon(Icons.chat_bubble_outline, color: Colors.white54, size: 18),
                onPressed: () => setState(() => _showReplies = !_showReplies),
                constraints: const BoxConstraints(),
                padding: const EdgeInsets.all(4),
              ),
              const SizedBox(width: 4),
              Text('${r.replies.length}', style: const TextStyle(color: Colors.white54, fontSize: 12)),
            ],
          ),
          if (_showReplies && r.replies.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8, left: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: r.replies.map((reply) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const CircleAvatar(
                        radius: 12,
                        backgroundColor: Color(0xFF16213E),
                        child: Icon(Icons.person, size: 12, color: Colors.white38),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(reply.author,
                                style: const TextStyle(color: Color(0xFFE50914), fontSize: 11, fontWeight: FontWeight.w600)),
                            Text(reply.body,
                                style: const TextStyle(color: Colors.white60, fontSize: 12)),
                          ],
                        ),
                      ),
                    ],
                  ),
                )).toList(),
              ),
            ),
          if (_showReplies && widget.currentUser != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _replyController,
                      decoration: const InputDecoration(
                        hintText: 'Write a reply...',
                        isDense: true,
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: const Icon(Icons.send, color: Color(0xFFE50914)),
                    onPressed: () {
                      _replyController.clear();
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
