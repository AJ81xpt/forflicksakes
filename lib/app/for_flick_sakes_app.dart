import 'package:flutter/material.dart';
import 'app_theme.dart';
import '../screens/discover_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/search_screen.dart';
import '../screens/watchlist_screen.dart';

class ForFlickSakesApp extends StatelessWidget {
  const ForFlickSakesApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ForFlickSakes',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark(),
      home: const AppShell(),
    );
  }
}

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;
  final Set<int> _savedIds = {2};

  void _toggleSaved(int id) {
    setState(() {
      if (!_savedIds.add(id)) {
        _savedIds.remove(id);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      DiscoverScreen(savedIds: _savedIds, onToggleSaved: _toggleSaved),
      const SearchScreen(),
      WatchlistScreen(savedIds: _savedIds, onRemove: _toggleSaved),
      const ProfileScreen(),
    ];

    return Scaffold(
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.auto_awesome_outlined),
            selectedIcon: Icon(Icons.auto_awesome_rounded),
            label: 'Discover',
          ),
          NavigationDestination(
            icon: Icon(Icons.search_outlined),
            selectedIcon: Icon(Icons.search_rounded),
            label: 'Search',
          ),
          NavigationDestination(
            icon: Icon(Icons.bookmark_border_rounded),
            selectedIcon: Icon(Icons.bookmark_rounded),
            label: 'Watchlist',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
