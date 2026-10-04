import 'package:flutter/material.dart';
import '../../../app/theme.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../shared/models/scene_model.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../ai/widgets/copilot_chat_drawer.dart';

class RoomPlaygroundScreen extends StatefulWidget {
  final String projectId;
  final String roomId;

  const RoomPlaygroundScreen({
    Key? key,
    required this.projectId,
    required this.roomId,
  }) : super(key: key);

  @override
  State<RoomPlaygroundScreen> createState() => _RoomPlaygroundScreenState();
}

class _RoomPlaygroundScreenState extends State<RoomPlaygroundScreen> {
  final ApiClient _api = ApiClient();
  RoomSceneData? _scene;
  SceneObject? _selectedObject;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadScene();
  }

  Future<void> _loadScene() async {
    setState(() => _isLoading = true);
    try {
      final res = await _api.get(ApiConstants.roomScene(widget.roomId));
      _scene = RoomSceneData.fromJson(res);
    } catch (_) {
      // Fallback canonical scene graph
      _scene = RoomSceneData(
        roomId: widget.roomId,
        roomName: "Living Room",
        width: 5.0,
        depth: 4.5,
        height: 3.0,
        style: "Modern Scandinavian",
        objects: [
          SceneObject(
            id: "obj-sofa",
            model: "sofa.glb",
            objectType: "sofa",
            position: [0.0, 0.0, 1.2],
            rotation: [0.0, 0.0, 0.0],
            scale: [1.0, 1.0, 1.0],
            material: "Oatmeal Boucle",
            cost: 85000,
          ),
          SceneObject(
            id: "obj-table",
            model: "table.glb",
            objectType: "coffee_table",
            position: [0.0, 0.0, 0.0],
            rotation: [0.0, 0.0, 0.0],
            scale: [1.0, 1.0, 1.0],
            material: "Solid Walnut",
            cost: 24000,
          ),
          SceneObject(
            id: "obj-lamp",
            model: "lamp.glb",
            objectType: "floor_lamp",
            position: [-1.8, 0.0, 1.5],
            rotation: [0.0, 45.0, 0.0],
            scale: [1.0, 1.0, 1.0],
            material: "Brushed Brass",
            cost: 16000,
          ),
        ],
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _openAICopilot() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => CopilotChatDrawer(
        roomId: widget.roomId,
        projectId: widget.projectId,
        onSceneUpdate: (command) {
          // Re-fetch scene or modify locally
          _loadScene();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_scene?.roomName ?? "3D Studio"),
        actions: [
          IconButton(
            icon: const Icon(Icons.psychology_rounded, color: AppTheme.primaryGold),
            tooltip: "AI Spatial Copilot",
            onPressed: _openAICopilot,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGold))
          : Column(
              children: [
                // 3D Spatial Canvas Simulation Container
                Expanded(
                  flex: 3,
                  child: Container(
                    margin: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppTheme.borderDark),
                    ),
                    child: Stack(
                      children: [
                        // Grid / Floor visual
                        Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.view_in_ar_rounded, size: 64, color: AppTheme.primaryGold.withOpacity(0.4)),
                              const SizedBox(height: 12),
                              Text(
                                "3D Scene: ${_scene?.style}",
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                "${_scene?.width}m × ${_scene?.depth}m • ${_scene?.objects.length} Objects",
                                style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        // Floating Copilot Button
                        Positioned(
                          bottom: 16,
                          right: 16,
                          child: FloatingActionButton.extended(
                            onPressed: _openAICopilot,
                            backgroundColor: AppTheme.primaryIndigo,
                            icon: const Icon(Icons.auto_awesome, color: Colors.white, size: 18),
                            label: const Text("Ask AI Copilot", style: TextStyle(color: Colors.white, fontSize: 12)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                // Scene Object Inspector
                Expanded(
                  flex: 2,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(
                      color: AppTheme.surfaceDark,
                      border: Border(top: BorderSide(color: AppTheme.borderDark)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "Scene Elements & Materials",
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        const SizedBox(height: 10),
                        Expanded(
                          child: ListView.builder(
                            itemCount: _scene?.objects.length ?? 0,
                            itemBuilder: (ctx, i) {
                              final obj = _scene!.objects[i];
                              final isSelected = _selectedObject?.id == obj.id;
                              return Card(
                                color: isSelected ? AppTheme.primaryGold.withOpacity(0.15) : AppTheme.surfaceCard,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  side: BorderSide(
                                    color: isSelected ? AppTheme.primaryGold : AppTheme.borderDark,
                                  ),
                                ),
                                child: ListTile(
                                  leading: const Icon(Icons.chair_outlined, color: AppTheme.primaryGold),
                                  title: Text(obj.objectType.toUpperCase(), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                                  subtitle: Text("Material: ${obj.material}", style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                                  trailing: Text(
                                    CurrencyFormatter.formatIndianBudget(obj.cost),
                                    style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                                  ),
                                  onTap: () => setState(() => _selectedObject = obj),
                                ),
                              );
                            },
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
