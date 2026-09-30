import 'package:flutter/material.dart';
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
      appBar: AppBar(
        title: const Text("Procurement & Shopping"),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGold))
          : Column(
              children: [
                // Total Summary Card
                Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceCard,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.borderDark),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text("Total Procurement Cost", style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                          const SizedBox(height: 4),
                          Text(
                            CurrencyFormatter.formatIndianBudget(total),
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryGold.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          "${_items.length} Items",
                          style: const TextStyle(color: AppTheme.primaryGold, fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _items.length,
                    itemBuilder: (ctx, i) {
                      final item = _items[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          leading: Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceDark,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.shopping_bag_outlined, color: AppTheme.primaryGold),
                          ),
                          title: Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          subtitle: Text(
                            "${item.vendor ?? 'Curated'} • Qty: ${item.quantity}",
                            style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                CurrencyFormatter.formatIndianBudget(item.estimatedCost),
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                              const SizedBox(height: 2),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppTheme.accentGreen.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  item.status,
                                  style: const TextStyle(fontSize: 10, color: AppTheme.accentGreen, fontWeight: FontWeight.bold),
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
