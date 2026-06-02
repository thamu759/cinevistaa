class MovieList {
  final String id;
  final String name;
  final String description;
  final String createdBy;
  final List<String> movieIds;

  MovieList({
    required this.id,
    required this.name,
    this.description = '',
    this.createdBy = '',
    this.movieIds = const [],
  });

  factory MovieList.fromJson(Map<String, dynamic> json) {
    return MovieList(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      createdBy: json['createdBy'] ?? '',
      movieIds: (json['movieIds'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }
}
