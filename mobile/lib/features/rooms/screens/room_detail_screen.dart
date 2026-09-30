import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../dashboard/models/project_model.dart';

class RoomDetailScreen extends StatelessWidget {
  final String projectId;
  final String roomId;

  const RoomDetailScreen({
    Key? key,
    required this.projectId,
    required this.roomId,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Living Room Hub"),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_bag_outlined),
            onPressed: () => context.push('/project/$projectId/shopping'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // 3D Preview Hero Card
          Container(
            height: 200,
            decoration: BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.borderDark),
            ),
            child: Stack(
              children: [
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.view_in_ar, size: 56, color: AppTheme.primaryGold),
                      SizedBox(height: 8),
                      Text("Living Room (24.2 sqm)", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      SizedBox(height: 4),
                      Text("Scandinavian Minimalist", style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                    ],
                  ),
                ),
                Positioned(
                  bottom: 16,
                  right: 16,
                  child: ElevatedButton.icon(
                    onPressed: () => context.push('/project/$projectId/rooms/$roomId/playground'),
                    icon: const Icon(Icons.open_in_full_rounded, size: 16),
                    label: const Text("Launch 3D Studio"),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Room Specs Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Spatial Dimensions & Allocation", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildSpecItem("Width", "5.0 m"),
                      _buildSpecItem("Length", "4.5 m"),
                      _buildSpecItem("Floor Area", "22.5 sqm"),
                      _buildSpecItem("Budget Limit", CurrencyFormatter.formatIndianBudget(875000), AppTheme.primaryGold),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Actions
          ListTile(
            tileColor: AppTheme.surfaceCard,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: AppTheme.borderDark),
            ),
            leading: const Icon(Icons.explore_rounded, color: AppTheme.primaryGold),
            title: const Text("3D House Walkthrough", style: TextStyle(fontWeight: FontWeight.bold)),
            subtitle: const Text("Walk through from living room into other rooms", style: TextStyle(color: AppTheme.textMuted, fontSize: 11)),
            trailing: const Icon(Icons.arrow_forward_ios, size: 14),
            onTap: () => context.push('/project/$projectId/walkthrough'),
          ),
        ],
      ),
    );
  }

  Widget _buildSpecItem(String label, String value, [Color color = Colors.white]) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
        const SizedBox(height: 4),
        Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color)),
      ],
    );
  }
}
