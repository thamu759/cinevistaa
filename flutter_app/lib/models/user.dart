class User {
  final String username;
  final String email;
  final String role;
  final String avatarUrl;
  final String bio;
  final String token;
  final List<String> followers;
  final List<String> following;

  User({
    required this.username,
    this.email = '',
    this.role = 'Cinema Enthusiast',
    this.avatarUrl = '',
    this.bio = '',
    this.token = '',
    this.followers = const [],
    this.following = const [],
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'Cinema Enthusiast',
      avatarUrl: json['avatarUrl'] ?? '',
      bio: json['bio'] ?? '',
      token: json['token'] ?? '',
      followers: (json['followers'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      following: (json['following'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() => {
        'username': username,
        'email': email,
        'role': role,
        'avatarUrl': avatarUrl,
        'bio': bio,
        'token': token,
        'followers': followers,
        'following': following,
      };
}
