import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Web-Identical Brand Colors
  static const Color primaryEmerald = Color(0xFF10B981); // Emerald-500
  static const Color primaryTeal = Color(0xFF14B8A6);    // Teal-500
  static const Color primaryLime = Color(0xFFA3E635);    // Lime-400 (#a3e635)
  static const Color primaryIndigo = Color(0xFF6366F1);  // Indigo-500
  static const Color primaryGold = Color(0xFF10B981);    // Mapped to Emerald for web parity
  
  static const Color backgroundDark = Color(0xFF06090E); // Deep Obsidian from Web (#06090e)
  static const Color surfaceDark = Color(0xFF0B111A);    // Dark header/panel surface
  static const Color surfaceCard = Color(0xFF111A29);    // Glass Card Surface (#111a29)
  static const Color surfaceGlass = Color(0x0FFFFFFF);   // 6% white glass
  static const Color borderDark = Color(0x1FFFFFFF);     // 12% white border (border-white/10)
  static const Color textMuted = Color(0xFF94A3B8);      // Slate-400
  static const Color textLight = Color(0xFFF8FAFC);      // Slate-50
  static const Color accentGreen = Color(0xFF10B981);    // Emerald
  static const Color accentRose = Color(0xFFF43F5E);     // Rose-500

  // Web Signature Gradients
  static const LinearGradient brandGradient = LinearGradient(
    colors: [primaryEmerald, primaryTeal, primaryLime],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient logoGradient = LinearGradient(
    colors: [Color(0xFF059669), Color(0xFF2DD4BF)],
    begin: Alignment.bottomLeft,
    end: Alignment.topRight,
  );

  static const LinearGradient cardGlassGradient = LinearGradient(
    colors: [Color(0x14FFFFFF), Color(0x08FFFFFF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static BoxDecoration get glassDecoration => BoxDecoration(
    color: const Color(0x0DFFFFFF),
    borderRadius: BorderRadius.circular(16),
    border: Border.all(color: const Color(0x1AFFFFFF), width: 1),
  );

  static BoxDecoration get glassCardDecoration => BoxDecoration(
    color: surfaceCard,
    borderRadius: BorderRadius.circular(16),
    border: Border.all(color: const Color(0x24FFFFFF), width: 1),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withOpacity(0.35),
        blurRadius: 20,
        offset: const Offset(0, 8),
      ),
    ],
  );

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: backgroundDark,
      colorScheme: const ColorScheme.dark(
        primary: primaryEmerald,
        secondary: primaryTeal,
        surface: surfaceDark,
        background: backgroundDark,
        error: accentRose,
      ),
      textTheme: GoogleFonts.interTextTheme(
        ThemeData.dark().textTheme,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: backgroundDark,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        centerTitle: false,
        iconTheme: IconThemeData(color: Colors.white),
        titleTextStyle: TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
      cardTheme: CardThemeData(
        color: surfaceCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: borderDark, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0x0DFFFFFF),
        hintStyle: const TextStyle(color: textMuted, fontSize: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: borderDark),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: borderDark),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: primaryEmerald, width: 1.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryEmerald,
          foregroundColor: const Color(0xFF020617),
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(30),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.3,
          ),
        ),
      ),
    );
  }
}
