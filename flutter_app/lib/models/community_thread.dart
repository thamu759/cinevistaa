class ThreadReply {
  final String id;
  final String author;
  final String body;
  final String timestamp;

  ThreadReply({
    required this.id,
    required this.author,
    required this.body,
    this.timestamp = '',
  });

  factory ThreadReply.fromJson(Map<String, dynamic> json) {
    return ThreadReply(
      id: json['id'] ?? '',
      author: json['author'] ?? '',
      body: json['body'] ?? '',
      timestamp: json['timestamp'] ?? '',
    );
  }
}

class CommunityThread {
  final String id;
  final String title;
  final String body;
  final String tag;
  final String author;
  final String role;
  final String avatarUrl;
  final String timestamp;
  final int likes;
  final List<ThreadReply> replies;

  CommunityThread({
    required this.id,
    required this.title,
    required this.body,
    this.tag = 'General',
    required this.author,
    this.role = 'Cinema Enthusiast',
    this.avatarUrl = '',
    this.timestamp = '',
    this.likes = 0,
    this.replies = const [],
  });

  factory CommunityThread.fromJson(Map<String, dynamic> json) {
    return CommunityThread(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      body: json['body'] ?? '',
      tag: json['tag'] ?? 'General',
      author: json['author'] ?? '',
      role: json['role'] ?? 'Cinema Enthusiast',
      avatarUrl: json['avatarUrl'] ?? '',
      timestamp: json['timestamp'] ?? '',
      likes: json['likes'] ?? 0,
      replies: (json['replies'] as List<dynamic>?)
              ?.map((r) => ThreadReply.fromJson(r))
              .toList() ??
          [],
    );
  }
}
