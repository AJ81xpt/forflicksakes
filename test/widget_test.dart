import 'package:flutter_test/flutter_test.dart';
import 'package:forflicksakes/main.dart';

void main() {
  testWidgets('ForFlickSakes live shell renders', (tester) async {
    await tester.pumpWidget(const ForFlickSakesApp());
    expect(find.text('FORFLICKSAKES'), findsOneWidget);
    expect(find.text('Curate my picks'), findsOneWidget);
  });
}
