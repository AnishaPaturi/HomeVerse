import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/theme.dart';

/// The signature HomeVerse Brand Header Logo with "HV" gradient icon and "SPATIAL OS" badge
class HomeVerseLogo extends StatelessWidget {
  final double iconSize;
  final double fontSize;
  final bool showBadge;

  const HomeVerseLogo({
    Key? key,
    this.iconSize = 36,
    this.fontSize = 18,
    this.showBadge = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // HV Gradient Icon
        Container(
          width: iconSize,
          height: iconSize,
          padding: const EdgeInsets.all(1.5),
          decoration: BoxDecoration(
            gradient: AppTheme.logoGradient,
            borderRadius: BorderRadius.circular(iconSize * 0.38),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primaryEmerald.withOpacity(0.25),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF070B10),
              borderRadius: BorderRadius.circular(iconSize * 0.34),
            ),
            alignment: Alignment.center,
            child: Text(
              "HV",
              style: GoogleFonts.spaceMono(
                color: AppTheme.primaryEmerald,
                fontSize: iconSize * 0.38,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        // HOMEVERSE text
        Text(
          "HOMEVERSE",
          style: GoogleFonts.spaceMono(
            fontSize: fontSize,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
            color: Colors.white,
          ),
        ),
        if (showBadge) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
            decoration: BoxDecoration(
              color: AppTheme.primaryEmerald.withOpacity(0.12),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(
                color: AppTheme.primaryEmerald.withOpacity(0.35),
                width: 1,
              ),
            ),
            child: Text(
              "SPATIAL OS",
              style: GoogleFonts.spaceMono(
                color: const Color(0xFF34D399),
                fontSize: 9,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

/// The signature Web "✦ AI SPATIAL ARCHITECTURE STUDIO" chip
class StudioChip extends StatelessWidget {
  final String label;

  const StudioChip({
    Key? key,
    this.label = "AI SPATIAL ARCHITECTURE STUDIO",
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: AppTheme.primaryEmerald.withOpacity(0.08),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: AppTheme.primaryEmerald.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.auto_awesome,
            size: 13,
            color: Color(0xFF34D399),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: GoogleFonts.spaceMono(
              color: const Color(0xFF34D399),
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
            ),
          ),
        ],
      ),
    );
  }
}

/// The signature Web Emerald-Teal-Lime Gradient Button
class GradientButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Widget child;
  final IconData? icon;
  final double height;
  final double? width;

  const GradientButton({
    Key? key,
    required this.onPressed,
    required this.child,
    this.icon,
    this.height = 48,
    this.width,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        gradient: AppTheme.brandGradient,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryEmerald.withOpacity(0.3),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(30),
          child: Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (icon != null) ...[
                  Icon(icon, size: 18, color: const Color(0xFF020617)),
                  const SizedBox(width: 8),
                ],
                DefaultTextStyle(
                  style: GoogleFonts.spaceMono(
                    color: const Color(0xFF020617),
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    letterSpacing: 0.5,
                  ),
                  child: child,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Glassmorphism Card matching the Web's glass-morphism-card
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;
  final VoidCallback? onTap;
  final double borderRadius;
  final Color? borderColor;

  const GlassCard({
    Key? key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin = EdgeInsets.zero,
    this.onTap,
    this.borderRadius = 16,
    this.borderColor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Widget content = Container(
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: borderColor ?? const Color(0x22FFFFFF),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: child,
    );

    if (onTap != null) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(borderRadius),
          child: content,
        ),
      );
    }

    return content;
  }
}
