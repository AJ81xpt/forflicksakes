import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('ForFlickSakes test environment renders', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: Text('ForFlickSakes')),
      ),
    );

    expect(find.text('ForFlickSakes'), findsOneWidget);
  });
}
