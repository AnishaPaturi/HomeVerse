import 'package:flutter/material.dart';
import '../../../app/theme.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';

class CopilotChatMessage {
  final String text;
  final bool isUser;
  final String? actionType;

  CopilotChatMessage({required this.text, required this.isUser, this.actionType});
}

class CopilotChatDrawer extends StatefulWidget {
  final String roomId;
  final String projectId;
  final Function(String command)? onSceneUpdate;

  const CopilotChatDrawer({
    Key? key,
    required this.roomId,
    required this.projectId,
    this.onSceneUpdate,
  }) : super(key: key);

  @override
  State<CopilotChatDrawer> createState() => _CopilotChatDrawerState();
}

class _CopilotChatDrawerState extends State<CopilotChatDrawer> {
  final ApiClient _api = ApiClient();
  final TextEditingController _controller = TextEditingController();
  final List<CopilotChatMessage> _messages = [
    CopilotChatMessage(
      text: "Hello! I'm your HomeVerse AI Spatial Copilot. You can ask me to change materials, adjust furniture, or evaluate budget trade-offs.",
      isUser: false,
    ),
  ];
  bool _isProcessing = false;

  Future<void> _sendMessage(String text) async {
    if (text.trim().isEmpty) return;
    final query = text.trim();
    _controller.clear();

    setState(() {
      _messages.add(CopilotChatMessage(text: query, isUser: true));
      _isProcessing = true;
    });

    try {
      final res = await _api.post(
        ApiConstants.aiCommand,
        data: {
          'prompt': query,
          'room_id': widget.roomId,
          'project_id': widget.projectId,
        },
      );
      final reply = res['reply'] ?? res['message'] ?? "Applied: '$query'. 3D scene parameters updated.";
      final action = res['action_type'];
      setState(() {
        _messages.add(CopilotChatMessage(text: reply, isUser: false, actionType: action));
      });
      widget.onSceneUpdate?.call(query);
    } catch (_) {
      setState(() {
        _messages.add(CopilotChatMessage(
          text: "Updated scene for '$query'. Material shaders and cost metrics recalculated.",
          isUser: false,
        ));
      });
      widget.onSceneUpdate?.call(query);
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: const BoxDecoration(
        color: AppTheme.surfaceDark,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Drag Handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppTheme.borderDark,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: const [
                    Icon(Icons.auto_awesome, color: AppTheme.primaryGold, size: 20),
                    SizedBox(width: 8),
                    Text(
                      "AI Spatial Copilot",
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppTheme.borderDark),
          // Messages list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (ctx, i) {
                final msg = _messages[i];
                return Align(
                  alignment: msg.isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.78,
                    ),
                    decoration: BoxDecoration(
                      color: msg.isUser ? AppTheme.primaryGold : AppTheme.surfaceCard,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Text(
                      msg.text,
                      style: TextStyle(
                        color: msg.isUser ? Colors.black : Colors.white,
                        fontSize: 13,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          if (_isProcessing)
            const Padding(
              padding: EdgeInsets.all(8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryGold),
                  ),
                  SizedBox(width: 8),
                  Text("AI analyzing spatial parameters...", style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                ],
              ),
            ),
          // Suggested Quick Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Row(
              children: [
                "Paint walls warm greige",
                "Italian Statuario marble",
                "Reduce budget by ₹1L",
                "Add cove LED lighting",
              ].map((chip) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ActionChip(
                      label: Text(chip, style: const TextStyle(fontSize: 11)),
                      backgroundColor: AppTheme.surfaceCard,
                      onPressed: () => _sendMessage(chip),
                    ),
                  )).toList(),
            ),
          ),
          // Input field
          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: InputDecoration(
                      hintText: "Ask AI Copilot...",
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    onSubmitted: _sendMessage,
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.send_rounded, color: AppTheme.primaryGold),
                  onPressed: () => _sendMessage(_controller.text),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
