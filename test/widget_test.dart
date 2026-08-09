import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('ForFlickSakes beta shell renders brand copy', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Column(
            children: [
              Text('YOUR WATCH CONCIERGE'),
              Text('FOR FLICK SAKES.'),
              Text('Stop scrolling. Start watching.'),
            ],
          ),
        ),
      ),
    );

    expect(find.text('YOUR WATCH CONCIERGE'), findsOneWidget);
    expect(find.text('FOR FLICK SAKES.'), findsOneWidget);
    expect(find.text('Stop scrolling. Start watching.'), findsOneWidget);
  });

  testWidgets(
    'beta navigation labels fit the intended information architecture',
    (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            bottomNavigationBar: NavigationBar(
              destinations: const [
                NavigationDestination(
                  icon: Icon(Icons.auto_awesome_outlined),
                  label: 'Discover',
                ),
                NavigationDestination(
                  icon: Icon(Icons.favorite_outline_rounded),
                  label: 'For You',
                ),
                NavigationDestination(
                  icon: Icon(Icons.bookmark_border_rounded),
                  label: 'Watchlist',
                ),
                NavigationDestination(
                  icon: Icon(Icons.person_outline_rounded),
                  label: 'Profile',
                ),
              ],
            ),
          ),
        ),
      );

      expect(find.text('Discover'), findsOneWidget);
      expect(find.text('For You'), findsOneWidget);
      expect(find.text('Watchlist'), findsOneWidget);
      expect(find.text('Profile'), findsOneWidget);
    },
  );
}