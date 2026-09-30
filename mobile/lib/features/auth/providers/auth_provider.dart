import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/storage/secure_storage.dart';
import '../models/user_model.dart';

class AuthProvider with ChangeNotifier {
  final ApiClient _api = ApiClient();
  UserModel? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> checkAuthStatus() async {
    final token = await SecureStorage.getToken();
    if (token == null || token.isEmpty) return;

    try {
      final res = await _api.get(ApiConstants.me);
      _currentUser = UserModel.fromJson(res);
      notifyListeners();
    } catch (_) {
      await SecureStorage.clearAuth();
      _currentUser = null;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.post(
        ApiConstants.login,
        data: {'email': email, 'password': password},
      );
      final token = res['access_token'] ?? res['token'];
      if (token != null) {
        await SecureStorage.saveToken(token);
        if (res['refresh_token'] != null) {
          await SecureStorage.saveRefreshToken(res['refresh_token']);
        }
      }
      if (res['user'] != null) {
        _currentUser = UserModel.fromJson(res['user']);
      } else {
        await checkAuthStatus();
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> signup(String email, String password, String fullName) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.post(
        ApiConstants.signup,
        data: {
          'email': email,
          'password': password,
          'full_name': fullName,
        },
      );
      final token = res['access_token'] ?? res['token'];
      if (token != null) {
        await SecureStorage.saveToken(token);
      }
      await checkAuthStatus();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await SecureStorage.clearAuth();
    _currentUser = null;
    notifyListeners();
  }
}
