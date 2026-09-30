import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConstants {
  // Base URLs - Automatically adapts for Web, Android Emulator (10.0.2.2) and iOS/Physical devices
  static String get baseUrl {
    if (kIsWeb) {
      return "http://localhost:8080";
    }
    try {
      if (Platform.isAndroid) {
        return "http://10.0.2.2:8080";
      }
    } catch (_) {}
    return "http://localhost:8080";
  }

  // Auth endpoints
  static const String login = "/api/auth/login";
  static const String signup = "/api/auth/register";
  static const String me = "/api/auth/me";

  // Project endpoints
  static const String projects = "/api/projects";
  static String project(String id) => "/api/projects/$id";

  // Floor endpoints
  static String floors(String projectId) => "/api/projects/$projectId/floors";
  static String floor(String projectId, String floorId) => "/api/projects/$projectId/floors/$floorId";

  // Room endpoints
  static String rooms(String projectId) => "/api/projects/$projectId/rooms";
  static String room(String projectId, String roomId) => "/api/projects/$projectId/rooms/$roomId";

  // Floor plan endpoints
  static const String uploadFloorPlan = "/api/floorplans/upload";
  static const String analyzeFloorPlan = "/api/floorplans/analyze";

  // Design endpoints
  static const String designs = "/api/designs";
  static String design(String id) => "/api/designs/$id";

  // Budget endpoints
  static String projectBudget(String projectId) => "/api/budget/projects/$projectId";
  static String projectAllocations(String projectId) => "/api/budget/projects/$projectId/allocations";
  static const String simulateBudgetImpact = "/api/budget/simulate-impact";

  // 3D Scene & Walkthrough endpoints
  static String roomScene(String roomId) => "/api/scenes/rooms/$roomId";
  static String houseWalkthrough(String projectId) => "/api/walkthrough/projects/$projectId";

  // AI Copilot endpoints
  static const String aiCommand = "/api/ai/command";
  static const String aiWhatIfSimulate = "/api/ai/what-if/simulate";
  static const String aiWhatIfApply = "/api/ai/what-if/apply";

  // Shopping endpoints
  static String shoppingItems(String projectId) => "/api/shopping/projects/$projectId";
}
