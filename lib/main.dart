import 'dart:io';

import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import 'models/show_item.dart';
import 'services/api_service.dart';

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
        textTheme: const TextTheme(
          headlineLarge: TextStyle(
            fontSize: 38,
            height: 1.16,
            fontWeight: FontWeight.w800,
            letterSpacing: -1.2,
          ),
          headlineSmall: TextStyle(
            fontSize: 25,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
          ),
          titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
          bodyLarge: TextStyle(
            fontSize: 17,
            height: 1.45,
            color: Color(0xFFB7B2C0),
          ),
          bodyMedium: TextStyle(
            fontSize: 15,
            height: 1.45,
            color: Color(0xFF9893A3),
          ),
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
  String _region = 'ZA';
  final Set<int> _saved = <int>{};

  void _toggleSaved(int id) {
    setState(() {
      if (!_saved.add(id)) _saved.remove(id);
    });
  }

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      DiscoverPage(
        saved: _saved,
        region: _region,
        onToggleSaved: _toggleSaved,
      ),
      WatchlistPage(saved: _saved, onToggleSaved: _toggleSaved),
      ProfilePage(
        region: _region,
        onRegionChanged: (value) => setState(() => _region = value),
      ),
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
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.auto_awesome_outlined),
                selectedIcon: Icon(Icons.auto_awesome_rounded),
                label: 'Discover',
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
        ),
      ),
    );
  }
}

class DiscoverPage extends StatefulWidget {
  const DiscoverPage({
    required this.saved,
    required this.region,
    required this.onToggleSaved,
    super.key,
  });

  final Set<int> saved;
  final String region;
  final ValueChanged<int> onToggleSaved;

  @override
  State<DiscoverPage> createState() => _DiscoverPageState();
}

class _DiscoverPageState extends State<DiscoverPage> {
  final ApiService _api = ApiService();
  final TextEditingController _controller = TextEditingController();

  bool _loading = false;
  String? _error;
  String? _activeMood;
  String _resultMode = 'prompt';
  List<ShowItem> _results = const <ShowItem>[];
  List<String> _interpretation = const <String>[];
  String _lastQuery = '';


  static const moods = <_MoodOption>[
    _MoodOption(
      keyName: 'gripping',
      title: 'Gripping',
      subtitle: 'Tension, mysteries and cliffhangers',
      icon: Icons.local_fire_department_outlined,
    ),
    _MoodOption(
      keyName: 'dark',
      title: 'Dark',
      subtitle: 'Psychological, bleak and unsettling',
      icon: Icons.dark_mode_outlined,
    ),
    _MoodOption(
      keyName: 'funny',
      title: 'Funny',
      subtitle: 'Comedy-first picks that make you laugh',
      icon: Icons.sentiment_very_satisfied_outlined,
    ),
    _MoodOption(
      keyName: 'comforting',
      title: 'Comforting',
      subtitle: 'Warm, uplifting and easy to settle into',
      icon: Icons.weekend_outlined,
    ),
    _MoodOption(
      keyName: 'clever',
      title: 'Clever',
      subtitle: 'Puzzles, twists and intricate stories',
      icon: Icons.psychology_outlined,
    ),
  ];

  Future<void> _findFromPrompt() async {
    final query = _controller.text.trim();
    if (query.length < 3) {
      setState(() => _error = 'Describe the kind of show you want first.');
      return;
    }

    FocusScope.of(context).unfocus();
    setState(() {
      _loading = true;
      _error = null;
      _activeMood = null;
      _resultMode = 'prompt';
      _interpretation = const <String>[];
      _lastQuery = query;
    });

    try {
      final recommendation = await _api.recommendFromPrompt(query: query);
      if (!mounted) return;
      setState(() {
        _results = recommendation.shows;
        _interpretation = recommendation.interpretation;
        _loading = false;
        if (_results.isEmpty) {
          _error = 'No titles passed every requirement. Try relaxing one constraint.';
        }
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  Future<void> _browseMood(_MoodOption mood) async {
    Navigator.of(context).pop();
    FocusScope.of(context).unfocus();
    setState(() {
      _loading = true;
      _error = null;
      _activeMood = mood.title;
      _resultMode = 'mood';
      _interpretation = <String>['Mood: ${mood.title}'];
      _lastQuery = '';
    });

    try {
      final recommendation = await _api.recommendFromMood(mood: mood.keyName);
      if (!mounted) return;
      setState(() {
        _results = recommendation.shows;
        _interpretation = recommendation.interpretation;
        _loading = false;
        if (_results.isEmpty) {
          _error = 'No strong ${mood.title.toLowerCase()} matches were found.';
        }
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  void _openMoodBrowser() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF15111D),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Browse by mood',
                style: Theme.of(sheetContext).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              const Text(
                'Mood browsing is separate from your written request, so the two can never conflict.',
              ),
              const SizedBox(height: 18),
              ...moods.map(
                (mood) => Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  clipBehavior: Clip.antiAlias,
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 18,
                      vertical: 10,
                    ),
                    leading: CircleAvatar(
                      backgroundColor: const Color(0xFF30274A),
                      child: Icon(mood.icon, color: const Color(0xFFC8BFFF)),
                    ),
                    title: Text(
                      mood.title,
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                    subtitle: Text(mood.subtitle),
                    trailing: const Icon(Icons.arrow_forward_rounded),
                    onTap: _loading ? null : () => _browseMood(mood),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _showResultsFeedback() async {
    final reason = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      backgroundColor: const Color(0xFF15111D),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'What was wrong with these picks?',
                style: Theme.of(sheetContext).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              const Text('This helps us tighten future recommendations.'),
              const SizedBox(height: 18),
              for (final option in const <String>[
                'Wrong genre',
                'Ignored my limits',
                'Too broad',
                'Already watched these',
                'Not available on my services',
                'Other',
              ])
                ListTile(
                  title: Text(option),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () => Navigator.pop(sheetContext, option),
                ),
            ],
          ),
        ),
      ),
    );

    if (reason == null || !mounted) return;
    try {
      await _api.sendFeedback(
        type: 'result_set',
        reason: reason,
        mode: _resultMode,
        mood: _activeMood,
        query: _lastQuery,
        resultIds: _results.map((show) => show.id).toList(),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Thanks — feedback saved.')),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Feedback could not be saved.')),
      );
    }
  }

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
                Text(
                  'Describe your perfect watch',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _controller,
                  minLines: 3,
                  maxLines: 5,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _loading ? null : _findFromPrompt(),
                  style: const TextStyle(fontSize: 17, height: 1.45),
                  decoration: InputDecoration(
                    prefixIcon: const Padding(
                      padding: EdgeInsets.only(left: 15, right: 8, bottom: 48),
                      child: Icon(Icons.chat_bubble_outline_rounded, size: 27),
                    ),
                    hintText: 'A completed psychological thriller under 3 seasons with clever twists',
                    filled: true,
                    fillColor: const Color(0xFF15111D),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 18,
                      vertical: 22,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(27),
                      borderSide: const BorderSide(color: Color(0xFF2B2633)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(27),
                      borderSide: const BorderSide(color: Color(0xFF2B2633)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(27),
                      borderSide: const BorderSide(
                        color: Color(0xFF8574FF),
                        width: 1.5,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 4),
                  child: Text(
                    'Try a genre, maximum seasons, episode length, completed status, exclusions, or “something like…”',
                    style: TextStyle(
                      color: Color(0xFF827C8C),
                      fontSize: 13,
                      height: 1.35,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  height: 62,
                  child: FilledButton.icon(
                    onPressed: _loading ? null : _findFromPrompt,
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF8574FF),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(21),
                      ),
                      textStyle: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    icon: _loading && _resultMode == 'prompt'
                        ? const SizedBox.square(
                            dimension: 22,
                            child: CircularProgressIndicator(strokeWidth: 2.5),
                          )
                        : const Icon(Icons.auto_awesome_rounded),
                    label: const Text('Find my picks'),
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    const Expanded(child: Divider(color: Color(0xFF2A2532))),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      child: Text(
                        'OR',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                    const Expanded(child: Divider(color: Color(0xFF2A2532))),
                  ],
                ),
                const SizedBox(height: 18),
                Container(
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1F1940), Color(0xFF12352F)],
                    ),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: const Color(0xFF40365A)),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 12,
                    ),
                    leading: const CircleAvatar(
                      backgroundColor: Color(0xFF4FD5CB),
                      child: Icon(Icons.theater_comedy_outlined, color: Color(0xFF091310)),
                    ),
                    title: const Text(
                      'Browse by mood',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
                    ),
                    subtitle: const Text(
                      'Gripping, dark, funny, comforting or clever',
                    ),
                    trailing: const Icon(Icons.arrow_forward_rounded),
                    onTap: _loading ? null : _openMoodBrowser,
                  ),
                ),
                if (_loading) ...[
                  const SizedBox(height: 24),
                  const LinearProgressIndicator(),
                ],
                if (_interpretation.isNotEmpty) ...[
                  const SizedBox(height: 18),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF15111D),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFF302943)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              _resultMode == 'mood'
                                  ? Icons.theater_comedy_outlined
                                  : Icons.rule_rounded,
                              size: 20,
                              color: const Color(0xFFAFA4FF),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              _resultMode == 'mood'
                                  ? 'Browsing by mood'
                                  : 'Requirements applied',
                              style: const TextStyle(fontWeight: FontWeight.w800),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: _interpretation
                              .map(
                                (label) => Chip(
                                  visualDensity: VisualDensity.compact,
                                  label: Text(label),
                                  backgroundColor: const Color(0xFF231D34),
                                  side: const BorderSide(color: Color(0xFF40365A)),
                                ),
                              )
                              .toList(),
                        ),
                      ],
                    ),
                  ),
                ],
                if (_error != null) ...[
                  const SizedBox(height: 18),
                  Text(
                    _error!,
                    style: const TextStyle(color: Color(0xFFFFA3A3)),
                  ),
                ],
                if (_results.isNotEmpty) ...[
                  const SizedBox(height: 40),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _activeMood == null
                            ? 'Matched to your request'
                            : '$_activeMood picks',
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      Text(
                        '${_results.length} live picks',
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  ..._results.map(
                    (show) => Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: ResultCard(
                        show: show,
                        region: widget.region,
                        saved: widget.saved.contains(show.id),
                        onToggleSaved: () => widget.onToggleSaved(show.id),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  OutlinedButton.icon(
                    onPressed: _showResultsFeedback,
                    icon: const Icon(Icons.tune_rounded),
                    label: const Text("These aren't right"),
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'TV metadata supplied by TVMaze.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Color(0xFF77717F), fontSize: 12),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MoodOption {
  const _MoodOption({
    required this.keyName,
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  final String keyName;
  final String title;
  final String subtitle;
  final IconData icon;
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
          decoration: BoxDecoration(
            color: const Color(0xFF7C68F8),
            borderRadius: BorderRadius.circular(18),
          ),
          child: const Icon(Icons.play_arrow_rounded, size: 34),
        ),
        const SizedBox(width: 16),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'FORFLICKSAKES',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2.1,
                ),
              ),
              SizedBox(height: 3),
              Text(
                'Stop scrolling. Start watching.',
                style: TextStyle(color: Color(0xFF908B99), fontSize: 15),
              ),
            ],
          ),
        ),
        const Icon(Icons.cloud_done_outlined, color: Color(0xFF4FD5CB)),
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
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF251D53), Color(0xFF111827), Color(0xFF0B362F)],
        ),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.auto_awesome_rounded, color: Color(0xFFAFA4FF)),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'YOUR PERSONAL WATCH CONCIERGE',
                  style: TextStyle(
                    color: Color(0xFFD1CBFF),
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.65,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 28),
          Text(
            'Your next\nobsession, picked\nin seconds.',
            style: TextStyle(
              fontSize: 37,
              height: 1.15,
              fontWeight: FontWeight.w900,
              letterSpacing: -1.25,
            ),
          ),
          SizedBox(height: 20),
          Text(
            'Describe exactly what you want, or browse by mood. Each path is '
            'kept separate so conflicting instructions never dilute your picks.',
            style: TextStyle(
              color: Color(0xFFB6B0BE),
              fontSize: 16,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}

class ResultCard extends StatelessWidget {
  const ResultCard({
    required this.show,
    required this.region,
    required this.saved,
    required this.onToggleSaved,
    super.key,
  });

  final ShowItem show;
  final String region;
  final bool saved;
  final VoidCallback onToggleSaved;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFF15111D),
      borderRadius: BorderRadius.circular(24),
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => ShowDetailPage(
              show: show,
              region: region,
              saved: saved,
              onToggleSaved: onToggleSaved,
            ),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Poster(url: show.poster, width: 128, height: 185),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            show.title,
                            style: const TextStyle(
                              fontSize: 21,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: onToggleSaved,
                          icon: Icon(
                            saved
                                ? Icons.bookmark_rounded
                                : Icons.bookmark_border_rounded,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      [
                        if (show.year > 0) '${show.year}',
                        if (show.seasons > 0) '${show.seasons} seasons',
                        if (show.runtime > 0) '${show.runtime} min',
                        if (show.status.isNotEmpty) show.status,
                      ].join(' · '),
                      style: const TextStyle(color: Color(0xFF918B9B)),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const Icon(
                          Icons.star_rounded,
                          color: Color(0xFFFFCA28),
                          size: 21,
                        ),
                        const SizedBox(width: 5),
                        Text(show.rating > 0 ? '${show.rating}' : 'Not rated'),
                        const SizedBox(width: 13),
                        const Text(
                          'Live data',
                          style: TextStyle(color: Color(0xFF4FD5CB)),
                        ),
                        if (show.confidence > 0) ...[
                          const SizedBox(width: 10),
                          Text(
                            '${show.confidence}% match',
                            style: const TextStyle(color: Color(0xFFAFA4FF)),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 14),
                    Text(
                      show.summary,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFFA9A3B1),
                        height: 1.45,
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Tap for details and viewing options',
                      style: TextStyle(color: Color(0xFFB5AAFF), fontSize: 13),
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

class ShowDetailPage extends StatefulWidget {
  const ShowDetailPage({
    required this.show,
    required this.region,
    required this.saved,
    required this.onToggleSaved,
    super.key,
  });

  final ShowItem show;
  final String region;
  final bool saved;
  final VoidCallback onToggleSaved;

  @override
  State<ShowDetailPage> createState() => _ShowDetailPageState();
}

class _ShowDetailPageState extends State<ShowDetailPage> {
  final ApiService _api = ApiService();
  late bool _saved = widget.saved;
  WatchOptions? _options;
  bool _loadingOptions = true;
  String? _optionsError;

  @override
  void initState() {
    super.initState();
    _loadOptions();
  }

  Future<void> _sendShowFeedback(String reason) async {
    try {
      await _api.sendFeedback(
        type: 'show',
        reason: reason,
        showId: widget.show.id,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Saved: $reason')),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Feedback could not be saved.')),
      );
    }
  }

  Future<void> _loadOptions() async {
    if (mounted) {
      setState(() {
        _loadingOptions = true;
        _optionsError = null;
      });
    }

    try {
      final options = await _api.watchOptions(
        showId: widget.show.id,
        region: widget.region,
      );
      if (!mounted) return;
      setState(() {
        _options = options;
        _loadingOptions = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadingOptions = false;
        _optionsError = 'Viewing options could not be loaded.';
      });
    }
  }

  Future<void> _openProvider(WatchProvider provider) async {
    final candidates = <String?>[
      if (Platform.isIOS) provider.iosUrl,
      if (Platform.isAndroid) provider.androidUrl,
      provider.webUrl,
    ].whereType<String>();

    for (final value in candidates) {
      final uri = Uri.tryParse(value);
      if (uri == null) continue;
      if (await launchUrl(uri, mode: LaunchMode.externalApplication)) return;
    }

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('${provider.name} could not be opened.')),
    );
  }

  Future<void> _shareShow(BuildContext shareContext) async {
    final show = widget.show;
    final details = <String>[
      'I found ${show.title} on ForFlickSakes.',
      if (show.year > 0) 'Released ${show.year}.',
      if (show.rating > 0) 'Rating: ${show.rating}/10.',
      if (show.officialUrl != null) show.officialUrl!,
    ].join(' ');
    final box = shareContext.findRenderObject() as RenderBox?;

    await SharePlus.instance.share(
      ShareParams(
        text: details,
        title: 'Share ${show.title}',
        subject: 'You might like ${show.title}',
        sharePositionOrigin: box == null
            ? null
            : box.localToGlobal(Offset.zero) & box.size,
      ),
    );
  }

  String _providerSubtitle(WatchProvider provider) {
    final parts = <String>[
      provider.type.replaceAll('_', ' '),
      if (provider.format?.isNotEmpty ?? false) provider.format!,
      if (provider.price != null) provider.price.toString(),
    ];
    return parts.join(' · ');
  }

  @override
  Widget build(BuildContext context) {
    final show = widget.show;
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 430,
            backgroundColor: const Color(0xFF07070C),
            actions: [
              Builder(
                builder: (shareContext) => IconButton(
                  tooltip: 'Share this series',
                  onPressed: () => _shareShow(shareContext),
                  icon: const Icon(Icons.ios_share_rounded),
                ),
              ),
              IconButton(
                tooltip: _saved
                    ? 'Remove from watchlist'
                    : 'Save to watchlist',
                onPressed: () {
                  widget.onToggleSaved();
                  setState(() => _saved = !_saved);
                },
                icon: Icon(
                  _saved
                      ? Icons.bookmark_rounded
                      : Icons.bookmark_border_rounded,
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  _Poster(
                    url: show.poster,
                    width: double.infinity,
                    height: 430,
                  ),
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Color(0x5507070C),
                          Color(0xFF07070C),
                        ],
                        stops: [0.35, 0.7, 1],
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
                Text(
                  show.title,
                  style: Theme.of(context).textTheme.headlineLarge,
                ),
                const SizedBox(height: 12),
                Text(
                  [
                    if (show.year > 0) '${show.year}',
                    if (show.seasons > 0) '${show.seasons} seasons',
                    if (show.runtime > 0) '${show.runtime} min',
                    if (show.status.isNotEmpty) show.status,
                  ].join(' · '),
                  style: const TextStyle(color: Color(0xFF9B95A4)),
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: show.genres
                      .map((genre) => Chip(label: Text(genre)))
                      .toList(),
                ),
                const SizedBox(height: 22),
                if (show.matchReasons.isNotEmpty) ...[
                  Text(
                    'Why this matched',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 10),
                  ...show.matchReasons.map(
                    (reason) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(
                            Icons.check_circle_rounded,
                            size: 19,
                            color: Color(0xFF4FD5CB),
                          ),
                          const SizedBox(width: 9),
                          Expanded(child: Text(reason)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                Text('About', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 10),
                Text(
                  show.summary,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                const SizedBox(height: 30),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          widget.onToggleSaved();
                          setState(() => _saved = !_saved);
                        },
                        icon: Icon(
                          _saved
                              ? Icons.bookmark_rounded
                              : Icons.bookmark_border_rounded,
                        ),
                        label: Text(_saved ? 'Saved' : 'Save'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Builder(
                        builder: (shareContext) => OutlinedButton.icon(
                          onPressed: () => _shareShow(shareContext),
                          icon: const Icon(Icons.share_outlined),
                          label: const Text('Share series'),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 30),
                Text(
                  'Help improve your picks',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final option in const <String>[
                      'Loved it',
                      'Not interested',
                      'Already watched',
                      'Wrong genre',
                      'Too dark',
                      'Too slow',
                      'Wrong service',
                    ])
                      ActionChip(
                        label: Text(option),
                        onPressed: () => _sendShowFeedback(option),
                      ),
                  ],
                ),
                const SizedBox(height: 32),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Where to watch',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ),
                    IconButton(
                      tooltip: 'Refresh availability',
                      onPressed: _loadingOptions ? null : _loadOptions,
                      icon: const Icon(Icons.refresh_rounded),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Availability for ${widget.region}. Tap a service to open its app or website.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 14),
                if (_loadingOptions)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(child: CircularProgressIndicator()),
                  )
                else if (_optionsError != null)
                  _AvailabilityMessage(
                    icon: Icons.cloud_off_rounded,
                    message: _optionsError!,
                    actionLabel: 'Try again',
                    onAction: _loadOptions,
                  )
                else if (_options == null || _options!.providers.isEmpty)
                  _AvailabilityMessage(
                    icon: Icons.tv_off_outlined,
                    message: _options?.message ??
                        'No verified streaming services are available for this region.',
                    actionLabel: 'Refresh',
                    onAction: _loadOptions,
                  )
                else
                  ..._options!.providers.map(
                    (provider) => Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: const Color(0xFF2A2340),
                          child: Text(
                            provider.name.isEmpty
                                ? '?'
                                : provider.name.characters.first.toUpperCase(),
                            style: const TextStyle(fontWeight: FontWeight.w900),
                          ),
                        ),
                        title: Text(provider.name),
                        subtitle: Text(_providerSubtitle(provider)),
                        trailing: const Icon(Icons.open_in_new_rounded),
                        onTap: () => _openProvider(provider),
                      ),
                    ),
                  ),
                if (_options?.attribution.isNotEmpty ?? false) ...[
                  const SizedBox(height: 8),
                  Text(
                    _options!.attribution,
                    style: const TextStyle(
                      color: Color(0xFF77717F),
                      fontSize: 12,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AvailabilityMessage extends StatelessWidget {
  const _AvailabilityMessage({
    required this.icon,
    required this.message,
    required this.actionLabel,
    required this.onAction,
  });

  final IconData icon;
  final String message;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF15111D),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF2B2633)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 34, color: const Color(0xFF9893A3)),
          const SizedBox(height: 10),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          TextButton.icon(
            onPressed: onAction,
            icon: const Icon(Icons.refresh_rounded),
            label: Text(actionLabel),
          ),
        ],
      ),
    );
  }
}

class _Poster extends StatelessWidget {
  const _Poster({required this.url, required this.width, required this.height});

  final String url;
  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: SizedBox(
        width: width,
        height: height,
        child: url.isEmpty
            ? const ColoredBox(
                color: Color(0xFF2A2532),
                child: Icon(Icons.movie_outlined, size: 48),
              )
            : Image.network(
                url,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => const ColoredBox(
                  color: Color(0xFF2A2532),
                  child: Icon(Icons.movie_outlined, size: 48),
                ),
              ),
      ),
    );
  }
}

class WatchlistPage extends StatelessWidget {
  const WatchlistPage({
    required this.saved,
    required this.onToggleSaved,
    super.key,
  });

  final Set<int> saved;
  final ValueChanged<int> onToggleSaved;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 110),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Watchlist', style: Theme.of(context).textTheme.headlineLarge),
            const SizedBox(height: 10),
            const Text('Saved live titles will appear here during this session.'),
            const Expanded(
              child: Center(
                child: Text(
                  'Cloud-synced watchlists are the next milestone.',
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ProfilePage extends StatefulWidget {
  const ProfilePage({
    required this.region,
    required this.onRegionChanged,
    super.key,
  });

  final String region;
  final ValueChanged<String> onRegionChanged;

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  static const services = <String>[
    'Netflix',
    'Prime Video',
    'Apple TV+',
    'Disney+',
    'Max',
    'Showmax',
    'DStv Stream',
  ];

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

  final Set<String> _selectedServices = <String>{
    'Netflix',
    'Prime Video',
    'Max',
    'Showmax',
  };
  double _maximumSeasons = 3;
  bool _completedOnly = false;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 110),
        children: [
          Text('Profile', style: Theme.of(context).textTheme.headlineLarge),
          const SizedBox(height: 8),
          const Text('Shape recommendations around your viewing setup.'),
          const SizedBox(height: 28),
          Text('Streaming region', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: widget.region,
            decoration: const InputDecoration(
              filled: true,
              fillColor: Color(0xFF15111D),
              prefixIcon: Icon(Icons.public_rounded),
            ),
            items: regions.entries
                .map(
                  (entry) => DropdownMenuItem<String>(
                    value: entry.key,
                    child: Text(entry.value),
                  ),
                )
                .toList(),
            onChanged: (value) {
              if (value != null) widget.onRegionChanged(value);
            },
          ),
          const SizedBox(height: 30),
          Text('Streaming services', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 12,
            children: services.map((service) {
              final selected = _selectedServices.contains(service);
              return FilterChip(
                selected: selected,
                label: Text(service),
                selectedColor: const Color(0xFF4FD5CB),
                labelStyle: TextStyle(
                  color: selected ? const Color(0xFF091310) : Colors.white,
                ),
                onSelected: (_) {
                  setState(() {
                    if (!_selectedServices.add(service)) {
                      _selectedServices.remove(service);
                    }
                  });
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 30),
          Text(
            'Maximum seasons: ${_maximumSeasons.round()}',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          Slider(
            value: _maximumSeasons,
            min: 1,
            max: 10,
            divisions: 9,
            onChanged: (value) => setState(() => _maximumSeasons = value),
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            value: _completedOnly,
            title: const Text('Completed shows only'),
            subtitle: const Text('Avoid programmes waiting for future seasons.'),
            onChanged: (value) => setState(() => _completedOnly = value),
          ),
          const Divider(height: 40),
          const ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(Icons.info_outline_rounded),
            title: Text('Live data sources'),
            subtitle: Text(
              'TVMaze for TV metadata. Watchmode is optional for verified '
              'streaming links; otherwise a regional viewing search is used.',
            ),
          ),
        ],
      ),
    );
  }
}
