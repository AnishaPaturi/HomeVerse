import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/utils/currency_formatter.dart';
import '../models/project_model.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiClient _api = ApiClient();
  List<ProjectModel> _projects = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProjects();
  }

  Future<void> _loadProjects() async {
    setState(() => _isLoading = true);
    try {
      final res = await _api.get(ApiConstants.projects);
      if (res is List) {
        _projects = res.map((p) => ProjectModel.fromJson(p)).toList();
      }
    } catch (_) {
      // Fallback canonical demo project
      _projects = [
        ProjectModel(
          id: "p1",
          name: "Skyline Luxury Penthouse",
          propertyType: "apartment",
          bhk: 3,
          areaSqft: 1850,
          totalBudget: 2500000,
          currency: "INR",
          budgetFlexibility: "Moderate",
          designStyle: "Modern",
          numFloors: 2,
          totalRooms: 5,
        ),
      ];
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("HomeVerse Projects"),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadProjects,
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            onPressed: () => context.go('/login'),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGold))
          : RefreshIndicator(
              onRefresh: _loadProjects,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Welcome Header
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppTheme.primaryIndigo.withOpacity(0.3),
                          AppTheme.primaryGold.withOpacity(0.15),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.primaryIndigo.withOpacity(0.3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "Welcome to HomeVerse Studio",
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          "Design your home seamlessly across Web and Mobile with synced AI recommendations & 3D scenes.",
                          style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: () => context.push('/home/new'),
                          icon: const Icon(Icons.add_home_rounded, size: 18),
                          label: const Text("Create New Home"),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  const Text(
                    "Your Houses",
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 12),

                  if (_projects.isEmpty)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 40),
                        child: Text(
                          "No houses designed yet. Click 'Create New Home' to start.",
                          style: TextStyle(color: AppTheme.textMuted),
                        ),
                      ),
                    )
                  else
                    ..._projects.map((proj) => _buildProjectCard(proj)),
                ],
              ),
            ),
    );
  }

  Widget _buildProjectCard(ProjectModel proj) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: () => context.push('/project/${proj.id}'),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.between,
                children: [
                  Expanded(
                    child: Text(
                      proj.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryGold.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: AppTheme.primaryGold.withOpacity(0.3)),
                    ),
                    child: Text(
                      proj.designStyle,
                      style: const TextStyle(
                        color: AppTheme.primaryGold,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                "${proj.bhk} BHK • ${proj.propertyType.toUpperCase()} • ${proj.numFloors} Floors",
                style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
              ),
              const Divider(color: AppTheme.borderDark, height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.between,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Turnkey Budget",
                        style: TextStyle(color: AppTheme.textMuted, fontSize: 11),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        CurrencyFormatter.formatIndianBudget(proj.totalBudget),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      OutlinedButton.icon(
                        onPressed: () => context.push('/project/${proj.id}/budget'),
                        icon: const Icon(Icons.currency_rupee_rounded, size: 14),
                        label: const Text("Budget", style: TextStyle(fontSize: 12)),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          side: const BorderSide(color: AppTheme.borderDark),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        onPressed: () => context.push('/project/${proj.id}'),
                        icon: const Icon(Icons.arrow_forward_rounded, size: 14),
                        label: const Text("Open", style: TextStyle(fontSize: 12)),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
