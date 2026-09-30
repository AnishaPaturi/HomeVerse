import 'package:flutter/material.dart';
import '../../../app/theme.dart';

class WalkthroughScreen extends StatefulWidget {
  final String projectId;

  const WalkthroughScreen({Key? key, required this.projectId}) : super(key: key);

  @override
  State<WalkthroughScreen> createState() => _WalkthroughScreenState();
}

class _WalkthroughScreenState extends State<WalkthroughScreen> {
  int _selectedFloor = 1;
  String _activeRoom = "Living Room";

  final List<String> _rooms = ["Living Room", "Dining Area", "Modular Kitchen", "Master Bedroom", "Balcony Lounge"];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("3D House Walkthrough"),
      ),
      body: Column(
        children: [
          // Floor Selector Tabs
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: AppTheme.surfaceDark,
            child: Row(
              children: [1, 2].map((floor) {
                final isSelected = _selectedFloor == floor;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text("Floor $floor"),
                    selected: isSelected,
                    selectedColor: AppTheme.primaryGold,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.black : Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                    onSelected: (_) => setState(() => _selectedFloor = floor),
                  ),
                );
              }).toList(),
            ),
          ),
          // 3D Walkthrough Viewport Simulation
          Expanded(
            child: Container(
              margin: const EdgeInsets.all(12),
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
                      children: [
                        const Icon(Icons.explore_rounded, size: 72, color: AppTheme.primaryGold),
                        const SizedBox(height: 16),
                        Text(
                          "Floor $_selectedFloor: $_activeRoom",
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          "First-person panoramic perspective",
                          style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  // Room Quick Navigation Overlay
                  Positioned(
                    bottom: 16,
                    left: 16,
                    right: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceDark.withOpacity(0.9),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.borderDark),
                      ),
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: _rooms.map((room) {
                            final isActive = _activeRoom == room;
                            return Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: TextButton(
                                onPressed: () => setState(() => _activeRoom = room),
                                style: TextButton.styleFrom(
                                  backgroundColor: isActive ? AppTheme.primaryGold : Colors.transparent,
                                  foregroundColor: isActive ? Colors.black : Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                child: Text(room, style: const TextStyle(fontSize: 12)),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
