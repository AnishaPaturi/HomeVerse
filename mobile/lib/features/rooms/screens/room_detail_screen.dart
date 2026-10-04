import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../shared/widgets/brand_widgets.dart';

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
      backgroundColor: AppTheme.backgroundDark,
      appBar: AppBar(
        title: Text(
          "Living Room Hub",
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_bag_outlined, color: AppTheme.primaryTeal),
            onPressed: () => context.push('/project/$projectId/shopping'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          // 3D Preview Hero Glass Card
          Container(
            height: 210,
            decoration: BoxDecoration(
              color: const Color(0xFF03070E),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0x22FFFFFF)),
            ),
            child: Stack(
              children: [
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 68,
                        height: 68,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppTheme.primaryEmerald.withOpacity(0.12),
                          border: Border.all(color: AppTheme.primaryEmerald.withOpacity(0.3)),
                        ),
                        child: const Icon(Icons.view_in_ar_rounded, size: 36, color: Color(0xFF34D399)),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        "Living Room (22.5 sqm)",
                        style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Scandinavian Minimalist • Multi-Floor Digital Twin",
                        style: GoogleFonts.inter(color: AppTheme.textMuted, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                Positioned(
                  bottom: 14,
                  right: 14,
                  child: GradientButton(
                    onPressed: () => context.push('/project/$projectId/rooms/$roomId/playground'),
                    icon: Icons.open_in_full_rounded,
                    height: 38,
                    child: const Text("Launch 3D Studio"),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // Room Specs Glass Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: AppTheme.glassCardDecoration,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Spatial Dimensions & Indian Budget Allocation",
                  style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                ),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildSpecItem("Width", "5.0 m"),
                    _buildSpecItem("Length", "4.5 m"),
                    _buildSpecItem("Area", "22.5 sqm"),
                    _buildSpecItem("Budget Cap", CurrencyFormatter.formatIndianBudget(875000), const Color(0xFF34D399)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // Quick Navigation Action Tile
          InkWell(
            onTap: () => context.push('/project/$projectId/walkthrough'),
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: AppTheme.glassCardDecoration,
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryEmerald.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.explore_rounded, color: Color(0xFF34D399), size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "3D Panoramic Walkthrough",
                          style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          "Walk through seamlessly into adjoining rooms",
                          style: GoogleFonts.inter(color: AppTheme.textMuted, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppTheme.textMuted),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSpecItem(String label, String value, [Color color = Colors.white]) {
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
          style: GoogleFonts.spaceMono(fontSize: 13, fontWeight: FontWeight.bold, color: color),
        ),
      ],
    );
  }
}
