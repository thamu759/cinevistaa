import 'package:flutter/foundation.dart';
import '../models/movie.dart';
import '../models/review.dart';
import '../models/watch_provider.dart';
import '../services/api_service.dart';

class MovieProvider with ChangeNotifier {
  final ApiService _api = ApiService();
  List<Movie> _movies = [];
  List<Movie> _newReleases = [];
  List<Movie> _newReleasesPage = [];
  List<Movie> _topRatedPage = [];
  Movie? _selectedMovie;
  List<WatchProvider> _watchProviders = [];
  bool _isLoading = false;
  bool _isNewReleasesLoading = false;
  bool _isTopRatedLoading = false;
  String? _error;

  String _selectedGenre = '';
  String _sortOption = 'rating';
  String _selectedOttPlatform = '';

  List<Movie> get movies => _movies;
  List<Movie> get newReleases => _newReleases;
  List<Movie> get newReleasesPage => _newReleasesPage;
  List<Movie> get topRatedPage => _topRatedPage;
  Movie? get selectedMovie => _selectedMovie;
  List<WatchProvider> get watchProviders => _watchProviders;
  bool get isLoading => _isLoading;
  bool get isNewReleasesLoading => _isNewReleasesLoading;
  bool get isTopRatedLoading => _isTopRatedLoading;
  String? get error => _error;

  String get selectedGenre => _selectedGenre;
  String get sortOption => _sortOption;
  String get selectedOttPlatform => _selectedOttPlatform;

  List<Movie> get heroMovies => _movies.where((m) => m.isHero).toList();
  List<Movie> get tamilMovies =>
      _movies.where((m) => m.language.toUpperCase() == 'TAMIL').toList();
  List<Movie> get malayalamMovies =>
      _movies.where((m) => m.language.toUpperCase() == 'MALAYALAM').toList();
  List<Movie> get topRatedMovies =>
      _movies.where((m) => m.rating >= 7).toList()
        ..sort((a, b) => b.rating.compareTo(a.rating));
  List<Movie> get streamingMovies =>
      _movies.where((m) => m.ott?.platform != null).toList();
  List<Movie> get upcomingOttMovies => _movies
      .where((m) => m.ott?.platform != null && m.ott!.releaseDate.isNotEmpty)
      .toList();

  List<Movie> get staffPicks =>
      _movies.where((m) => m.isStaffPick).toList();
  Movie? get featuredStaffPick =>
      _movies.where((m) => m.isStaffPick && m.staffPickType == 'featured').firstOrNull ??
      staffPicks.firstOrNull;
  List<Movie> get gridStaffPicks =>
      _movies.where((m) => m.isStaffPick && m.staffPickType == 'grid').take(3).toList();

  Future<void> loadMovies() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _movies = await _api.fetchMovies(
        genre: _selectedGenre.isNotEmpty ? _selectedGenre : null,
        sort: _sortOption,
        ottPlatform: _selectedOttPlatform.isNotEmpty ? _selectedOttPlatform : null,
      );
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadNewReleases() async {
    try {
      final data = await _api.fetchMovies(sort: 'release-desc');
      _newReleases = data.where((m) => !m.isUpcoming).take(15).toList();
      notifyListeners();
    } catch (_) {}
  }

  Future<void> loadNewReleasesPage() async {
    _isNewReleasesLoading = true;
    notifyListeners();
    try {
      final data = await _api.fetchMovies(sort: 'release-desc');
      _newReleasesPage = data.where((m) => !m.isUpcoming).toList();
    } catch (_) {}
    _isNewReleasesLoading = false;
    notifyListeners();
  }

  Future<void> loadTopRatedPage() async {
    _isTopRatedLoading = true;
    notifyListeners();
    try {
      final data = await _api.fetchMovies(sort: 'rating');
      _topRatedPage = data.where((m) => m.rating >= 7).toList();
    } catch (_) {}
    _isTopRatedLoading = false;
    notifyListeners();
  }

  Future<void> loadMovieById(String id) async {
    _selectedMovie = null;
    notifyListeners();
    try {
      _selectedMovie = await _api.fetchMovieById(id);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> loadWatchProviders(String tmdbId) async {
    try {
      _watchProviders = await _api.fetchWatchProviders(tmdbId);
      notifyListeners();
    } catch (_) {
      _watchProviders = [];
      notifyListeners();
    }
  }

  void setGenre(String genre) {
    _selectedGenre = genre;
    loadMovies();
  }

  void setSort(String sort) {
    _sortOption = sort;
    loadMovies();
  }

  void setOttPlatform(String platform) {
    _selectedOttPlatform = platform;
    loadMovies();
  }

  Future<void> addReview(String movieId, Map<String, dynamic> data) async {
    try {
      _selectedMovie = await _api.addMovieReview(movieId, data);
      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> toggleLike(String movieId, String reviewId) async {
    final movie = _selectedMovie;
    if (movie == null) return;
    try {
      final result = await _api.toggleReviewLike(movieId, reviewId);
      final updatedReviews = movie.reviews.map((rev) {
        if (rev.id == reviewId) {
          return Review(
            id: rev.id,
            user: rev.user,
            avatarUrl: rev.avatarUrl,
            role: rev.role,
            rating: rev.rating,
            text: rev.text,
            timestamp: rev.timestamp,
            likes: result['likes'] ?? rev.likes,
            comments: rev.comments,
            likedBy: (result['likedBy'] as List<dynamic>?)
                    ?.map((e) => e.toString())
                    .toList() ??
                rev.likedBy,
            replies: rev.replies,
          );
        }
        return rev;
      }).toList();
      _selectedMovie = Movie(
        id: movie.id,
        title: movie.title,
        description: movie.description,
        rating: movie.rating,
        criticScore: movie.criticScore,
        audienceScore: movie.audienceScore,
        genre: movie.genre,
        releaseYear: movie.releaseYear,
        runtime: movie.runtime,
        director: movie.director,
        writer: movie.writer,
        studio: movie.studio,
        releaseDate: movie.releaseDate,
        language: movie.language,
        posterUrl: movie.posterUrl,
        backdropUrl: movie.backdropUrl,
        tmdbId: movie.tmdbId,
        isHero: movie.isHero,
        isStaffPick: movie.isStaffPick,
        staffPickType: movie.staffPickType,
        isUpcoming: movie.isUpcoming,
        trailerUrl: movie.trailerUrl,
        trailerChannelName: movie.trailerChannelName,
        ott: movie.ott,
        cast: movie.cast,
        reviews: updatedReviews,
      );
      notifyListeners();
    } catch (_) {}
  }
}
