import 'package:intl/intl.dart';

class CurrencyFormatter {
  static String formatIndianBudget(num? amount) {
    if (amount == null || amount == 0) return "₹0";
    final val = amount.toDouble();
    if (val >= 10000000) {
      final cr = val / 10000000;
      return "₹${cr.toStringAsFixed(cr % 1 == 0 ? 0 : 2)} Cr";
    }
    if (val >= 100000) {
      final l = val / 100000;
      return "₹${l.toStringAsFixed(l % 1 == 0 ? 0 : 1)} Lakhs";
    }
    final formatter = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 0,
    );
    return formatter.format(val);
  }

  static String formatStandardCurrency(num? amount, [String currency = "INR"]) {
    if (amount == null) return "₹0";
    final formatter = NumberFormat.currency(
      locale: currency == "INR" ? 'en_IN' : 'en_US',
      symbol: currency == "INR" ? '₹' : '\$',
      decimalDigits: 0,
    );
    return formatter.format(amount);
  }
}
