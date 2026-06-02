import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/movie.dart';
import '../models/user.dart';
import '../models/community_thread.dart';
import '../models/movie_list.dart';
import '../models/watch_provider.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  Future<Map<String, String>> _authHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('mc_token');
    if (token != null) {
      return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };
    }
    return {'Content-Type': 'application/json'};
  }

  Future<Map<String, String>> _headers() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('mc_token');
    if (token != null) {
      return {'Authorization': 'Bearer $token'};
    }
    return {};
  }

  // ─── MOVIES ───

  Future<List<Movie>> fetchMovies({
    String? search,
    String? genre,
    String? sort,
    String? ottPlatform,
  }) async {
    final params = <String, String>{};
    if (search != null) params['search'] = search;
    if (genre != null) params['genre'] = genre;
    if (sort != null) params['sort'] = sort;
    if (ottPlatform != null) params['ottPlatform'] = ottPlatform;

    final uri = Uri.parse(ApiConfig.moviesUrl).replace(queryParameters: params.isNotEmpty ? params : null);
    final response = await http.get(uri, headers: await _authHeaders());
    if (response.statusCode != 200) throw Exception('Failed to fetch movies');
    final List<dynamic> data = jsonDecode(response.body);
    return data.map((e) => Movie.fromJson(e)).toList();
  }

  Future<Movie> fetchMovieById(String id) async {
    final response = await http.get(
      Uri.parse(ApiConfig.movieUrl(id)),
      headers: await _authHeaders(),
    );
    if (response.statusCode != 200) throw Exception('Failed to fetch movie');
    return Movie.fromJson(jsonDecode(response.body));
  }

  Future<Movie> addMovieReview(String movieId, Map<String, dynamic> reviewData) async {
    final response = await http.post(
      Uri.parse(ApiConfig.movieReviewUrl(movieId)),
      headers: await _authHeaders(),
      body: jsonEncode(reviewData),
    );
    if (response.statusCode != 201) {
      final err = jsonDecode(response.body);
      throw Exception(err['error'] ?? 'Failed to submit review');
    }
    return Movie.fromJson(jsonDecode(response.body));
  }

  Future<Map<String, dynamic>> toggleReviewLike(
      String movieId, String reviewId) async {
    final response = await http.post(
      Uri.parse(ApiConfig.reviewLikeUrl(movieId, reviewId)),
      headers: await _authHeaders(),
    );
    if (response.statusCode != 200) throw Exception('Failed to toggle like');
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> addReviewReply(
      String movieId, String reviewId, String body) async {
    final response = await http.post(
      Uri.parse(ApiConfig.reviewReplyUrl(movieId, reviewId)),
      headers: await _authHeaders(),
      body: jsonEncode({'body': body}),
    );
    if (response.statusCode != 201) throw Exception('Failed to add reply');
    return jsonDecode(response.body);
  }

  // ─── AUTH ───

  Future<User> registerUser(String username, String email, String password) async {
    final response = await http.post(
      Uri.parse(ApiConfig.authRegisterUrl),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'username': username, 'email': email, 'password': password}),
    );
    if (response.statusCode != 201) {
      final err = jsonDecode(response.body);
      throw Exception(err['error'] ?? 'Registration failed');
    }
    final user = User.fromJson(jsonDecode(response.body));
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('mc_token', user.token);
    return user;
  }

  Future<User> loginUser(String username, String password) async {
    final response = await http.post(
      Uri.parse(ApiConfig.authLoginUrl),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'username': username, 'password': password}),
    );
    if (response.statusCode != 200) {
      final err = jsonDecode(response.body);
      throw Exception(err['error'] ?? 'Login failed');
    }
    final user = User.fromJson(jsonDecode(response.body));
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('mc_token', user.token);
    return user;
  }

  Future<User?> verifySession() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('mc_token');
    if (token == null) return null;
    try {
      final response = await http.get(
        Uri.parse(ApiConfig.authMeUrl),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode != 200) {
        await prefs.remove('mc_token');
        return null;
      }
      return User.fromJson(jsonDecode(response.body));
    } catch (_) {
      await prefs.remove('mc_token');
      return null;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('mc_token');
  }

  // ─── COMMUNITY ───

  Future<List<CommunityThread>> fetchCommunityThreads() async {
    final response = await http.get(
      Uri.parse(ApiConfig.communityThreadsUrl),
      headers: await _authHeaders(),
    );
    if (response.statusCode != 200) throw Exception('Failed to fetch threads');
    final List<dynamic> data = jsonDecode(response.body);
    return data.map((e) => CommunityThread.fromJson(e)).toList();
  }

  Future<CommunityThread> createCommunityThread(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse(ApiConfig.communityThreadsUrl),
      headers: await _authHeaders(),
      body: jsonEncode(data),
    );
    if (response.statusCode != 201) {
      final err = jsonDecode(response.body);
      throw Exception(err['error'] ?? 'Failed to create thread');
    }
    return CommunityThread.fromJson(jsonDecode(response.body));
  }

  Future<CommunityThread> createCommunityReply(
      String threadId, Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse(ApiConfig.communityReplyUrl(threadId)),
      headers: await _authHeaders(),
      body: jsonEncode(data),
    );
    if (response.statusCode != 201) {
      final err = jsonDecode(response.body);
      throw Exception(err['error'] ?? 'Failed to post reply');
    }
    return CommunityThread.fromJson(jsonDecode(response.body));
  }

  // ─── USERS ───

  Future<User> fetchUserProfile(String username) async {
    final response = await http.get(
      Uri.parse(ApiConfig.userProfileUrl(username)),
      headers: await _authHeaders(),
    );
    if (response.statusCode != 200) throw Exception('Failed to fetch profile');
    return User.fromJson(jsonDecode(response.body));
  }

  Future<List<User>> fetchPublicUsers() async {
    final response = await http.get(
      Uri.parse(ApiConfig.usersUrl),
      headers: await _authHeaders(),
    );
    if (response.statusCode != 200) throw Exception('Failed to fetch users');
    final List<dynamic> data = jsonDecode(response.body);
    return data.map((e) => User.fromJson(e)).toList();
  }

  Future<User> updateUserProfile(Map<String, dynamic> data) async {
    final response = await http.put(
      Uri.parse(ApiConfig.updateProfileUrl),
      headers: await _authHeaders(),
      body: jsonEncode(data),
    );
    if (response.statusCode != 200) {
      final err = jsonDecode(response.body);
      throw Exception(err['error'] ?? 'Failed to update profile');
    }
    return User.fromJson(jsonDecode(response.body));
  }

  Future<void> followUser(String username) async {
    final response = await http.post(
      Uri.parse(ApiConfig.followUrl(username)),
      headers: await _headers(),
    );
    if (response.statusCode != 200) {
      final err = jsonDecode(response.body);
      throw Exception(err['error'] ?? 'Failed to follow user');
    }
  }

  Future<void> unfollowUser(String username) async {
    final response = await http.delete(
      Uri.parse(ApiConfig.followUrl(username)),
      headers: await _headers(),
    );
    if (response.statusCode != 200) {
      final err = jsonDecode(response.body);
      throw Exception(err['error'] ?? 'Failed to unfollow user');
    }
  }

  // ─── LISTS ───

  Future<List<MovieList>> getLists({String? username}) async {
    final uri = username != null
        ? Uri.parse(ApiConfig.listsUrl).replace(
            queryParameters: {'username': username})
        : Uri.parse(ApiConfig.listsUrl);
    final response = await http.get(uri, headers: await _authHeaders());
    if (response.statusCode != 200) throw Exception('Failed to fetch lists');
    final List<dynamic> data = jsonDecode(response.body);
    return data.map((e) => MovieList.fromJson(e)).toList();
  }

  Future<MovieList> createList(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse(ApiConfig.listsUrl),
      headers: await _authHeaders(),
      body: jsonEncode(data),
    );
    if (response.statusCode != 201) {
      final err = jsonDecode(response.body);
      throw Exception(err['error'] ?? 'Failed to create list');
    }
    return MovieList.fromJson(jsonDecode(response.body));
  }

  Future<void> addMovieToList(String listId, String movieId) async {
    final response = await http.post(
      Uri.parse(ApiConfig.listMoviesUrl(listId)),
      headers: await _authHeaders(),
      body: jsonEncode({'movieId': movieId}),
    );
    if (response.statusCode != 200) throw Exception('Failed to add movie');
  }

  Future<void> removeMovieFromList(String listId, String movieId) async {
    final response = await http.delete(
      Uri.parse(ApiConfig.listMovieUrl(listId, movieId)),
      headers: await _headers(),
    );
    if (response.statusCode != 200) throw Exception('Failed to remove movie');
  }

  Future<void> deleteList(String listId) async {
    final response = await http.delete(
      Uri.parse(ApiConfig.listUrl(listId)),
      headers: await _headers(),
    );
    if (response.statusCode != 200) throw Exception('Failed to delete list');
  }

  // ─── LEADERBOARD ───

  Future<List<LeaderboardEntry>> fetchLeaderboard() async {
    final response = await http.get(
      Uri.parse(ApiConfig.leaderboardUrl),
      headers: await _authHeaders(),
    );
    if (response.statusCode != 200) throw Exception('Failed to fetch leaderboard');
    final List<dynamic> data = jsonDecode(response.body);
    return data.map((e) => LeaderboardEntry.fromJson(e)).toList();
  }

  // ─── TMDB ───

  Future<List<dynamic>> fetchTmdbCredits(String tmdbId) async {
    final response = await http.get(Uri.parse(ApiConfig.tmdbCreditsUrl(tmdbId)));
    if (response.statusCode != 200) return [];
    return jsonDecode(response.body);
  }

  Future<List<WatchProvider>> fetchWatchProviders(String tmdbId) async {
    if (tmdbId.isEmpty) return [];
    try {
      final response = await http.get(Uri.parse(ApiConfig.tmdbProvidersUrl(tmdbId)));
      if (response.statusCode != 200) return [];
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((e) => WatchProvider.fromJson(e)).toList();
    } catch (_) {
      return [];
    }
  }

  // ─── PAGE CONTENT ───

  Future<Map<String, dynamic>> fetchPageContent(String page) async {
    final response = await http.get(Uri.parse(ApiConfig.pageUrl(page)));
    if (response.statusCode != 200) throw Exception('Page not found');
    return jsonDecode(response.body);
  }
}
