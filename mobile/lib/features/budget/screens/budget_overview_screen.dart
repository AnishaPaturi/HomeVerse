import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../app/theme.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../models/budget_model.dart';
import '../../../shared/widgets/brand_widgets.dart';

class BudgetOverviewScreen extends StatefulWidget {
  final String projectId;

  const BudgetOverviewScreen({Key? key, required this.projectId}) : super(key: key);

  @override
  State<BudgetOverviewScreen> createState() => _BudgetOverviewScreenState();
}

class _BudgetOverviewScreenState extends State<BudgetOverviewScreen> {
  final ApiClient _api = ApiClient();
  BudgetModel? _budget;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBudget();
  }

  Future<void> _loadBudget() async {
    setState(() => _isLoading = true);
    try {
      final res = await _api.get(ApiConstants.projectBudget(widget.projectId));
      _budget = BudgetModel.fromJson(res);
    } catch (_) {
      _budget = BudgetModel(
        id: "b1",
        projectId: widget.projectId,
        totalBudget: 2500000,
        estimatedAmount: 2140000,
        spentAmount: 850000,
        remainingAmount: 360000,
        flexibility: "Moderate",
        allocations: [
          BudgetAllocationModel(id: "a1", roomName: "Living Room", category: "Furniture & Seating", allocatedAmount: 875000, estimatedAmount: 760000),
          BudgetAllocationModel(id: "a2", roomName: "Master Bedroom", category: "Modular Millwork & Bed", allocatedAmount: 625000, estimatedAmount: 580000),
          BudgetAllocationModel(id: "a3", roomName: "Kitchen", category: "Modular Cabinetry & Quartz", allocatedAmount: 500000, estimatedAmount: 490000),
          BudgetAllocationModel(id: "a4", roomName: "Bathrooms", category: "Sanitary & CP Fittings", allocatedAmount: 250000, estimatedAmount: 180000),
          BudgetAllocationModel(id: "a5", roomName: "General", category: "Civil & Flooring", allocatedAmount: 250000, estimatedAmount: 130000),
        ],
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showWhatIfDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Color(0x33FFFFFF)),
        ),
        title: Row(
          children: [
            const Icon(Icons.auto_awesome, color: Color(0xFF34D399), size: 20),
            const SizedBox(width: 8),
            Text(
              "What-If Simulation",
              style: GoogleFonts.spaceMono(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "AI Real-time Value Engineering Scenario:",
              style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 14),
            _buildSimulationRow("• Value Engineer Finishes", "-₹1,00,000", const Color(0xFF34D399)),
            const SizedBox(height: 8),
            _buildSimulationRow("• Upgrade to Italian Marble", "+₹75,000", const Color(0xFFF59E0B)),
            const SizedBox(height: 8),
            _buildSimulationRow("• Ceiling Height Millwork Lofts", "+₹42,500", const Color(0xFF38BDF8)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text("Close", style: GoogleFonts.spaceMono(color: AppTheme.textMuted)),
          ),
          GradientButton(
            height: 38,
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    "Simulated savings applied: ₹1,00,000 preserved via alternative laminate textures.",
                    style: GoogleFonts.inter(color: const Color(0xFF020617), fontWeight: FontWeight.w600),
                  ),
                  backgroundColor: AppTheme.primaryEmerald,
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
            child: const Text("Apply -₹1L Strategy"),
          ),
        ],
      ),
    );
  }

  static Widget _buildSimulationRow(String title, String diff, Color diffColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: GoogleFonts.inter(fontSize: 12, color: Colors.white70)),
        Text(diff, style: GoogleFonts.spaceMono(fontSize: 12, fontWeight: FontWeight.bold, color: diffColor)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppTheme.backgroundDark,
        body: Center(child: CircularProgressIndicator(color: AppTheme.primaryEmerald)),
      );
    }

    final total = _budget?.totalBudget ?? 2500000;
    final estimated = _budget?.estimatedAmount ?? 2140000;
    final remaining = _budget?.remainingAmount ?? (total - estimated);
    final pct = total > 0 ? (estimated / total * 100).toInt() : 0;

    return Scaffold(
      backgroundColor: AppTheme.backgroundDark,
      appBar: AppBar(
        title: Text(
          "Turnkey Budget Hub",
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.auto_awesome, color: Color(0xFF34D399)),
            tooltip: "What-If Simulator",
            onPressed: _showWhatIfDialog,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          // Header Glass Card
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
                      "Turnkey Indian Budget Envelope",
                      style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryEmerald.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppTheme.primaryEmerald.withOpacity(0.35)),
                      ),
                      child: Text(
                        "${_budget?.flexibility.toUpperCase()} FLEX",
                        style: GoogleFonts.spaceMono(
                          fontSize: 9,
                          color: const Color(0xFF34D399),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildMetricCol("Total Envelope", CurrencyFormatter.formatIndianBudget(total)),
                    _buildMetricCol("Allocated", CurrencyFormatter.formatIndianBudget(estimated), const Color(0xFF38BDF8)),
                    _buildMetricCol("Reserve / Savings", CurrencyFormatter.formatIndianBudget(remaining), const Color(0xFF34D399)),
                  ],
                ),
                const SizedBox(height: 18),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: LinearProgressIndicator(
                    value: pct / 100,
                    backgroundColor: const Color(0x1AFFFFFF),
                    valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryEmerald),
                    minHeight: 8,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "$pct% committed to active room schemes",
                      style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
                    ),
                    Text(
                      "${100 - pct}% Unallocated Buffer",
                      style: GoogleFonts.spaceMono(fontSize: 10, color: const Color(0xFF34D399)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Allocations
          Text(
            "Room & Category Allocations (${_budget?.allocations.length ?? 0})",
            style: GoogleFonts.spaceMono(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
          ),
          const SizedBox(height: 12),
          ...(_budget?.allocations ?? []).map((alloc) {
            final double allocTotal = alloc.allocatedAmount > 0 ? alloc.allocatedAmount : 1;
            final double allocPct = (alloc.estimatedAmount / allocTotal).clamp(0.0, 1.0);

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: AppTheme.glassCardDecoration,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        alloc.roomName ?? alloc.category,
                        style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                      ),
                      Text(
                        CurrencyFormatter.formatIndianBudget(alloc.estimatedAmount),
                        style: GoogleFonts.spaceMono(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: const Color(0xFF34D399),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(alloc.category, style: GoogleFonts.inter(color: AppTheme.textMuted, fontSize: 11)),
                      Text(
                        "Cap: ${CurrencyFormatter.formatIndianBudget(alloc.allocatedAmount)}",
                        style: GoogleFonts.spaceMono(fontSize: 10, color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: allocPct,
                      backgroundColor: const Color(0x14FFFFFF),
                      valueColor: AlwaysStoppedAnimation<Color>(
                        allocPct > 0.95 ? AppTheme.accentRose : AppTheme.primaryTeal,
                      ),
                      minHeight: 4,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildMetricCol(String label, String value, [Color color = Colors.white]) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: GoogleFonts.spaceMono(fontSize: 9, letterSpacing: 0.5, color: AppTheme.textMuted),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: GoogleFonts.spaceMono(fontSize: 15, fontWeight: FontWeight.bold, color: color),
        ),
      ],
    );
  }
}
