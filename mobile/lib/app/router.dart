import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/dashboard/screens/dashboard_screen.dart';
import '../features/dashboard/screens/project_detail_screen.dart';
import '../features/home_setup/screens/home_creation_wizard_screen.dart';
import '../features/rooms/screens/room_detail_screen.dart';
import '../features/playground/screens/room_playground_screen.dart';
import '../features/budget/screens/budget_overview_screen.dart';
import '../features/shopping/screens/shopping_list_screen.dart';
import '../features/walkthrough/screens/walkthrough_screen.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/dashboard',
  routes: [
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/dashboard',
      builder: (context, state) => const DashboardScreen(),
    ),
    GoRoute(
      path: '/home/new',
      builder: (context, state) => const HomeCreationWizardScreen(),
    ),
    GoRoute(
      path: '/project/:projectId',
      builder: (context, state) {
        final projectId = state.pathParameters['projectId'] ?? 'p1';
        return ProjectDetailScreen(projectId: projectId);
      },
    ),
    GoRoute(
      path: '/project/:projectId/rooms/:roomId',
      builder: (context, state) {
        final projectId = state.pathParameters['projectId'] ?? 'p1';
        final roomId = state.pathParameters['roomId'] ?? 'r1';
        return RoomDetailScreen(projectId: projectId, roomId: roomId);
      },
    ),
    GoRoute(
      path: '/project/:projectId/rooms/:roomId/playground',
      builder: (context, state) {
        final projectId = state.pathParameters['projectId'] ?? 'p1';
        final roomId = state.pathParameters['roomId'] ?? 'r1';
        return RoomPlaygroundScreen(projectId: projectId, roomId: roomId);
      },
    ),
    GoRoute(
      path: '/project/:projectId/budget',
      builder: (context, state) {
        final projectId = state.pathParameters['projectId'] ?? 'p1';
        return BudgetOverviewScreen(projectId: projectId);
      },
    ),
    GoRoute(
      path: '/project/:projectId/shopping',
      builder: (context, state) {
        final projectId = state.pathParameters['projectId'] ?? 'p1';
        return ShoppingListScreen(projectId: projectId);
      },
    ),
    GoRoute(
      path: '/project/:projectId/walkthrough',
      builder: (context, state) {
        final projectId = state.pathParameters['projectId'] ?? 'p1';
        return WalkthroughScreen(projectId: projectId);
      },
    ),
  ],
);
