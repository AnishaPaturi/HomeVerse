import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../core/utils/currency_formatter.dart';
import '../models/project_model.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../shared/widgets/brand_widgets.dart';

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
        backgroundColor: AppTheme.backgroundDark,
        body: Center(child: CircularProgressIndicator(color: AppTheme.primaryEmerald)),
      );
    }

    final p = _project!;

    return Scaffold(
      backgroundColor: AppTheme.backgroundDark,
      appBar: AppBar(
        title: Text(
          p.name,
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.currency_rupee_rounded, color: AppTheme.primaryEmerald),
            tooltip: "Budget",
            onPressed: () => context.push('/project/${p.id}/budget'),
          ),
          IconButton(
            icon: const Icon(Icons.shopping_bag_outlined, color: AppTheme.primaryTeal),
            tooltip: "Procurement",
            onPressed: () => context.push('/project/${p.id}/shopping'),
          ),
          IconButton(
            icon: const Icon(Icons.explore_outlined, color: AppTheme.primaryLime),
            tooltip: "3D Walkthrough",
            onPressed: () => context.push('/project/${p.id}/walkthrough'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          // Project Meta Glass Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: AppTheme.glassCardDecoration,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "${p.bhk} BHK • ${p.propertyType.toUpperCase()}",
                      style: GoogleFonts.spaceMono(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      CurrencyFormatter.formatIndianBudget(p.totalBudget),
                      style: GoogleFonts.spaceMono(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: const Color(0xFF34D399),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  "Design Theme: ${p.designStyle} • Flexibility: ${p.budgetFlexibility}",
                  style: GoogleFonts.inter(color: AppTheme.textMuted, fontSize: 12),
                ),
                const SizedBox(height: 18),

                // 2 Action Buttons matching web
                Row(
                  children: [
                    Expanded(
                      child: GradientButton(
                        onPressed: () => context.push('/project/${p.id}/walkthrough'),
                        icon: Icons.explore_rounded,
                        height: 42,
                        child: const Text("3D Walkthrough"),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => context.push('/project/${p.id}/budget'),
                        icon: const Icon(Icons.pie_chart_outline, size: 16, color: Colors.white),
                        label: Text(
                          "Budget Hub",
                          style: GoogleFonts.spaceMono(fontSize: 12, color: Colors.white),
                        ),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 11),
                          side: const BorderSide(color: Color(0x33FFFFFF)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Studio Quick Navigation Grid (matching web studio tools)
          Row(
            children: [
              Expanded(
                child: _buildStudioActionCard(
                  "Shopping & PO",
                  "Procurement",
                  Icons.shopping_bag_outlined,
                  AppTheme.primaryTeal,
                  () => context.push('/project/${p.id}/shopping'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildStudioActionCard(
                  "Budget Plan",
                  "Turnkey Hub",
                  Icons.currency_rupee_rounded,
                  AppTheme.primaryEmerald,
                  () => context.push('/project/${p.id}/budget'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Rooms Section
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Digital Twin Rooms (${p.rooms.length})",
                style: GoogleFonts.spaceMono(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              Text(
                "TAP TO ENTER 3D",
                style: GoogleFonts.spaceMono(
                  fontSize: 10,
                  color: AppTheme.textMuted,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          ...p.rooms.map((r) => Container(
                margin: const EdgeInsets.only(bottom: 12),
                decoration: AppTheme.glassCardDecoration,
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  leading: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryEmerald.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.primaryEmerald.withOpacity(0.25)),
                    ),
                    child: const Icon(Icons.meeting_room_outlined, color: Color(0xFF34D399), size: 22),
                  ),
                  title: Text(
                    r.name,
                    style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                  ),
                  subtitle: Text(
                    "${r.areaSqm} sqm • ${r.width}m × ${r.length}m",
                    style: GoogleFonts.inter(color: AppTheme.textMuted, fontSize: 11),
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (r.estimatedBudget != null)
                        Text(
                          CurrencyFormatter.formatIndianBudget(r.estimatedBudget!),
                          style: GoogleFonts.spaceMono(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                            color: const Color(0xFF34D399),
                          ),
                        ),
                      const SizedBox(width: 8),
                      const Icon(Icons.arrow_forward_ios_rounded, size: 13, color: AppTheme.textMuted),
                    ],
                  ),
                  onTap: () => context.push('/project/${p.id}/rooms/${r.id}'),
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildStudioActionCard(String title, String subtitle, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppTheme.surfaceCard,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0x1AFFFFFF), width: 1),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 18),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.inter(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    subtitle,
                    style: GoogleFonts.spaceMono(color: AppTheme.textMuted, fontSize: 10),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
