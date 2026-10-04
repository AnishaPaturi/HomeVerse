import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/utils/currency_formatter.dart';
import '../models/project_model.dart';
import '../../../shared/widgets/brand_widgets.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiClient _api = ApiClient();
  List<ProjectModel> _projects = [];
  bool _isLoading = true;
  String _selectedFilter = "all"; // "all", "apartment", "villa"

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
      // Fallback canonical demo projects matching Web
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
          designStyle: "Modern Minimalist",
          numFloors: 2,
          totalRooms: 5,
        ),
        ProjectModel(
          id: "p2",
          name: "Emerald Bay Contemporary Villa",
          propertyType: "villa",
          bhk: 4,
          areaSqft: 3400,
          totalBudget: 6500000,
          currency: "INR",
          budgetFlexibility: "Custom",
          designStyle: "Biophilic Luxury",
          numFloors: 3,
          totalRooms: 8,
        ),
      ];
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<ProjectModel> get _filteredProjects {
    if (_selectedFilter == "all") return _projects;
    return _projects.where((p) => p.propertyType.toLowerCase().contains(_selectedFilter)).toList();
  }

  double get _totalPortfolioBudget {
    return _projects.fold(0.0, (sum, p) => sum + p.totalBudget);
  }

  int get _totalRoomsCount {
    return _projects.fold(0, (sum, p) => sum + p.totalRooms);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundDark,
      appBar: AppBar(
        title: const HomeVerseLogo(iconSize: 30, fontSize: 15),
        actions: [
          IconButton(
            tooltip: "Refresh Studio",
            icon: const Icon(Icons.refresh_rounded, color: AppTheme.textMuted),
            onPressed: _loadProjects,
          ),
          IconButton(
            tooltip: "Sign Out",
            icon: const Icon(Icons.logout_rounded, color: AppTheme.textMuted),
            onPressed: () => context.go('/login'),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryEmerald))
          : RefreshIndicator(
              color: AppTheme.primaryEmerald,
              backgroundColor: AppTheme.surfaceCard,
              onRefresh: _loadProjects,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                children: [
                  // Studio Header Banner
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: AppTheme.glassCardDecoration,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const StudioChip(),
                        const SizedBox(height: 12),
                        Text(
                          "Architectural Residences Studio",
                          style: GoogleFonts.playfairDisplay(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            height: 1.2,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          "Inspect multi-floor digital twins, control Indian room-by-room budget envelopes, and inspect real-time spatial models.",
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: AppTheme.textMuted,
                            height: 1.4,
                          ),
                        ),
                        const SizedBox(height: 18),
                        GradientButton(
                          onPressed: () => context.push('/home/new'),
                          icon: Icons.add_home_work_rounded,
                          child: const Text("Start New Home"),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Dynamic Intelligence Ribbon (2x2 Grid matching Web)
                  Row(
                    children: [
                      Expanded(
                        child: _buildMetricTile(
                          "ACTIVE RESIDENCES",
                          "${_projects.length}",
                          Icons.home_outlined,
                          AppTheme.primaryEmerald,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildMetricTile(
                          "PORTFOLIO BUDGET",
                          CurrencyFormatter.formatIndianBudget(_totalPortfolioBudget),
                          Icons.currency_rupee_rounded,
                          AppTheme.primaryTeal,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: _buildMetricTile(
                          "TOTAL ROOMS",
                          "$_totalRoomsCount Rooms",
                          Icons.grid_view_rounded,
                          AppTheme.primaryLime,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildMetricTile(
                          "STUDIO STATUS",
                          "Synced • Live",
                          Icons.verified_outlined,
                          const Color(0xFF38BDF8),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 22),

                  // Section Title & Filter Tabs
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "Your Residences",
                        style: GoogleFonts.spaceMono(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Row(
                        children: [
                          _buildFilterPill("All", "all"),
                          const SizedBox(width: 6),
                          _buildFilterPill("Villas", "villa"),
                          const SizedBox(width: 6),
                          _buildFilterPill("Apartments", "apartment"),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  if (_filteredProjects.isEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
                      decoration: AppTheme.glassDecoration,
                      alignment: Alignment.center,
                      child: Column(
                        children: [
                          const Icon(Icons.maps_home_work_outlined, size: 40, color: AppTheme.textMuted),
                          const SizedBox(height: 12),
                          Text(
                            "No residences found in this category.",
                            style: GoogleFonts.inter(color: AppTheme.textMuted, fontSize: 13),
                          ),
                        ],
                      ),
                    )
                  else
                    ..._filteredProjects.map((proj) => _buildProjectCard(proj)),
                ],
              ),
            ),
    );
  }

  Widget _buildFilterPill(String label, String filterKey) {
    final isSelected = _selectedFilter == filterKey;
    return InkWell(
      onTap: () => setState(() => _selectedFilter = filterKey),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryEmerald.withOpacity(0.18) : const Color(0x0DFFFFFF),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppTheme.primaryEmerald : const Color(0x1AFFFFFF),
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.spaceMono(
            fontSize: 10,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? const Color(0xFF34D399) : AppTheme.textMuted,
          ),
        ),
      ),
    );
  }

  Widget _buildMetricTile(String title, String value, IconData icon, Color accentColor) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0x1AFFFFFF), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: GoogleFonts.spaceMono(
                  fontSize: 9,
                  letterSpacing: 0.6,
                  color: AppTheme.textMuted,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Icon(icon, size: 14, color: accentColor),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.spaceMono(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProjectCard(ProjectModel proj) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: AppTheme.glassCardDecoration,
      child: InkWell(
        onTap: () => context.push('/project/${proj.id}'),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      proj.name,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryEmerald.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.primaryEmerald.withOpacity(0.35)),
                    ),
                    child: Text(
                      proj.designStyle,
                      style: GoogleFonts.spaceMono(
                        color: const Color(0xFF34D399),
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                "${proj.bhk} BHK • ${proj.propertyType.toUpperCase()} • ${proj.numFloors} Floors • ${proj.areaSqft} sq.ft",
                style: GoogleFonts.inter(color: AppTheme.textMuted, fontSize: 12),
              ),
              const Divider(color: Color(0x1AFFFFFF), height: 22),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "TURNKEY BUDGET",
                        style: GoogleFonts.spaceMono(
                          color: AppTheme.textMuted,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        CurrencyFormatter.formatIndianBudget(proj.totalBudget),
                        style: GoogleFonts.spaceMono(
                          color: const Color(0xFF34D399),
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      OutlinedButton.icon(
                        onPressed: () => context.push('/project/${proj.id}/budget'),
                        icon: const Icon(Icons.currency_rupee_rounded, size: 14, color: Colors.white70),
                        label: Text("Budget", style: GoogleFonts.spaceMono(fontSize: 11, color: Colors.white)),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          side: const BorderSide(color: Color(0x33FFFFFF)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        onPressed: () => context.push('/project/${proj.id}'),
                        icon: const Icon(Icons.arrow_forward_rounded, size: 14, color: Color(0xFF020617)),
                        label: Text(
                          "Studio",
                          style: GoogleFonts.spaceMono(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF020617),
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryEmerald,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
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
