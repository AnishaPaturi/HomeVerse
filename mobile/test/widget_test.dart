import 'package:flutter_test/flutter_test.dart';
import 'package:homeverse_mobile/app/app.dart';

void main() {
  testWidgets('HomeVerseApp smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const HomeVerseApp());
    expect(find.byType(HomeVerseApp), findsOneWidget);
  });
}
