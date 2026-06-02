import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/api_service.dart';

class ProfileProvider with ChangeNotifier {
  final ApiService _api = ApiService();
  User? _profileData;
  List<User> _allUsers = [];
  bool _isLoading = false;
  String? _error;

  User? get profileData => _profileData;
  List<User> get allUsers => _allUsers;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadProfile(String username) async {
    _isLoading = true;
    notifyListeners();
    try {
      _profileData = await _api.fetchUserProfile(username);
    } catch (e) {
      _error = e.toString();
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadPublicUsers() async {
    try {
      _allUsers = await _api.fetchPublicUsers();
      notifyListeners();
    } catch (_) {}
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    try {
      _profileData = await _api.updateUserProfile(data);
      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> followUser(String username) async {
    try {
      await _api.followUser(username);
      _allUsers = _allUsers.map((u) {
        if (u.username == username) {
          return User(
            username: u.username,
            email: u.email,
            role: u.role,
            avatarUrl: u.avatarUrl,
            bio: u.bio,
            followers: [...u.followers, _profileData?.username ?? ''],
          );
        }
        return u;
      }).toList();
      notifyListeners();
    } catch (_) {}
  }

  Future<void> unfollowUser(String username) async {
    try {
      await _api.unfollowUser(username);
      _allUsers = _allUsers.map((u) {
        if (u.username == username) {
          return User(
            username: u.username,
            email: u.email,
            role: u.role,
            avatarUrl: u.avatarUrl,
            bio: u.bio,
            followers: u.followers.where((f) => f != _profileData?.username).toList(),
          );
        }
        return u;
      }).toList();
      notifyListeners();
    } catch (_) {}
  }
}
