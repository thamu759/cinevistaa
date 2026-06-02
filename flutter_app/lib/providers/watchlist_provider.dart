import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class WatchlistProvider with ChangeNotifier {
  List<String> _watchlist = [];

  List<String> get watchlist => _watchlist;

  Future<void> loadWatchlist() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getStringList('mc_watchlist');
    if (saved != null) {
      _watchlist = saved;
    } else {
      _watchlist = ['dune-part-two', 'the-batman'];
    }
    notifyListeners();
  }

  Future<void> _save() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('mc_watchlist', _watchlist);
  }

  bool isInWatchlist(String movieId) => _watchlist.contains(movieId);

  Future<void> toggleWatchlist(String movieId) async {
    if (_watchlist.contains(movieId)) {
      _watchlist.remove(movieId);
    } else {
      _watchlist.add(movieId);
    }
    await _save();
    notifyListeners();
  }
}
