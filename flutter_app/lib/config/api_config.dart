class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:5000/api',
  );

  static String get moviesUrl => '$baseUrl/movies';
  static String movieUrl(String id) => '$baseUrl/movies/$id';
  static String movieReviewUrl(String movieId) => '$baseUrl/movies/$movieId/reviews';
  static String reviewLikeUrl(String movieId, String reviewId) =>
      '$baseUrl/movies/$movieId/reviews/$reviewId/like';
  static String reviewReplyUrl(String movieId, String reviewId) =>
      '$baseUrl/movies/$movieId/reviews/$reviewId/replies';

  static String get authRegisterUrl => '$baseUrl/auth/register';
  static String get authLoginUrl => '$baseUrl/auth/login';
  static String get authMeUrl => '$baseUrl/auth/me';

  static String get communityThreadsUrl => '$baseUrl/community/threads';
  static String communityReplyUrl(String threadId) =>
      '$baseUrl/community/threads/$threadId/replies';

  static String get usersUrl => '$baseUrl/users';
  static String userProfileUrl(String username) => '$baseUrl/users/$username';
  static String get updateProfileUrl => '$baseUrl/users/profile';
  static String followUrl(String username) => '$baseUrl/users/$username/follow';

  static String get listsUrl => '$baseUrl/lists';
  static String listUrl(String id) => '$baseUrl/lists/$id';
  static String listMoviesUrl(String listId) => '$baseUrl/lists/$listId/movies';
  static String listMovieUrl(String listId, String movieId) =>
      '$baseUrl/lists/$listId/movies/$movieId';

  static String get leaderboardUrl => '$baseUrl/leaderboard';

  static String tmdbSearchUrl(String query) =>
      '$baseUrl/tmdb/search?query=$query';
  static String tmdbCreditsUrl(String tmdbId) =>
      '$baseUrl/tmdb/credits/$tmdbId';
  static String tmdbDetailsUrl(String tmdbId) =>
      '$baseUrl/tmdb/details/$tmdbId';
  static String tmdbProvidersUrl(String tmdbId) =>
      '$baseUrl/tmdb/providers/$tmdbId';
  static String tmdbImageUrl(String path, {String size = 'original'}) =>
      '$baseUrl/tmdb/image?path=$path&size=$size';

  static String get adminUsersUrl => '$baseUrl/admin/users';
  static String adminUserUrl(String username) => '$baseUrl/admin/users/$username';
  static String adminUserRoleUrl(String username) =>
      '$baseUrl/admin/users/$username/role';
  static String adminThreadUrl(String threadId) =>
      '$baseUrl/admin/threads/$threadId';

  static String pageUrl(String page) => '$baseUrl/pages/$page';
}
