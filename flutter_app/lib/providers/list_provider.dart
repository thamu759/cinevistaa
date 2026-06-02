import 'package:flutter/foundation.dart';
import '../models/movie_list.dart';
import '../services/api_service.dart';

class ListProvider with ChangeNotifier {
  final ApiService _api = ApiService();
  List<MovieList> _userLists = [];
  List<MovieList> _allLists = [];
  bool _isLoading = false;

  List<MovieList> get userLists => _userLists;
  List<MovieList> get allLists => _allLists;
  bool get isLoading => _isLoading;

  Future<void> loadUserLists(String username) async {
    try {
      _userLists = await _api.getLists(username: username);
      notifyListeners();
    } catch (_) {}
  }

  Future<void> loadAllLists() async {
    _isLoading = true;
    notifyListeners();
    try {
      _allLists = await _api.getLists();
    } catch (_) {}
    _isLoading = false;
    notifyListeners();
  }

  Future<void> createList(String name, String description) async {
    try {
      await _api.createList({'name': name, 'description': description});
      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> addMovieToList(String listId, String movieId) async {
    try {
      await _api.addMovieToList(listId, movieId);
      notifyListeners();
    } catch (_) {}
  }

  Future<void> removeMovieFromList(String listId, String movieId) async {
    try {
      await _api.removeMovieFromList(listId, movieId);
      notifyListeners();
    } catch (_) {}
  }

  Future<void> deleteList(String listId) async {
    try {
      await _api.deleteList(listId);
      _userLists.removeWhere((l) => l.id == listId);
      _allLists.removeWhere((l) => l.id == listId);
      notifyListeners();
    } catch (_) {}
  }
}
