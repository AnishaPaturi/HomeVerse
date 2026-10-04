import 'package:flutter/material.dart';
import '../../../app/theme.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../models/budget_model.dart';

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
        backgroundColor: AppTheme.surfaceDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: const [
            Icon(Icons.auto_awesome, color: AppTheme.primaryGold),
            SizedBox(width: 8),
            Text("What-If Simulation", style: TextStyle(fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text("Simulate scenario:", style: TextStyle(fontSize: 13, color: AppTheme.textMuted)),
            SizedBox(height: 12),
            Text("• Reduce budget by ₹1 Lakh (value engineers materials)", style: TextStyle(fontSize: 12)),
            SizedBox(height: 6),
            Text("• Upgrade to Italian Marble (+₹75,000)", style: TextStyle(fontSize: 12)),
            SizedBox(height: 6),
            Text("• Maximize storage with ceiling lofts (+₹42,500)", style: TextStyle(fontSize: 12)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Close", style: TextStyle(color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text("Simulated savings: ₹1,00,000 preserved via alternative laminate finishes."),
                  backgroundColor: AppTheme.accentGreen,
                ),
              );
            },
            child: const Text("Run -₹1L Simulation"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: AppTheme.primaryGold)),
      );
    }

    final total = _budget?.totalBudget ?? 2500000;
    final estimated = _budget?.estimatedAmount ?? 2140000;
    final remaining = _budget?.remainingAmount ?? (total - estimated);
    final pct = total > 0 ? (estimated / total * 100).toInt() : 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Project Budget"),
        actions: [
          IconButton(
            icon: const Icon(Icons.calculate_outlined, color: AppTheme.primaryGold),
            tooltip: "What-If Simulator",
            onPressed: _showWhatIfDialog,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        "Turnkey Budget Overview",
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryIndigo.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppTheme.primaryIndigo.withOpacity(0.3)),
                        ),
                        child: Text(
                          "${_budget?.flexibility} Flexibility",
                          style: const TextStyle(fontSize: 11, color: AppTheme.primaryIndigo, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildMetricCol("Total Budget", CurrencyFormatter.formatIndianBudget(total)),
                      _buildMetricCol("Estimated", CurrencyFormatter.formatIndianBudget(estimated), Colors.amber),
                      _buildMetricCol("Remaining", CurrencyFormatter.formatIndianBudget(remaining), AppTheme.accentGreen),
                    ],
                  ),
                  const SizedBox(height: 16),
                  LinearProgressIndicator(
                    value: pct / 100,
                    backgroundColor: AppTheme.surfaceDark,
                    color: pct > 90 ? AppTheme.accentRose : AppTheme.primaryGold,
                    minHeight: 8,
                  ),
                  const SizedBox(height: 6),
                  Text("$pct% Committed to current designs", style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Allocations
          const Text("Room & Trade Allocations", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          ...(_budget?.allocations ?? []).map((alloc) => Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  title: Text(alloc.roomName ?? alloc.category, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  subtitle: Text(alloc.category, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(CurrencyFormatter.formatIndianBudget(alloc.estimatedAmount), style: const TextStyle(fontWeight: FontWeight.bold)),
                      Text("Limit: ${CurrencyFormatter.formatIndianBudget(alloc.allocatedAmount)}", style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                    ],
                  ),
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildMetricCol(String label, String value, [Color color = Colors.white]) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
        const SizedBox(height: 4),
        Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
      ],
    );
  }
}
