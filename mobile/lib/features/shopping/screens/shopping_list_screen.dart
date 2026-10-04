import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../app/theme.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../models/shopping_item_model.dart';

class ShoppingListScreen extends StatefulWidget {
  final String projectId;

  const ShoppingListScreen({Key? key, required this.projectId}) : super(key: key);

  @override
  State<ShoppingListScreen> createState() => _ShoppingListScreenState();
}

class _ShoppingListScreenState extends State<ShoppingListScreen> {
  final ApiClient _api = ApiClient();
  List<ShoppingItemModel> _items = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadItems();
  }

  Future<void> _loadItems() async {
    setState(() => _isLoading = true);
    try {
      final res = await _api.get(ApiConstants.shoppingItems(widget.projectId));
      if (res is List) {
        _items = res.map((i) => ShoppingItemModel.fromJson(i)).toList();
      }
    } catch (_) {
      _items = [
        ShoppingItemModel(id: "s1", projectId: widget.projectId, name: "L-Shape Modular Sectional Sofa", quantity: 1, estimatedCost: 85000, status: "Delivered", vendor: "HomeVerse Curated"),
        ShoppingItemModel(id: "s2", projectId: widget.projectId, name: "Solid Walnut Coffee Table", quantity: 1, estimatedCost: 24000, status: "Delivered", vendor: "Urban Living"),
        ShoppingItemModel(id: "s3", projectId: widget.projectId, name: "Floating TV Console with Acoustic Slats", quantity: 1, estimatedCost: 48000, status: "Ordered", vendor: "Custom Millwork"),
        ShoppingItemModel(id: "s4", projectId: widget.projectId, name: "Dimmable Architectural Floor Lamp", quantity: 2, estimatedCost: 32000, status: "Delivered", vendor: "Lumiere Studio"),
      ];
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final total = _items.fold<double>(0.0, (sum, item) => sum + item.estimatedCost);

    return Scaffold(
      backgroundColor: AppTheme.backgroundDark,
      appBar: AppBar(
        title: Text(
          "Procurement & Shopping",
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryEmerald))
          : Column(
              children: [
                // Total Summary Glass Card
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  padding: const EdgeInsets.all(18),
                  decoration: AppTheme.glassCardDecoration,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "TOTAL PROCUREMENT ENVELOPE",
                            style: GoogleFonts.spaceMono(color: AppTheme.textMuted, fontSize: 10, letterSpacing: 0.6),
                          ),
                          const SizedBox(height: 5),
                          Text(
                            CurrencyFormatter.formatIndianBudget(total),
                            style: GoogleFonts.spaceMono(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF34D399)),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryEmerald.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppTheme.primaryEmerald.withOpacity(0.35)),
                        ),
                        child: Text(
                          "${_items.length} SKUs",
                          style: GoogleFonts.spaceMono(color: const Color(0xFF34D399), fontWeight: FontWeight.bold, fontSize: 11),
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    itemCount: _items.length,
                    itemBuilder: (ctx, i) {
                      final item = _items[i];
                      final isDelivered = item.status.toLowerCase() == "delivered";
                      final statusColor = isDelivered ? const Color(0xFF34D399) : const Color(0xFF38BDF8);

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: AppTheme.glassCardDecoration,
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                          leading: Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: AppTheme.primaryEmerald.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppTheme.primaryEmerald.withOpacity(0.2)),
                            ),
                            child: const Icon(Icons.shopping_bag_outlined, color: Color(0xFF34D399), size: 22),
                          ),
                          title: Text(
                            item.name,
                            style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
                          ),
                          subtitle: Text(
                            "${item.vendor ?? 'Curated'} • Qty: ${item.quantity}",
                            style: GoogleFonts.inter(color: AppTheme.textMuted, fontSize: 11),
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                CurrencyFormatter.formatIndianBudget(item.estimatedCost),
                                style: GoogleFonts.spaceMono(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
                              ),
                              const SizedBox(height: 3),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: statusColor.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: statusColor.withOpacity(0.3)),
                                ),
                                child: Text(
                                  item.status.toUpperCase(),
                                  style: GoogleFonts.spaceMono(fontSize: 9, color: statusColor, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
    );
  }
}
