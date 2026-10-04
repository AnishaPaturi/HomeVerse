import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';

class HomeCreationWizardScreen extends StatefulWidget {
  const HomeCreationWizardScreen({Key? key}) : super(key: key);

  @override
  State<HomeCreationWizardScreen> createState() => _HomeCreationWizardScreenState();
}

class _HomeCreationWizardScreenState extends State<HomeCreationWizardScreen> {
  final ApiClient _api = ApiClient();
  int _currentStep = 0;
  bool _isCreating = false;

  // Wizard state
  String _homeType = "apartment";
  int _floorCount = 1;
  int _bhk = 3;
  double _budget = 2500000;
  String _flexibility = "Moderate";
  String _designStyle = "Modern";
  String _projectName = "My Dream Home";

  final List<String> _homeTypes = ["Apartment", "Villa", "Independent House", "Penthouse"];
  final List<String> _styles = ["Modern", "Scandinavian", "Luxury", "Minimalist", "Japandi", "Industrial"];
  final List<String> _flexibilities = ["Strict", "Moderate", "Flexible"];

  void _nextStep() {
    if (_currentStep < 8) {
      setState(() => _currentStep++);
    } else {
      _submitWizard();
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    }
  }

  Future<void> _submitWizard() async {
    setState(() => _isCreating = true);
    try {
      final res = await _api.post(
        ApiConstants.projects,
        data: {
          'name': _projectName,
          'property_type': _homeType.toLowerCase(),
          'bhk': _bhk,
          'total_budget': _budget,
          'budget_flexibility': _flexibility,
          'design_style': _designStyle,
          'num_floors': _floorCount,
        },
      );
      final projectId = res['id'] ?? 'p1';
      if (mounted) {
        context.go('/project/$projectId');
      }
    } catch (_) {
      if (mounted) {
        context.go('/project/p1');
      }
    } finally {
      if (mounted) setState(() => _isCreating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Home Setup (Step ${_currentStep + 1} of 9)"),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Progress Bar
            LinearProgressIndicator(
              value: (_currentStep + 1) / 9,
              backgroundColor: AppTheme.surfaceDark,
              color: AppTheme.primaryGold,
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: _buildCurrentStepContent(),
              ),
            ),
            // Bottom Navigation Controls
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: const BoxDecoration(
                color: AppTheme.surfaceDark,
                border: Border(top: BorderSide(color: AppTheme.borderDark)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (_currentStep > 0)
                    OutlinedButton(
                      onPressed: _prevStep,
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppTheme.borderDark),
                      ),
                      child: const Text("Back", style: TextStyle(color: Colors.white)),
                    )
                  else
                    const SizedBox(width: 80),
                  ElevatedButton(
                    onPressed: _isCreating ? null : _nextStep,
                    child: _isCreating
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                          )
                        : Text(_currentStep == 8 ? "Generate House" : "Next"),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrentStepContent() {
    switch (_currentStep) {
      case 0:
        return _buildStep1HomeType();
      case 1:
        return _buildStep2Floors();
      case 2:
        return _buildStep3Rooms();
      case 3:
        return _buildStep4Budget();
      case 4:
        return _buildStep5FloorPlan();
      case 5:
        return _buildStep6AIDetection();
      case 6:
        return _buildStep7Dimensions();
      case 7:
        return _buildStep8RoomSelection();
      case 8:
        return _buildStep9DesignStyle();
      default:
        return const SizedBox();
    }
  }

  Widget _buildStep1HomeType() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("1. Select House Type", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text("Choose the architectural configuration of your residence.", style: TextStyle(color: AppTheme.textMuted)),
        const SizedBox(height: 20),
        ..._homeTypes.map((type) {
          final isSelected = _homeType.toLowerCase() == type.toLowerCase();
          return Card(
            color: isSelected ? AppTheme.primaryGold.withOpacity(0.15) : AppTheme.surfaceCard,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(
                color: isSelected ? AppTheme.primaryGold : AppTheme.borderDark,
                width: isSelected ? 1.5 : 1,
              ),
            ),
            child: ListTile(
              title: Text(type, style: const TextStyle(fontWeight: FontWeight.bold)),
              trailing: isSelected ? const Icon(Icons.check_circle, color: AppTheme.primaryGold) : null,
              onTap: () => setState(() => _homeType = type.toLowerCase()),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildStep2Floors() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("2. How Many Floors?", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text("HomeVerse handles multi-level homes with cross-floor navigation.", style: TextStyle(color: AppTheme.textMuted)),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [1, 2, 3, 4].map((count) {
            final isSelected = _floorCount == count;
            return InkWell(
              onTap: () => setState(() => _floorCount = count),
              borderRadius: BorderRadius.circular(16),
              child: Container(
                width: 70,
                height: 80,
                decoration: BoxDecoration(
                  color: isSelected ? AppTheme.primaryGold : AppTheme.surfaceCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isSelected ? AppTheme.primaryGold : AppTheme.borderDark),
                ),
                child: Center(
                  child: Text(
                    "$count",
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? Colors.black : Colors.white,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildStep3Rooms() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("3. Rooms & Configuration", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text("Select configuration (BHK).", style: TextStyle(color: AppTheme.textMuted)),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [1, 2, 3, 4, 5].map((b) {
            final isSelected = _bhk == b;
            return InkWell(
              onTap: () => setState(() => _bhk = b),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: isSelected ? AppTheme.primaryGold : AppTheme.surfaceCard,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  "$b BHK",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: isSelected ? Colors.black : Colors.white,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildStep4Budget() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("4. Turnkey Budget & Posture", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text("This budget guides all AI recommendations, materials, and furniture selections.", style: TextStyle(color: AppTheme.textMuted)),
        const SizedBox(height: 24),
        Center(
          child: Text(
            CurrencyFormatter.formatIndianBudget(_budget),
            style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppTheme.primaryGold),
          ),
        ),
        Slider(
          value: _budget,
          min: 500000,
          max: 15000000,
          divisions: 29,
          activeColor: AppTheme.primaryGold,
          onChanged: (v) => setState(() => _budget = v),
        ),
        const SizedBox(height: 16),
        const Text("Budget Flexibility Posture:", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Row(
          children: _flexibilities.map((f) {
            final isSelected = _flexibility == f;
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: ChoiceChip(
                  label: Text(f),
                  selected: isSelected,
                  selectedColor: AppTheme.primaryGold,
                  labelStyle: TextStyle(color: isSelected ? Colors.black : Colors.white),
                  onSelected: (_) => setState(() => _flexibility = f),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildStep5FloorPlan() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("5. Floor Plan Blueprint", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text("Upload 2D architectural blueprint (PNG, JPG, or PDF).", style: TextStyle(color: AppTheme.textMuted)),
        const SizedBox(height: 24),
        Container(
          height: 180,
          width: double.infinity,
          decoration: BoxDecoration(
            color: AppTheme.surfaceDark,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.borderDark, style: BorderStyle.solid),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              Icon(Icons.cloud_upload_outlined, size: 48, color: AppTheme.primaryGold),
              SizedBox(height: 12),
              Text("Tap to upload or take a photo", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              SizedBox(height: 4),
              Text("AI will automatically extract rooms & walls", style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStep6AIDetection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("6. AI Spatial Detection", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text("YOLO & OpenCV spatial parser identified room boundaries.", style: TextStyle(color: AppTheme.textMuted)),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.accentGreen.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.accentGreen.withOpacity(0.3)),
          ),
          child: Row(
            children: const [
              Icon(Icons.check_circle, color: AppTheme.accentGreen),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  "AI identified 4 structural zones, 3 doors, and 4 exterior windows.",
                  style: TextStyle(color: Colors.white, fontSize: 13),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStep7Dimensions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("7. Dimension Confirmation", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text("Verify metric bounding dimensions.", style: TextStyle(color: AppTheme.textMuted)),
        const SizedBox(height: 20),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: const [
                ListTile(
                  title: Text("Living Room"),
                  subtitle: Text("18.5 ft × 14.2 ft (24.2 sqm)"),
                  trailing: Icon(Icons.edit_outlined, size: 18),
                ),
                Divider(),
                ListTile(
                  title: Text("Master Bedroom"),
                  subtitle: Text("14.0 ft × 12.0 ft (15.6 sqm)"),
                  trailing: Icon(Icons.edit_outlined, size: 18),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStep8RoomSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("8. Select Priority Room", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text("Choose the room to begin interactive 3D design and AI generation.", style: TextStyle(color: AppTheme.textMuted)),
        const SizedBox(height: 20),
        Card(
          color: AppTheme.primaryGold.withOpacity(0.15),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: AppTheme.primaryGold),
          ),
          child: const ListTile(
            title: Text("Living Room", style: TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text("Estimated allocation: ₹8,75,000"),
            trailing: Icon(Icons.check_circle, color: AppTheme.primaryGold),
          ),
        ),
      ],
    );
  }

  Widget _buildStep9DesignStyle() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("9. Architectural Design Style", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text("Choose an aesthetic theme to drive AI furniture & material generation.", style: TextStyle(color: AppTheme.textMuted)),
        const SizedBox(height: 20),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: _styles.map((s) {
            final isSelected = _designStyle == s;
            return ChoiceChip(
              label: Text(s),
              selected: isSelected,
              selectedColor: AppTheme.primaryGold,
              labelStyle: TextStyle(
                color: isSelected ? Colors.black : Colors.white,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
              onSelected: (_) => setState(() => _designStyle = s),
            );
          }).toList(),
        ),
      ],
    );
  }
}
