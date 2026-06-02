class ReviewReply {
  final String id;
  final String author;
  final String body;
  final String timestamp;

  ReviewReply({
    required this.id,
    required this.author,
    required this.body,
    required this.timestamp,
  });

  factory ReviewReply.fromJson(Map<String, dynamic> json) {
    return ReviewReply(
      id: json['id'] ?? '',
      author: json['author'] ?? '',
      body: json['body'] ?? '',
      timestamp: json['timestamp'] ?? '',
    );
  }
}

class Review {
  final String id;
  final String user;
  final String avatarUrl;
  final String role;
  final int rating;
  final String text;
  final String timestamp;
  final int likes;
  final int comments;
  final List<String> likedBy;
  final List<ReviewReply> replies;

  Review({
    required this.id,
    required this.user,
    this.avatarUrl = '',
    this.role = '',
    this.rating = 0,
    this.text = '',
    this.timestamp = '',
    this.likes = 0,
    this.comments = 0,
    this.likedBy = const [],
    this.replies = const [],
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id'] ?? '',
      user: json['user'] ?? '',
      avatarUrl: json['avatarUrl'] ?? '',
      role: json['role'] ?? '',
      rating: json['rating'] ?? 0,
      text: json['text'] ?? '',
      timestamp: json['timestamp'] ?? '',
      likes: json['likes'] ?? 0,
      comments: json['comments'] ?? 0,
      likedBy: (json['likedBy'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      replies: (json['replies'] as List<dynamic>?)
              ?.map((r) => ReviewReply.fromJson(r))
              .toList() ??
          [],
    );
  }
}
