import 'package:flutter/foundation.dart';
import '../models/community_thread.dart';
import '../services/api_service.dart';

class CommunityProvider with ChangeNotifier {
  final ApiService _api = ApiService();
  List<CommunityThread> _threads = [];
  bool _isLoading = false;
  String? _error;

  List<CommunityThread> get threads => _threads;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadThreads() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _threads = await _api.fetchCommunityThreads();
    } catch (e) {
      _error = e.toString();
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> createThread(String title, String body, String tag) async {
    try {
      final thread = await _api.createCommunityThread({
        'title': title,
        'body': body,
        'tag': tag,
      });
      _threads.insert(0, thread);
      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> addReply(String threadId, String body) async {
    try {
      final updated = await _api.createCommunityReply(threadId, {'body': body});
      _threads = _threads.map((t) => t.id == threadId ? updated : t).toList();
      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }
}
