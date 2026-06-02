import 'package:flutter_test/flutter_test.dart';
import 'package:thiraipedia/app.dart';

void main() {
  testWidgets('App loads successfully', (WidgetTester tester) async {
    await tester.pumpWidget(const ThiraiPediaApp());
    expect(find.text('Thirai'), findsWidgets);
  });
}