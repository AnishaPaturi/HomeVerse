import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  static const _storage = FlutterSecureStorage();
  static const _keyToken = "auth_token";
  static const _keyRefreshToken = "refresh_token";
  static const _keyUserEmail = "user_email";
  static const _keyUserId = "user_id";

  static Future<void> saveToken(String token) async {
    await _storage.write(key: _keyToken, value: token);
  }

  static Future<String?> getToken() async {
    return await _storage.read(key: _keyToken);
  }

  static Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: _keyRefreshToken, value: token);
  }

  static Future<String?> getRefreshToken() async {
    return await _storage.read(key: _keyRefreshToken);
  }

  static Future<void> saveUserData({required String id, required String email}) async {
    await _storage.write(key: _keyUserId, value: id);
    await _storage.write(key: _keyUserEmail, value: email);
  }

  static Future<Map<String, String?>> getUserData() async {
    final id = await _storage.read(key: _keyUserId);
    final email = await _storage.read(key: _keyUserEmail);
    return {'id': id, 'email': email};
  }

  static Future<void> clearAuth() async {
    await _storage.delete(key: _keyToken);
    await _storage.delete(key: _keyRefreshToken);
    await _storage.delete(key: _keyUserId);
    await _storage.delete(key: _keyUserEmail);
  }
}
