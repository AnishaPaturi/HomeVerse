import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../core/utils/currency_formatter.dart';
import '../models/project_model.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';

class ProjectDetailScreen extends StatefulWidget {
  final String projectId;

  const ProjectDetailScreen({Key? key, required this.projectId}) : super(key: key);

  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> {
  final ApiClient _api = ApiClient();
  ProjectModel? _project;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProject();
  }

  Future<void> _loadProject() async {
    setState(() => _isLoading = true);
    try {
      final res = await _api.get(ApiConstants.project(widget.projectId));
      _project = ProjectModel.fromJson(res);
    } catch (_) {
      _project = ProjectModel(
        id: widget.projectId,
        name: "Skyline Luxury Penthouse",
        propertyType: "apartment",
        bhk: 3,
        areaSqft: 1850,
        totalBudget: 2500000,
        currency: "INR",
        budgetFlexibility: "Moderate",
        designStyle: "Modern Scandinavian",
        numFloors: 2,
        totalRooms: 4,
        rooms: [
          RoomModel(id: "r1", name: "Living Room", roomType: "living_room", width: 5.0, length: 4.5, areaSqm: 22.5, estimatedBudget: 875000),
          RoomModel(id: "r2", name: "Master Bedroom", roomType: "bedroom", width: 4.2, length: 3.8, areaSqm: 16.0, estimatedBudget: 625000),
          RoomModel(id: "r3", name: "Modular Kitchen", roomType: "kitchen", width: 3.6, length: 3.2, areaSqm: 11.5, estimatedBudget: 500000),
          RoomModel(id: "r4", name: "Balcony Lounge", roomType: "balcony", width: 4.0, length: 2.0, areaSqm: 8.0, estimatedBudget: 250000),
        ],
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: AppTheme.primaryGold)),
      );
    }

    final p = _project!;

    return Scaffold(
      appBar: AppBar(
        title: Text(p.name),
        actions: [
          IconButton(
            icon: const Icon(Icons.currency_rupee_rounded, color: AppTheme.primaryGold),
            tooltip: "Budget",
            onPressed: () => context.push('/project/${p.id}/budget'),
          ),
          IconButton(
            icon: const Icon(Icons.shopping_bag_outlined),
            tooltip: "Procurement",
            onPressed: () => context.push('/project/${p.id}/shopping'),
          ),
          IconButton(
            icon: const Icon(Icons.explore_outlined),
            tooltip: "3D Walkthrough",
            onPressed: () => context.push('/project/${p.id}/walkthrough'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Project Meta Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.surfaceCard,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.borderDark),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: [
                    Text(
                      "${p.bhk} BHK • ${p.propertyType.toUpperCase()}",
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                    ),
                    Text(
                      CurrencyFormatter.formatIndianBudget(p.totalBudget),
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.primaryGold),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  "Design Theme: ${p.designStyle} • Flexibility: ${p.budgetFlexibility}",
                  style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => context.push('/project/${p.id}/walkthrough'),
                        icon: const Icon(Icons.explore_rounded, size: 16),
                        label: const Text("House Walkthrough", style: TextStyle(fontSize: 12)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => context.push('/project/${p.id}/budget'),
                        icon: const Icon(Icons.pie_chart_outline, size: 16),
                        label: const Text("Budget Hub", style: TextStyle(fontSize: 12)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: AppTheme.borderDark),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          const Text("House Rooms", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),

          ...p.rooms.map((r) => Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceDark,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.meeting_room_outlined, color: AppTheme.primaryGold),
                  ),
                  title: Text(r.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  subtitle: Text("${r.areaSqm} sqm • ${r.width}m × ${r.length}m", style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (r.estimatedBudget != null)
                        Text(
                          CurrencyFormatter.formatIndianBudget(r.estimatedBudget!),
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                      const SizedBox(width: 8),
                      const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.textMuted),
                    ],
                  ),
                  onTap: () => context.push('/project/${p.id}/rooms/${r.id}'),
                ),
              )),
        ],
      ),
    );
  }
}
