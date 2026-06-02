class WatchProvider {
  final int id;
  final String name;
  final String logo;
  final String type;

  WatchProvider({
    required this.id,
    required this.name,
    this.logo = '',
    this.type = 'flatrate',
  });

  factory WatchProvider.fromJson(Map<String, dynamic> json) {
    return WatchProvider(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      logo: json['logo'] ?? '',
      type: json['type'] ?? 'flatrate',
    );
  }
}

class LeaderboardEntry {
  final String username;
  final String avatarUrl;
  final String role;
  final int reviewCount;
  final double averageRating;
  final int followersCount;

  LeaderboardEntry({
    required this.username,
    this.avatarUrl = '',
    this.role = '',
    this.reviewCount = 0,
    this.averageRating = 0,
    this.followersCount = 0,
  });

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      username: json['username'] ?? '',
      avatarUrl: json['avatarUrl'] ?? '',
      role: json['role'] ?? '',
      reviewCount: json['reviewCount'] ?? 0,
      averageRating: (json['averageRating'] ?? 0).toDouble(),
      followersCount: json['followersCount'] ?? 0,
    );
  }
}

class PageContent {
  final String title;
  final String? updated;
  final List<PageSection> sections;

  PageContent({
    required this.title,
    this.updated,
    this.sections = const [],
  });

  factory PageContent.fromJson(Map<String, dynamic> json) {
    return PageContent(
      title: json['title'] ?? '',
      updated: json['updated'],
      sections: (json['sections'] as List<dynamic>?)
              ?.map((s) => PageSection.fromJson(s))
              .toList() ??
          [],
    );
  }
}

class PageSection {
  final String heading;
  final String text;

  PageSection({
    required this.heading,
    required this.text,
  });

  factory PageSection.fromJson(Map<String, dynamic> json) {
    return PageSection(
      heading: json['heading'] ?? '',
      text: json['text'] ?? '',
    );
  }
}
