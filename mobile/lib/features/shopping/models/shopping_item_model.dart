class ShoppingItemModel {
  final String id;
  final String projectId;
  final String name;
  final int quantity;
  final double estimatedCost;
  final String status;
  final String? category;
  final String? vendor;
  final String? imageUrl;

  ShoppingItemModel({
    required this.id,
    required this.projectId,
    required this.name,
    this.quantity = 1,
    required this.estimatedCost,
    this.status = "Selected",
    this.category,
    this.vendor,
    this.imageUrl,
  });

  factory ShoppingItemModel.fromJson(Map<String, dynamic> json) {
    return ShoppingItemModel(
      id: json['id'] ?? '',
      projectId: json['project_id'] ?? '',
      name: json['name'] ?? 'Furniture Item',
      quantity: json['quantity'] ?? 1,
      estimatedCost: (json['estimated_cost'] as num?)?.toDouble() ?? 0.0,
      status: json['status'] ?? 'Selected',
      category: json['category'],
      vendor: json['vendor'],
      imageUrl: json['product_details']?['image_url'] ?? json['image_url'],
    );
  }
}
