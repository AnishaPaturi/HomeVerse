import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'router.dart';
import 'theme.dart';
import '../features/auth/providers/auth_provider.dart';

class HomeVerseApp extends StatelessWidget {
  const HomeVerseApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..checkAuthStatus()),
      ],
      child: MaterialApp.router(
        title: 'HomeVerse',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        routerConfig: appRouter,
      ),
    );
  }
}
