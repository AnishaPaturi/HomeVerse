import 'package:flutter/foundation.dart';

class SceneObject {
  final String id;
  final String model;
  final String objectType;
  final List<double> position;
  final List<double> rotation;
  final List<double> scale;
  final String material;
  final double cost;

  SceneObject({
    required this.id,
    required this.model,
    required this.objectType,
    required this.position,
    required this.rotation,
    required this.scale,
    this.material = "default",
    this.cost = 0.0,
  });

  factory SceneObject.fromJson(Map<String, dynamic> json) {
    return SceneObject(
      id: json['id'] ?? json['model'] ?? UniqueKey().toString(),
      model: json['model'] ?? 'cube',
      objectType: json['object_type'] ?? 'furniture',
      position: (json['position'] as List<dynamic>?)
              ?.map((e) => (e as num).toDouble())
              .toList() ??
          [0.0, 0.0, 0.0],
      rotation: (json['rotation'] as List<dynamic>?)
              ?.map((e) => (e as num).toDouble())
              .toList() ??
          [0.0, 0.0, 0.0],
      scale: (json['scale'] as List<dynamic>?)
              ?.map((e) => (e as num).toDouble())
              .toList() ??
          [1.0, 1.0, 1.0],
      material: json['material'] ?? "default",
      cost: (json['cost'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'model': model,
      'object_type': objectType,
      'position': position,
      'rotation': rotation,
      'scale': scale,
      'material': material,
      'cost': cost,
    };
  }
}

class RoomSceneData {
  final String roomId;
  final String roomName;
  final double width;
  final double depth;
  final double height;
  final String style;
  final List<SceneObject> objects;

  RoomSceneData({
    required this.roomId,
    required this.roomName,
    this.width = 4.5,
    this.depth = 4.0,
    this.height = 3.0,
    this.style = "Modern",
    required this.objects,
  });

  factory RoomSceneData.fromJson(Map<String, dynamic> json) {
    return RoomSceneData(
      roomId: json['room_id'] ?? json['room'] ?? '',
      roomName: json['room_name'] ?? 'Living Room',
      width: (json['width'] as num?)?.toDouble() ?? 4.5,
      depth: (json['depth'] as num?)?.toDouble() ?? 4.0,
      height: (json['height'] as num?)?.toDouble() ?? 3.0,
      style: json['style'] ?? 'Modern',
      objects: (json['objects'] as List<dynamic>?)
              ?.map((o) => SceneObject.fromJson(o as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'room_id': roomId,
      'room_name': roomName,
      'width': width,
      'depth': depth,
      'height': height,
      'style': style,
      'objects': objects.map((o) => o.toJson()).toList(),
    };
  }
}
