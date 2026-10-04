import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
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
      backgroundColor: AppTheme.backgroundDark,
      appBar: AppBar(
        title: Text(
          "3D House Walkthrough",
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ),
      body: Column(
        children: [
          // Floor Selector Tabs (Glassmorphism matching Web)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: const BoxDecoration(
              color: AppTheme.surfaceDark,
              border: Border(bottom: BorderSide(color: Color(0x1AFFFFFF))),
            ),
            child: Row(
              children: [1, 2].map((floor) {
                final isSelected = _selectedFloor == floor;
                return Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: InkWell(
                    onTap: () => setState(() => _selectedFloor = floor),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: isSelected ? AppTheme.primaryEmerald.withOpacity(0.18) : const Color(0x0DFFFFFF),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSelected ? AppTheme.primaryEmerald : const Color(0x1AFFFFFF),
                        ),
                      ),
                      child: Text(
                        "FLOOR $floor",
                        style: GoogleFonts.spaceMono(
                          fontSize: 11,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                          color: isSelected ? const Color(0xFF34D399) : AppTheme.textMuted,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          // 3D Walkthrough Viewport Simulation
          Expanded(
            child: Container(
              margin: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF020408),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0x22FFFFFF)),
              ),
              child: Stack(
                children: [
                  // Center HUD
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 84,
                          height: 84,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppTheme.primaryEmerald.withOpacity(0.1),
                            border: Border.all(color: AppTheme.primaryEmerald.withOpacity(0.3)),
                          ),
                          child: const Icon(Icons.explore_rounded, size: 48, color: Color(0xFF34D399)),
                        ),
                        const SizedBox(height: 18),
                        Text(
                          "Floor $_selectedFloor: $_activeRoom",
                          style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          "360° First-Person Panoramic Digital Twin",
                          style: GoogleFonts.inter(color: AppTheme.textMuted, fontSize: 12),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0x14FFFFFF),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0x22FFFFFF)),
                          ),
                          child: Text(
                            "CAMERA: LOCKED COORDINATE SYNC",
                            style: GoogleFonts.spaceMono(fontSize: 9, color: const Color(0xFF34D399), letterSpacing: 0.5),
                          ),
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
                        color: AppTheme.surfaceCard.withOpacity(0.92),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0x22FFFFFF)),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.4), blurRadius: 16, offset: const Offset(0, 4)),
                        ],
                      ),
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: _rooms.map((room) {
                            final isActive = _activeRoom == room;
                            return Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: InkWell(
                                onTap: () => setState(() => _activeRoom = room),
                                borderRadius: BorderRadius.circular(10),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: isActive ? AppTheme.primaryEmerald : Colors.transparent,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    room,
                                    style: GoogleFonts.spaceMono(
                                      fontSize: 11,
                                      fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                                      color: isActive ? const Color(0xFF020617) : Colors.white70,
                                    ),
                                  ),
                                ),
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
