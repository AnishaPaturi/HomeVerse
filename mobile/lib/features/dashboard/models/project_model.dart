class RoomModel {
  final String id;
  final String name;
  final String roomType;
  final String? floorId;
  final double width;
  final double length;
  final double areaSqm;
  final String status;
  final double? estimatedBudget;

  RoomModel({
    required this.id,
    required this.name,
    required this.roomType,
    this.floorId,
    this.width = 4.0,
    this.length = 4.0,
    this.areaSqm = 16.0,
    this.status = "in_progress",
    this.estimatedBudget,
  });

  factory RoomModel.fromJson(Map<String, dynamic> json) {
    return RoomModel(
      id: json['id'] ?? '',
      name: json['name'] ?? 'Room',
      roomType: json['room_type'] ?? 'bedroom',
      floorId: json['floor_id'],
      width: (json['width'] as num?)?.toDouble() ?? 4.0,
      length: (json['length'] as num?)?.toDouble() ?? 4.0,
      areaSqm: (json['area_sqm'] as num?)?.toDouble() ?? 16.0,
      status: json['status'] ?? 'in_progress',
      estimatedBudget: (json['estimated_budget'] as num?)?.toDouble(),
    );
  }
}

class FloorModel {
  final String id;
  final String projectId;
  final String name;
  final int floorNumber;
  final List<RoomModel> rooms;

  FloorModel({
    required this.id,
    required this.projectId,
    required this.name,
    required this.floorNumber,
    this.rooms = const [],
  });

  factory FloorModel.fromJson(Map<String, dynamic> json) {
    return FloorModel(
      id: json['id'] ?? '',
      projectId: json['project_id'] ?? '',
      name: json['name'] ?? 'Floor 1',
      floorNumber: json['floor_number'] ?? json['level'] ?? 1,
      rooms: (json['rooms'] as List<dynamic>?)
              ?.map((r) => RoomModel.fromJson(r as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class ProjectModel {
  final String id;
  final String name;
  final String propertyType;
  final int bhk;
  final double areaSqft;
  final double totalBudget;
  final String currency;
  final String budgetFlexibility;
  final String designStyle;
  final int numFloors;
  final int totalRooms;
  final List<FloorModel> floors;
  final List<RoomModel> rooms;
  final String? createdAt;

  ProjectModel({
    required this.id,
    required this.name,
    this.propertyType = "apartment",
    this.bhk = 3,
    this.areaSqft = 1450.0,
    required this.totalBudget,
    this.currency = "INR",
    this.budgetFlexibility = "Moderate",
    this.designStyle = "Modern",
    this.numFloors = 1,
    this.totalRooms = 4,
    this.floors = const [],
    this.rooms = const [],
    this.createdAt,
  });

  factory ProjectModel.fromJson(Map<String, dynamic> json) {
    return ProjectModel(
      id: json['id'] ?? '',
      name: json['name'] ?? 'Home Project',
      propertyType: json['property_type'] ?? 'apartment',
      bhk: json['bhk'] ?? 3,
      areaSqft: (json['area_sqft'] as num?)?.toDouble() ?? 1450.0,
      totalBudget: (json['total_budget'] as num?)?.toDouble() ??
          (json['budget'] as num?)?.toDouble() ??
          2500000.0,
      currency: json['currency'] ?? 'INR',
      budgetFlexibility: json['budget_flexibility'] ?? 'Moderate',
      designStyle: json['design_style'] ?? 'Modern',
      numFloors: json['num_floors'] ?? json['floors_count'] ?? 1,
      totalRooms: json['total_rooms'] ?? 4,
      floors: (json['floors'] as List<dynamic>?)
              ?.map((f) => FloorModel.fromJson(f as Map<String, dynamic>))
              .toList() ??
          [],
      rooms: (json['rooms'] as List<dynamic>?)
              ?.map((r) => RoomModel.fromJson(r as Map<String, dynamic>))
              .toList() ??
          [],
      createdAt: json['created_at'],
    );
  }
}
