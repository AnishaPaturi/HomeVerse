class AppException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic details;

  AppException(this.message, {this.statusCode, this.details});

  @override
  String toString() => "AppException(statusCode: $statusCode, message: $message)";
}

class NetworkException extends AppException {
  NetworkException(String message, {int? statusCode}) : super(message, statusCode: statusCode);
}

class AuthException extends AppException {
  AuthException(String message) : super(message, statusCode: 401);
}

class ValidationException extends AppException {
  ValidationException(String message, {dynamic details}) : super(message, statusCode: 422, details: details);
}
