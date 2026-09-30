class UserModel {
  final String id;
  final String email;
  final String fullName;
  final String? avatarUrl;

  UserModel({
    required this.id,
    required this.email,
    required this.fullName,
    this.avatarUrl,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      fullName: json['full_name'] ?? json['name'] ?? '',
      avatarUrl: json['avatar_url'] ?? json['picture'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'full_name': fullName,
    'avatar_url': avatarUrl,
  };
}
