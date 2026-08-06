import 'package:flutter/material.dart';

void main() => runApp(const ForFlickSakesApp());

class ForFlickSakesApp extends StatelessWidget {
  const ForFlickSakesApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ForFlickSakes',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF07070C),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF8574FF),
          secondary: Color(0xFF4FD5CB),
          surface: Color(0xFF13101B),
        ),
        fontFamily: 'Roboto',
        textTheme: const TextTheme(
          headlineLarge: TextStyle(fontSize: 38, height: 1.16, fontWeight: FontWeight.w800, letterSpacing: -1.2),
          headlineSmall: TextStyle(fontSize: 25, fontWeight: FontWeight.w800, letterSpacing: -0.5),
          titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
          bodyLarge: TextStyle(fontSize: 17, height: 1.45, color: Color(0xFFB7B2C0)),
          bodyMedium: TextStyle(fontSize: 15, height: 1.45, color: Color(0xFF9893A3)),
        ),
      ),
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
  final Set<String> _saved = <String>{};

  void _toggleSaved(String title) {
    setState(() {
      if (!_saved.add(title)) _saved.remove(title);
    });
  }

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      DiscoverPage(saved: _saved, onToggleSaved: _toggleSaved),
      WatchlistPage(saved: _saved, onToggleSaved: _toggleSaved),
      const ProfilePage(),
    ];

    return Scaffold(
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF0E0B15),
          border: Border(top: BorderSide(color: Color(0xFF17131F))),
        ),
        child: SafeArea(
          top: false,
          child: NavigationBar(
            height: 76,
            backgroundColor: Colors.transparent,
            indicatorColor: const Color(0xFF352A82),
            selectedIndex: _index,
            onDestinationSelected: (value) => setState(() => _index = value),
            labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
            destinations: const [
              NavigationDestination(icon: Icon(Icons.auto_awesome_outlined), selectedIcon: Icon(Icons.auto_awesome_rounded), label: 'Discover'),
              NavigationDestination(icon: Icon(Icons.bookmark_border_rounded), selectedIcon: Icon(Icons.bookmark_rounded), label: 'Watchlist'),
              NavigationDestination(icon: Icon(Icons.person_outline_rounded), selectedIcon: Icon(Icons.person_rounded), label: 'Profile'),
            ],
          ),
        ),
      ),
    );
  }
}

class DiscoverPage extends StatefulWidget {
  const DiscoverPage({required this.saved, required this.onToggleSaved, super.key});

  final Set<String> saved;
  final ValueChanged<String> onToggleSaved;

  @override
  State<DiscoverPage> createState() => _DiscoverPageState();
}

class _DiscoverPageState extends State<DiscoverPage> {
  final _controller = TextEditingController(text: 'Something gripping and clever, no more than 3 seasons');
  String _mood = 'Funny';
  bool _showResults = false;

  static const moods = <String>['Gripping', 'Funny', 'Comforting', 'Dark', 'Clever'];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(24, 22, 24, 118),
            sliver: SliverList.list(
              children: [
                const _BrandHeader(),
                const SizedBox(height: 36),
                const _ConciergePanel(),
                const SizedBox(height: 28),
                TextField(
                  controller: _controller,
                  minLines: 2,
                  maxLines: 3,
                  style: const TextStyle(fontSize: 17, height: 1.45),
                  decoration: InputDecoration(
                    prefixIcon: const Padding(
                      padding: EdgeInsets.only(left: 15, right: 8, bottom: 25),
                      child: Icon(Icons.chat_bubble_outline_rounded, size: 27),
                    ),
                    hintText: 'Tell us what you feel like watching',
                    filled: true,
                    fillColor: const Color(0xFF15111D),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 22),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(27), borderSide: const BorderSide(color: Color(0xFF2B2633))),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(27), borderSide: const BorderSide(color: Color(0xFF2B2633))),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(27), borderSide: const BorderSide(color: Color(0xFF8574FF), width: 1.5)),
                  ),
                ),
                const SizedBox(height: 22),
                Wrap(
                  spacing: 10,
                  runSpacing: 14,
                  children: moods.map((mood) {
                    final selected = mood == _mood;
                    return ChoiceChip(
                      selected: selected,
                      label: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (selected) ...[
                            const Icon(Icons.check_rounded, size: 19, color: Color(0xFF091310)),
                            const SizedBox(width: 8),
                          ],
                          Text(mood),
                        ],
                      ),
                      showCheckmark: false,
                      selectedColor: const Color(0xFF4FD5CB),
                      backgroundColor: const Color(0xFF0F0C15),
                      side: BorderSide(color: selected ? const Color(0xFF4FD5CB) : const Color(0xFFE4E0E8), width: 1.4),
                      labelStyle: TextStyle(color: selected ? const Color(0xFF091310) : Colors.white, fontSize: 16),
                      padding: const EdgeInsets.symmetric(horizontal: 17, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      onSelected: (_) => setState(() => _mood = mood),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  height: 65,
                  child: FilledButton.icon(
                    onPressed: () => setState(() => _showResults = true),
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF8574FF),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(23)),
                      textStyle: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
                    ),
                    icon: const Icon(Icons.auto_awesome_rounded),
                    label: const Text('Curate my picks'),
                  ),
                ),
                if (_showResults) ...[
                  const SizedBox(height: 40),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Curated for you', style: Theme.of(context).textTheme.headlineSmall),
                      Text('${demoShows.length} picks', style: Theme.of(context).textTheme.bodyLarge),
                    ],
                  ),
                  const SizedBox(height: 18),
                  ...demoShows.map((show) => Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: ResultCard(
                          show: show,
                          saved: widget.saved.contains(show.title),
                          onToggleSaved: () => widget.onToggleSaved(show.title),
                        ),
                      )),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BrandHeader extends StatelessWidget {
  const _BrandHeader();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(color: const Color(0xFF7C68F8), borderRadius: BorderRadius.circular(18)),
          child: const Icon(Icons.play_arrow_rounded, size: 34, color: Colors.white),
        ),
        const SizedBox(width: 16),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('FORFLICKSAKES', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: 2.1)),
              SizedBox(height: 3),
              Text('Stop scrolling. Start watching.', style: TextStyle(color: Color(0xFF908B99), fontSize: 15)),
            ],
          ),
        ),
        IconButton(
          tooltip: 'Notifications',
          onPressed: () {},
          icon: const Icon(Icons.notifications_none_rounded, color: Color(0xFF8E8998)),
        ),
      ],
    );
  }
}

class _ConciergePanel extends StatelessWidget {
  const _ConciergePanel();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(28, 30, 28, 28),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: const Color(0xFF3A3550)),
        gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF251D53), Color(0xFF111827), Color(0xFF0B362F)]),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.auto_awesome_rounded, color: Color(0xFFAFA4FF), size: 24),
              SizedBox(width: 10),
              Expanded(
                child: Text('YOUR PERSONAL WATCH CONCIERGE', style: TextStyle(color: Color(0xFFD1CBFF), fontSize: 13, fontWeight: FontWeight.w900, letterSpacing: 1.65)),
              ),
            ],
          ),
          SizedBox(height: 28),
          Text('Your next\nobsession, picked\nin seconds.', style: TextStyle(fontSize: 37, height: 1.15, fontWeight: FontWeight.w900, letterSpacing: -1.25)),
          SizedBox(height: 20),
          Text(
            'Tell ForFlickSakes your mood, available time and streaming services. You get a few confident choices—not another endless catalogue.',
            style: TextStyle(color: Color(0xFFB6B0BE), fontSize: 16, height: 1.45),
          ),
        ],
      ),
    );
  }
}

class ResultCard extends StatelessWidget {
  const ResultCard({required this.show, required this.saved, required this.onToggleSaved, super.key});

  final DemoShow show;
  final bool saved;
  final VoidCallback onToggleSaved;

  void _showWatchOptions(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      backgroundColor: const Color(0xFF15111D),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 6, 24, 30),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Where to watch', style: Theme.of(sheetContext).textTheme.headlineSmall),
              const SizedBox(height: 10),
              Text('${show.title} is currently listed on ${show.provider}.'),
              const SizedBox(height: 22),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () => Navigator.pop(sheetContext),
                  icon: const Icon(Icons.play_arrow_rounded),
                  label: Text('Watch on ${show.provider}'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showDetails(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ShowDetailPage(show: show, saved: saved, onToggleSaved: onToggleSaved),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFF15111D),
      borderRadius: BorderRadius.circular(24),
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: () => _showDetails(context),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: SizedBox(
                  width: 128,
                  height: 185,
                  child: Image.network(
                    show.poster,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      color: const Color(0xFF2A2532),
                      alignment: Alignment.center,
                      child: const Icon(Icons.movie_outlined, size: 42),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(child: Text(show.title, style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w800))),
                        IconButton(
                          tooltip: saved ? 'Remove from watchlist' : 'Save to watchlist',
                          visualDensity: VisualDensity.compact,
                          onPressed: onToggleSaved,
                          icon: Icon(saved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded),
                        ),
                      ],
                    ),
                    Text('${show.year} · ${show.seasons} seasons · ${show.runtime} min', style: const TextStyle(color: Color(0xFF918B9B), fontSize: 14)),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, color: Color(0xFFFFCA28), size: 21),
                        const SizedBox(width: 5),
                        Text('${show.rating}', style: const TextStyle(fontSize: 15)),
                        const SizedBox(width: 13),
                        Flexible(child: Text(show.provider, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFFB5AAFF), fontSize: 15))),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Text(show.reason, maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFFA9A3B1), fontSize: 15, height: 1.45)),
                    const SizedBox(height: 14),
                    TextButton.icon(
                      onPressed: () => _showWatchOptions(context),
                      icon: const Icon(Icons.play_circle_outline_rounded, size: 19),
                      label: const Text('Watch now'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ShowDetailPage extends StatelessWidget {
  const ShowDetailPage({required this.show, required this.saved, required this.onToggleSaved, super.key});

  final DemoShow show;
  final bool saved;
  final VoidCallback onToggleSaved;

  void _showWatchOptions(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      backgroundColor: const Color(0xFF15111D),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 6, 24, 30),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Where to watch', style: Theme.of(sheetContext).textTheme.headlineSmall),
              const SizedBox(height: 10),
              Text('${show.title} is currently listed on ${show.provider}.'),
              const SizedBox(height: 22),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () => Navigator.pop(sheetContext),
                  icon: const Icon(Icons.play_arrow_rounded),
                  label: Text('Watch on ${show.provider}'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF07070C),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 430,
            backgroundColor: const Color(0xFF07070C),
            foregroundColor: Colors.white,
            actions: [
              IconButton(
                tooltip: saved ? 'Remove from watchlist' : 'Save to watchlist',
                onPressed: onToggleSaved,
                icon: Icon(saved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    show.poster,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      color: const Color(0xFF211C29),
                      alignment: Alignment.center,
                      child: const Icon(Icons.movie_outlined, size: 72),
                    ),
                  ),
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Color(0x5507070C), Color(0xFF07070C)],
                        stops: [0.38, 0.70, 1],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 44),
            sliver: SliverList.list(
              children: [
                Text(show.title, style: const TextStyle(fontSize: 34, height: 1.1, fontWeight: FontWeight.w900, letterSpacing: -0.8)),
                const SizedBox(height: 12),
                Text('${show.year} · ${show.seasons} seasons · ${show.runtime} min', style: const TextStyle(color: Color(0xFF9B95A4), fontSize: 15)),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Icon(Icons.star_rounded, color: Color(0xFFFFCA28), size: 22),
                    const SizedBox(width: 6),
                    Text('${show.rating}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    const SizedBox(width: 18),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                      decoration: BoxDecoration(
                        color: const Color(0xFF211B2C),
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(color: const Color(0xFF3A3346)),
                      ),
                      child: Text(show.provider, style: const TextStyle(color: Color(0xFFC2B9FF), fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
                const SizedBox(height: 28),
                Text('Why we picked this', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 10),
                Text(show.reason, style: const TextStyle(color: Color(0xFFB8B2C0), fontSize: 16, height: 1.55)),
                const SizedBox(height: 30),
                SizedBox(
                  height: 58,
                  child: FilledButton.icon(
                    onPressed: () => _showWatchOptions(context),
                    icon: const Icon(Icons.play_arrow_rounded),
                    label: Text('Watch on ${show.provider}'),
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF8574FF),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                      textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: onToggleSaved,
                  icon: Icon(saved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded),
                  label: Text(saved ? 'Saved to watchlist' : 'Save to watchlist'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class WatchlistPage extends StatelessWidget {
  const WatchlistPage({required this.saved, required this.onToggleSaved, super.key});

  final Set<String> saved;
  final ValueChanged<String> onToggleSaved;

  @override
  Widget build(BuildContext context) {
    final shows = demoShows.where((show) => saved.contains(show.title)).toList();
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 110),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Watchlist', style: Theme.of(context).textTheme.headlineLarge),
            const SizedBox(height: 10),
            const Text('The picks you want to come back to.'),
            const SizedBox(height: 24),
            if (shows.isEmpty)
              const Expanded(child: Center(child: Text('Save a recommendation and it will appear here.')))
            else
              Expanded(
                child: ListView.separated(
                  itemCount: shows.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 16),
                  itemBuilder: (context, index) {
                    final show = shows[index];
                    return ResultCard(show: show, saved: true, onToggleSaved: () => onToggleSaved(show.title));
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  static const services = <String>['Netflix', 'Prime Video', 'Apple TV+', 'Disney+', 'Max', 'Showmax', 'DStv Stream'];

  static const regions = <String, String>{
    'ZA': 'South Africa',
    'PT': 'Portugal',
    'GB': 'United Kingdom',
    'US': 'United States',
    'IE': 'Ireland',
    'ES': 'Spain',
    'FR': 'France',
    'DE': 'Germany',
    'AU': 'Australia',
    'NZ': 'New Zealand',
  };

  final Set<String> _selectedServices = <String>{'Netflix', 'Prime Video', 'Max', 'Showmax'};
  String _region = 'ZA';
  double _maximumSeasons = 3;
  bool _completedOnly = false;
  bool _analyticsEnabled = false;

  void _toggleService(String service) {
    setState(() {
      if (!_selectedServices.add(service)) _selectedServices.remove(service);
    });
  }

  void _showInfo(BuildContext context, String title, String body) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      backgroundColor: const Color(0xFF15111D),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 4, 24, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(sheetContext).textTheme.headlineSmall),
              const SizedBox(height: 14),
              Text(body, style: const TextStyle(color: Color(0xFFB7B2C0), fontSize: 15, height: 1.5)),
              const SizedBox(height: 24),
              SizedBox(width: double.infinity, child: FilledButton(onPressed: () => Navigator.pop(sheetContext), child: const Text('Close'))),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final maxSeasons = _maximumSeasons.round();
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 110),
        children: [
          Text('Profile', style: Theme.of(context).textTheme.headlineLarge),
          const SizedBox(height: 8),
          const Text('Shape recommendations around your services and viewing habits.'),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(color: const Color(0xFF15111D), borderRadius: BorderRadius.circular(22), border: Border.all(color: const Color(0xFF282230))),
            child: const Row(
              children: [
                CircleAvatar(radius: 26, backgroundColor: Color(0xFF352A82), child: Icon(Icons.person_rounded, color: Colors.white)),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Guest profile', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                      SizedBox(height: 4),
                      Text('Cloud sync and sign-in will be added next.', style: TextStyle(color: Color(0xFF9893A3))),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 30),
          Text('Streaming region', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _region,
            decoration: InputDecoration(
              filled: true,
              fillColor: const Color(0xFF15111D),
              prefixIcon: const Icon(Icons.public_rounded),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(18), borderSide: const BorderSide(color: Color(0xFF2B2633))),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(18), borderSide: const BorderSide(color: Color(0xFF2B2633))),
            ),
            items: regions.entries.map((entry) => DropdownMenuItem<String>(value: entry.key, child: Text(entry.value))).toList(),
            onChanged: (value) {
              if (value != null) setState(() => _region = value);
            },
          ),
          const SizedBox(height: 30),
          Text('Streaming services', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          const Text('Select every service you currently use.'),
          const SizedBox(height: 16),
          Wrap(
            spacing: 10,
            runSpacing: 12,
            children: services.map((service) {
              final selected = _selectedServices.contains(service);
              return FilterChip(
                selected: selected,
                showCheckmark: false,
                avatar: selected
                    ? const Icon(Icons.check_rounded, size: 18, color: Color(0xFF091310))
                    : const Icon(Icons.tv_rounded, size: 18),
                label: Text(service),
                selectedColor: const Color(0xFF4FD5CB),
                backgroundColor: const Color(0xFF15111D),
                side: BorderSide(color: selected ? const Color(0xFF4FD5CB) : const Color(0xFF39333F)),
                labelStyle: TextStyle(color: selected ? const Color(0xFF091310) : Colors.white, fontWeight: FontWeight.w600),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                onSelected: (_) => _toggleService(service),
              );
            }).toList(),
          ),
          const SizedBox(height: 30),
          Row(
            children: [
              Expanded(child: Text('Maximum seasons: $maxSeasons', style: Theme.of(context).textTheme.titleLarge)),
              Text(maxSeasons == 10 ? 'Any' : '$maxSeasons', style: const TextStyle(color: Color(0xFFAFA4FF), fontSize: 17, fontWeight: FontWeight.w800)),
            ],
          ),
          Slider(
            value: _maximumSeasons,
            min: 1,
            max: 10,
            divisions: 9,
            label: maxSeasons == 10 ? 'Any' : '$maxSeasons seasons',
            onChanged: (value) => setState(() => _maximumSeasons = value),
          ),
          const SizedBox(height: 10),
          SwitchListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 4),
            value: _completedOnly,
            title: const Text('Completed shows only'),
            subtitle: const Text('Avoid programmes still waiting for future seasons.'),
            secondary: const Icon(Icons.flag_circle_outlined),
            onChanged: (value) => setState(() => _completedOnly = value),
          ),
          const Divider(height: 38, color: Color(0xFF282230)),
          SwitchListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 4),
            value: _analyticsEnabled,
            title: const Text('Help improve ForFlickSakes'),
            subtitle: const Text('Allow anonymous performance and usage analytics.'),
            secondary: const Icon(Icons.analytics_outlined),
            onChanged: (value) => setState(() => _analyticsEnabled = value),
          ),
          const SizedBox(height: 12),
          ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 4),
            leading: const Icon(Icons.shield_outlined),
            title: const Text('Privacy policy'),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => _showInfo(context, 'Privacy policy', 'ForFlickSakes stores your selected services, region and recommendation preferences to personalise the app. Account and cloud features will include controls for accessing and deleting your information.'),
          ),
          ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 4),
            leading: const Icon(Icons.description_outlined),
            title: const Text('Terms of service'),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => _showInfo(context, 'Terms of service', 'ForFlickSakes provides entertainment discovery and recommendations. Streaming availability can change and should be confirmed with the relevant provider.'),
          ),
          ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 4),
            leading: const Icon(Icons.info_outline_rounded),
            title: const Text('About ForFlickSakes'),
            subtitle: const Text('Stop scrolling. Start watching.'),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => _showInfo(context, 'About ForFlickSakes', 'ForFlickSakes helps you find a confident next watch based on your mood, available time, preferred length and streaming services.'),
          ),
        ],
      ),
    );
  }
}

class DemoShow {
  const DemoShow({required this.title, required this.year, required this.seasons, required this.runtime, required this.rating, required this.provider, required this.poster, required this.reason});

  final String title;
  final int year;
  final int seasons;
  final int runtime;
  final double rating;
  final String provider;
  final String poster;
  final String reason;
}

const demoShows = <DemoShow>[
  DemoShow(
    title: 'Severance',
    year: 2022,
    seasons: 2,
    runtime: 50,
    rating: 8.7,
    provider: 'Apple TV+',
    poster: 'https://image.tmdb.org/t/p/w500/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg',
    reason: 'A precise, unsettling mystery with strong workplace tension and a puzzle that rewards attention.',
  ),
  DemoShow(
    title: 'Dark',
    year: 2017,
    seasons: 3,
    runtime: 55,
    rating: 8.4,
    provider: 'Netflix',
    poster: 'https://image.tmdb.org/t/p/w500/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg',
    reason: 'A completed, deeply layered mystery for viewers who enjoy complex stories and careful clues.',
  ),
  DemoShow(
    title: 'The Night Agent',
    year: 2023,
    seasons: 2,
    runtime: 48,
    rating: 7.5,
    provider: 'Netflix',
    poster: 'https://image.tmdb.org/t/p/w500/xhB2hGJBSvK69ZDOZJvNnI1JzQj.jpg',
    reason: 'Fast-moving conspiracy thrills with an accessible plot and strong end-of-episode hooks.',
  ),
  DemoShow(
    title: 'The Last of Us',
    year: 2023,
    seasons: 2,
    runtime: 55,
    rating: 8.6,
    provider: 'Max',
    poster: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
    reason: 'A premium character drama with suspense, emotional weight and exceptional performances.',
  ),
  DemoShow(
    title: 'The Bear',
    year: 2022,
    seasons: 3,
    runtime: 30,
    rating: 8.6,
    provider: 'Disney+',
    poster: 'https://image.tmdb.org/t/p/w500/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg',
    reason: 'Sharp, funny and intense, with short episodes and characters who feel immediately real.',
  ),
];
