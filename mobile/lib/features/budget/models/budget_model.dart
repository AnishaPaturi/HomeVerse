class BudgetAllocationModel {
  final String id;
  final String? floorId;
  final String? roomId;
  final String? roomName;
  final String category;
  final double allocatedAmount;
  final double estimatedAmount;
  final double spentAmount;

  BudgetAllocationModel({
    required this.id,
    this.floorId,
    this.roomId,
    this.roomName,
    required this.category,
    required this.allocatedAmount,
    this.estimatedAmount = 0.0,
    this.spentAmount = 0.0,
  });

  factory BudgetAllocationModel.fromJson(Map<String, dynamic> json) {
    return BudgetAllocationModel(
      id: json['id'] ?? '',
      floorId: json['floor_id'],
      roomId: json['room_id'],
      roomName: json['room_name'],
      category: json['category'] ?? 'General',
      allocatedAmount: (json['allocated_amount'] as num?)?.toDouble() ?? 0.0,
      estimatedAmount: (json['estimated_amount'] as num?)?.toDouble() ?? 0.0,
      spentAmount: (json['spent_amount'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class BudgetModel {
  final String id;
  final String projectId;
  final double totalBudget;
  final double spentAmount;
  final double estimatedAmount;
  final double remainingAmount;
  final String currency;
  final String flexibility;
  final List<BudgetAllocationModel> allocations;

  BudgetModel({
    required this.id,
    required this.projectId,
    required this.totalBudget,
    this.spentAmount = 0.0,
    this.estimatedAmount = 0.0,
    this.remainingAmount = 0.0,
    this.currency = "INR",
    this.flexibility = "Moderate",
    this.allocations = const [],
  });

  factory BudgetModel.fromJson(Map<String, dynamic> json) {
    final total = (json['total_budget'] as num?)?.toDouble() ?? 0.0;
    final spent = (json['spent_amount'] as num?)?.toDouble() ?? 0.0;
    final estimated = (json['estimated_amount'] as num?)?.toDouble() ?? 0.0;
    final remaining = (json['remaining_amount'] as num?)?.toDouble() ?? (total - estimated);

    return BudgetModel(
      id: json['id'] ?? '',
      projectId: json['project_id'] ?? '',
      totalBudget: total,
      spentAmount: spent,
      estimatedAmount: estimated,
      remainingAmount: remaining,
      currency: json['currency'] ?? 'INR',
      flexibility: json['flexibility'] ?? 'Moderate',
      allocations: (json['allocations'] as List<dynamic>?)
              ?.map((a) => BudgetAllocationModel.fromJson(a as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class AlternativeItem {
  final String name;
  final double price;
  final double savings;
  final String? retailer;

  AlternativeItem({
    required this.name,
    required this.price,
    required this.savings,
    this.retailer,
  });

  factory AlternativeItem.fromJson(Map<String, dynamic> json) {
    return AlternativeItem(
      name: json['name'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      savings: (json['savings'] as num?)?.toDouble() ?? 0.0,
      retailer: json['retailer'],
    );
  }
}

class BudgetImpactSimulationModel {
  final double deltaAmount;
  final double currentRoomBudget;
  final double newRoomBudget;
  final double totalBudget;
  final double remainingBudgetAfter;
  final bool isWithinBudget;
  final String impactMessage;
  final List<AlternativeItem> cheaperAlternatives;

  BudgetImpactSimulationModel({
    required this.deltaAmount,
    required this.currentRoomBudget,
    required this.newRoomBudget,
    required this.totalBudget,
    required this.remainingBudgetAfter,
    required this.isWithinBudget,
    required this.impactMessage,
    this.cheaperAlternatives = const [],
  });

  factory BudgetImpactSimulationModel.fromJson(Map<String, dynamic> json) {
    return BudgetImpactSimulationModel(
      deltaAmount: (json['delta_amount'] as num?)?.toDouble() ??
          (json['cost_delta'] as num?)?.toDouble() ??
          0.0,
      currentRoomBudget: (json['current_room_budget'] as num?)?.toDouble() ?? 0.0,
      newRoomBudget: (json['new_room_budget'] as num?)?.toDouble() ?? 0.0,
      totalBudget: (json['total_budget'] as num?)?.toDouble() ?? 0.0,
      remainingBudgetAfter: (json['remaining_budget_after'] as num?)?.toDouble() ??
          (json['remaining_amount'] as num?)?.toDouble() ??
          0.0,
      isWithinBudget: json['is_within_budget'] ?? true,
      impactMessage: json['impact_message'] ?? json['message'] ?? '',
      cheaperAlternatives: (json['cheaper_alternatives'] as List<dynamic>?)
              ?.map((a) => AlternativeItem.fromJson(a as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
