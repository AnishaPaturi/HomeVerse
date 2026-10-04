import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../../app/theme.dart';
import '../../../shared/widgets/brand_widgets.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController(text: "demo@homeverse.ai");
  final _passwordController = TextEditingController(text: "password123");
  final _formKey = GlobalKey<FormState>();

  void _fillDemoCredentials(String email, String role) {
    _emailController.text = email;
    _passwordController.text = "password123";
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppTheme.surfaceCard,
        content: Text("Selected $role demo profile", style: const TextStyle(color: Colors.white)),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: AppTheme.backgroundDark,
      body: Stack(
        children: [
          // Background Atmospheric Lighting (matching web's ambient glows)
          Positioned(
            top: -100,
            left: -100,
            child: Container(
              width: 320,
              height: 320,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.primaryEmerald.withOpacity(0.08),
              ),
            ),
          ),
          Positioned(
            bottom: -60,
            right: -60,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.primaryTeal.withOpacity(0.08),
              ),
            ),
          ),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Header Logo & Badge
                      const Center(
                        child: HomeVerseLogo(iconSize: 42, fontSize: 20),
                      ),
                      const SizedBox(height: 20),

                      // Studio Tag Pill
                      const Center(
                        child: StudioChip(),
                      ),
                      const SizedBox(height: 16),

                      // Editorial Title
                      Text(
                        "Where Vision Meets\nBudget Certainty.",
                        textAlign: TextAlign.center,
                        style: GoogleFonts.playfairDisplay(
                          fontSize: 26,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Subtitle
                      Text(
                        "Enter your spatial studio to view your multi-floor digital twins, inspect room-by-room Indian budget allocations, and experiment with real-time material swaps.",
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          color: AppTheme.textMuted,
                          fontSize: 12,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 28),

                      // Error message if any
                      if (auth.errorMessage != null) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.accentRose.withOpacity(0.15),
                            border: Border.all(color: AppTheme.accentRose.withOpacity(0.4)),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            auth.errorMessage!,
                            style: const TextStyle(color: AppTheme.accentRose, fontSize: 12),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Glassmorphic Input Card Container
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: AppTheme.glassCardDecoration,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            TextFormField(
                              controller: _emailController,
                              style: const TextStyle(color: Colors.white, fontSize: 14),
                              decoration: InputDecoration(
                                labelText: "Email Address",
                                labelStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                                prefixIcon: const Icon(Icons.email_outlined, color: AppTheme.primaryEmerald, size: 20),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: const BorderSide(color: AppTheme.borderDark),
                                ),
                              ),
                              validator: (v) => v!.contains('@') ? null : 'Enter valid email',
                            ),
                            const SizedBox(height: 16),

                            TextFormField(
                              controller: _passwordController,
                              obscureText: true,
                              style: const TextStyle(color: Colors.white, fontSize: 14),
                              decoration: InputDecoration(
                                labelText: "Password",
                                labelStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                                prefixIcon: const Icon(Icons.lock_outline, color: AppTheme.primaryEmerald, size: 20),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: const BorderSide(color: AppTheme.borderDark),
                                ),
                              ),
                              validator: (v) => v!.length >= 6 ? null : 'Password too short',
                            ),
                            const SizedBox(height: 22),

                            // Signature Web Emerald Gradient Button
                            GradientButton(
                              onPressed: auth.isLoading
                                  ? null
                                  : () async {
                                      if (_formKey.currentState!.validate()) {
                                        final success = await auth.login(
                                          _emailController.text.trim(),
                                          _passwordController.text.trim(),
                                        );
                                        if (success && mounted) {
                                          context.go('/dashboard');
                                        }
                                      }
                                    },
                              icon: Icons.arrow_forward_rounded,
                              child: auth.isLoading
                                  ? const SizedBox(
                                      height: 18,
                                      width: 18,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF020617)),
                                    )
                                  : const Text("Sign In to Studio"),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Quick Demo Access Pills (matching Web)
                      Row(
                        children: [
                          const Expanded(child: Divider(color: AppTheme.borderDark)),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: Text(
                              "QUICK DEMO ACCESS",
                              style: GoogleFonts.spaceMono(
                                color: AppTheme.textMuted,
                                fontSize: 10,
                                letterSpacing: 0.8,
                              ),
                            ),
                          ),
                          const Expanded(child: Divider(color: AppTheme.borderDark)),
                        ],
                      ),
                      const SizedBox(height: 14),

                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => _fillDemoCredentials("architect@homeverse.ai", "Lead Architect"),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: Color(0x33FFFFFF)),
                                padding: const EdgeInsets.symmetric(vertical: 11),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              ),
                              child: Text(
                                "Architect Demo",
                                style: GoogleFonts.spaceMono(fontSize: 11, color: Colors.white70),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => _fillDemoCredentials("homeowner@homeverse.ai", "Home Owner"),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: Color(0x33FFFFFF)),
                                padding: const EdgeInsets.symmetric(vertical: 11),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              ),
                              child: Text(
                                "Homeowner Demo",
                                style: GoogleFonts.spaceMono(fontSize: 11, color: Colors.white70),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // Google SSO
                      OutlinedButton.icon(
                        onPressed: () => context.go('/dashboard'),
                        icon: const Icon(Icons.g_mobiledata, size: 24, color: Colors.white),
                        label: const Text(
                          "Continue with Google",
                          style: TextStyle(color: Colors.white, fontSize: 13),
                        ),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          side: const BorderSide(color: AppTheme.borderDark),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
