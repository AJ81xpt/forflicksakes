import 'dart:io';

import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import 'models/show_item.dart';
import 'services/api_service.dart';
import 'services/personalization_store.dart';


const _ffsLanguages = <String, String>{
  'en': 'English',
  'pt': 'Português',
  'es': 'Español',
  'fr': 'Français',
  'de': 'Deutsch',
};

const _ffsText = <String, Map<String, String>>{
  'en': {
    'discover': 'Discover',
    'forYou': 'For You',
    'watchlist': 'Watchlist',
    'profile': 'Profile',
    'concierge': 'YOUR WATCH CONCIERGE',
    'brand': 'FOR FLICK SAKES.',
    'stop': 'Stop scrolling.\nStart watching.',
    'browse': 'Browse a mood for instant inspiration, or describe your perfect watch for precise picks.',
    'forYouTag': 'Because your taste is starting to show.',
    'watchlistEmpty': 'For Flick Sakes... save something worth watching.',
    'profileTitle': 'Profile & taste',
    'streamingRegion': 'Streaming region',
    'streamingServices': 'Streaming services',
    'language': 'App language',
    'stored': 'Stored on this device',
    'storedBody': 'Your preferences, watch history and watchlist stay on this device.',
    'reset': 'Reset personalisation',
  },
  'pt': {
    'discover': 'Descobrir',
    'forYou': 'Para ti',
    'watchlist': 'Lista',
    'profile': 'Perfil',
    'concierge': 'O TEU CONCIERGE DE SÉRIES',
    'brand': 'FOR FLICK SAKES.',
    'stop': 'Para de procurar.\nComeça a ver.',
    'browse': 'Escolhe um estado de espírito ou descreve exatamente o que queres ver.',
    'forYouTag': 'Porque o teu gosto começa a aparecer.',
    'watchlistEmpty': 'For Flick Sakes... guarda algo que valha a pena ver.',
    'profileTitle': 'Perfil e preferências',
    'streamingRegion': 'Região de streaming',
    'streamingServices': 'Serviços de streaming',
    'language': 'Idioma da aplicação',
    'stored': 'Guardado neste dispositivo',
    'storedBody': 'As tuas preferências, histórico e lista ficam neste dispositivo.',
    'reset': 'Repor personalização',
  },
  'es': {
    'discover': 'Descubrir',
    'forYou': 'Para ti',
    'watchlist': 'Mi lista',
    'profile': 'Perfil',
    'concierge': 'TU CONCIERGE DE SERIES',
    'brand': 'FOR FLICK SAKES.',
    'stop': 'Deja de buscar.\nEmpieza a ver.',
    'browse': 'Elige un estado de ánimo o describe exactamente qué quieres ver.',
    'forYouTag': 'Porque tu gusto ya empieza a notarse.',
    'watchlistEmpty': 'For Flick Sakes... guarda algo que merezca la pena.',
    'profileTitle': 'Perfil y preferencias',
    'streamingRegion': 'Región de streaming',
    'streamingServices': 'Servicios de streaming',
    'language': 'Idioma de la aplicación',
    'stored': 'Guardado en este dispositivo',
    'storedBody': 'Tus preferencias, historial y lista se guardan en este dispositivo.',
    'reset': 'Restablecer personalización',
  },
  'fr': {
    'discover': 'Découvrir',
    'forYou': 'Pour vous',
    'watchlist': 'Ma liste',
    'profile': 'Profil',
    'concierge': 'VOTRE CONCIERGE SÉRIES',
    'brand': 'FOR FLICK SAKES.',
    'stop': 'Arrêtez de chercher.\nCommencez à regarder.',
    'browse': 'Choisissez une humeur ou décrivez exactement ce que vous voulez regarder.',
    'forYouTag': 'Parce que vos goûts commencent à se dessiner.',
    'watchlistEmpty': 'For Flick Sakes... gardez quelque chose qui vaut le détour.',
    'profileTitle': 'Profil et préférences',
    'streamingRegion': 'Région de streaming',
    'streamingServices': 'Services de streaming',
    'language': 'Langue de l’application',
    'stored': 'Stocké sur cet appareil',
    'storedBody': 'Vos préférences, historique et liste restent sur cet appareil.',
    'reset': 'Réinitialiser la personnalisation',
  },
  'de': {
    'discover': 'Entdecken',
    'forYou': 'Für dich',
    'watchlist': 'Merkliste',
    'profile': 'Profil',
    'concierge': 'DEIN SERIEN-CONCIERGE',
    'brand': 'FOR FLICK SAKES.',
    'stop': 'Hör auf zu suchen.\nFang an zu schauen.',
    'browse': 'Wähle eine Stimmung oder beschreibe genau, was du sehen möchtest.',
    'forYouTag': 'Weil dein Geschmack langsam sichtbar wird.',
    'watchlistEmpty': 'For Flick Sakes... speichere etwas, das sich lohnt.',
    'profileTitle': 'Profil und Vorlieben',
    'streamingRegion': 'Streaming-Region',
    'streamingServices': 'Streaming-Dienste',
    'language': 'App-Sprache',
    'stored': 'Auf diesem Gerät gespeichert',
    'storedBody': 'Vorlieben, Verlauf und Merkliste bleiben auf diesem Gerät.',
    'reset': 'Personalisierung zurücksetzen',
  },
};

String _t(String languageCode, String key) =>
    _ffsText[languageCode]?[key] ?? _ffsText['en']![key] ?? key;

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
        scaffoldBackgroundColor: const Color(0xFF050309),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF8125E8),
          secondary: Color(0xFFB34CFF),
          surface: Color(0xFF1B0733),
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
  final PersonalizationStore _personalization = PersonalizationStore();
  int _index = 0;
  bool _loadingProfile = true;
  String _region = 'ZA';
  Set<String> _services = <String>{'Netflix', 'Prime Video', 'HBO Max', 'Showmax'};
  int _maxSeasons = 3;
  bool _completedOnly = false;
  String _appLanguage = 'en';
  Set<int> _saved = <int>{};
  Set<int> _dismissed = <int>{};
  Set<int> _watched = <int>{};
  Map<String, int> _feedbackCounts = <String, int>{};
  Map<int, ShowItem> _knownShows = <int, ShowItem>{};

  @override
  void initState() {
    super.initState();
    _loadPersonalization();
  }

  Future<void> _loadPersonalization() async {
    final snapshot = await _personalization.load();
    if (!mounted) return;
    setState(() {
      _region = snapshot.region;
      _services = snapshot.services;
      _maxSeasons = snapshot.maxSeasons;
      _completedOnly = snapshot.completedOnly;
      _saved = snapshot.savedIds;
      _dismissed = snapshot.dismissedIds;
      _watched = snapshot.watchedIds;
      _feedbackCounts = snapshot.feedbackCounts;
      _knownShows = snapshot.knownShows;
      _appLanguage = snapshot.appLanguage;
      _loadingProfile = false;
    });
  }

  Future<void> _persistPreferences() => _personalization.savePreferences(
        region: _region,
        services: _services,
        maxSeasons: _maxSeasons,
        completedOnly: _completedOnly,
      );

  void _toggleSaved(int id) {
    setState(() {
      if (!_saved.add(id)) _saved.remove(id);
    });
    _personalization.saveSavedIds(_saved);
  }

  Future<void> _rememberShows(Iterable<ShowItem> shows) async {
    await _personalization.saveKnownShows(shows);
    if (!mounted) return;
    setState(() {
      for (final show in shows) {
        _knownShows[show.id] = show;
      }
    });
  }

  Future<void> _recordLocalFeedback(int showId, String reason) async {
    await _personalization.recordFeedback(showId: showId, reason: reason);
    await _loadPersonalization();
  }

  Future<void> _resetPersonalization() async {
    await _personalization.reset();
    await _loadPersonalization();
  }

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      DiscoverPage(
        languageCode: _appLanguage,
        saved: _saved,
        region: _region,
        services: _services,
        maxSeasons: _maxSeasons,
        completedOnly: _completedOnly,
        excludedIds: {..._dismissed, ..._watched},
        onToggleSaved: _toggleSaved,
        onFeedback: _recordLocalFeedback,
        onShowsSeen: _rememberShows,
      ),
      ForYouPage(
        languageCode: _appLanguage,
        saved: _saved,
        watched: _watched,
        dismissed: _dismissed,
        knownShows: _knownShows,
        region: _region,
        services: _services,
        maxSeasons: _maxSeasons,
        completedOnly: _completedOnly,
        onToggleSaved: _toggleSaved,
        onFeedback: _recordLocalFeedback,
        onShowsSeen: _rememberShows,
      ),
      WatchlistPage(
        languageCode: _appLanguage,
        saved: _saved,
        knownShows: _knownShows,
        region: _region,
        onToggleSaved: _toggleSaved,
        onFeedback: _recordLocalFeedback,
      ),
      ProfilePage(
        languageCode: _appLanguage,
        onLanguageChanged: (value) {
          setState(() => _appLanguage = value);
          _personalization.saveAppLanguage(value);
        },
        region: _region,
        services: _services,
        maxSeasons: _maxSeasons,
        completedOnly: _completedOnly,
        watchedCount: _watched.length,
        dismissedCount: _dismissed.length,
        dismissedIds: _dismissed,
        knownShows: _knownShows,
        feedbackCounts: _feedbackCounts,
        onRegionChanged: (value) {
          setState(() => _region = value);
          _persistPreferences();
        },
        onServicesChanged: (value) {
          setState(() => _services = value);
          _persistPreferences();
        },
        onMaxSeasonsChanged: (value) {
          setState(() => _maxSeasons = value);
          _persistPreferences();
        },
        onCompletedOnlyChanged: (value) {
          setState(() => _completedOnly = value);
          _persistPreferences();
        },
        onRestoreDismissed: (id) async {
          await _personalization.restoreDismissed(id);
          await _loadPersonalization();
        },
        onReset: _resetPersonalization,
      ),
    ];

    if (_loadingProfile) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

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
            destinations: [
              NavigationDestination(
                icon: Icon(Icons.auto_awesome_outlined),
                selectedIcon: Icon(Icons.auto_awesome_rounded),
                label: _t(_appLanguage, 'discover'),
              ),
              NavigationDestination(
                icon: Icon(Icons.favorite_outline_rounded),
                selectedIcon: Icon(Icons.favorite_rounded),
                label: _t(_appLanguage, 'forYou'),
              ),
              NavigationDestination(
                icon: Icon(Icons.bookmark_border_rounded),
                selectedIcon: Icon(Icons.bookmark_rounded),
                label: _t(_appLanguage, 'watchlist'),
              ),
              NavigationDestination(
                icon: Icon(Icons.person_outline_rounded),
                selectedIcon: Icon(Icons.person_rounded),
                label: _t(_appLanguage, 'profile'),
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
    required this.languageCode,
    required this.saved,
    required this.region,
    required this.services,
    required this.maxSeasons,
    required this.completedOnly,
    required this.excludedIds,
    required this.onToggleSaved,
    required this.onFeedback,
    required this.onShowsSeen,
    super.key,
  });

  final String languageCode;
  final Set<int> saved;
  final String region;
  final Set<String> services;
  final int maxSeasons;
  final bool completedOnly;
  final Set<int> excludedIds;
  final ValueChanged<int> onToggleSaved;
  final Future<void> Function(int showId, String reason) onFeedback;
  final Future<void> Function(Iterable<ShowItem> shows) onShowsSeen;

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
  int _visibleResultCount = 5;


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
      _visibleResultCount = 5;
    });

    try {
      final recommendation = await _api.recommendFromPrompt(
        query: query,
        region: widget.region,
        services: widget.services,
        maxSeasons: widget.maxSeasons,
        completedOnly: widget.completedOnly,
        excludedIds: widget.excludedIds,
      );
      await widget.onShowsSeen(recommendation.shows);
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
        _error = 'Oops, looks like something went wrong. Please try again.';
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
      _visibleResultCount = 5;
    });

    try {
      final recommendation = await _api.recommendFromMood(
        mood: mood.keyName,
        region: widget.region,
        services: widget.services,
        maxSeasons: widget.maxSeasons,
        completedOnly: widget.completedOnly,
        excludedIds: widget.excludedIds,
      );
      await widget.onShowsSeen(recommendation.shows);
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
        _error = 'Oops, looks like something went wrong. Please try again.';
      });
    }
  }

  Future<void> _refinePrompt(String instruction) async {
    final base = _lastQuery.trim().isEmpty ? _controller.text.trim() : _lastQuery.trim();
    if (base.isEmpty || _loading) return;
    _controller.text = '$base, $instruction';
    await _findFromPrompt();
  }

  void _openMoodBrowser() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0E0716),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Browse by mood', style: Theme.of(sheetContext).textTheme.headlineSmall),
              const SizedBox(height: 8),
              const Text('Choose the feeling first. Your written request is not used in this mode.'),
              const SizedBox(height: 18),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: moods.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.22,
                ),
                itemBuilder: (context, index) {
                  final mood = moods[index];
                  return InkWell(
                    borderRadius: BorderRadius.circular(22),
                    onTap: _loading ? null : () => _browseMood(mood),
                    child: Ink(
                      padding: const EdgeInsets.all(17),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(22),
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            const Color(0xFF2B0B51),
                            index.isEven ? const Color(0xFF160927) : const Color(0xFF25093B),
                          ],
                        ),
                        border: Border.all(color: const Color(0xFF8125E8).withValues(alpha: 0.55)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 42,
                            height: 42,
                            decoration: BoxDecoration(
                              color: const Color(0xFF8125E8).withValues(alpha: 0.22),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Icon(mood.icon, color: const Color(0xFFD7B8FF)),
                          ),
                          const Spacer(),
                          Text(mood.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                          const SizedBox(height: 4),
                          Text(mood.subtitle, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: Color(0xFFB8AFC2), height: 1.25)),
                        ],
                      ),
                    ),
                  );
                },
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
      isScrollControlled: true,
      builder: (sheetContext) => SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(20, 4, 20, 28 + MediaQuery.viewInsetsOf(sheetContext).bottom),
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
                _ConciergePanel(languageCode: widget.languageCode),
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
                      backgroundColor: const Color(0xFF8125E8),
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
                      colors: [Color(0xFF2B0B51), Color(0xFF160927)],
                    ),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: const Color(0xFF8125E8)),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 12,
                    ),
                    leading: const CircleAvatar(
                      backgroundColor: Color(0xFFB34CFF),
                      child: Icon(Icons.theater_comedy_outlined, color: Color(0xFFF7F5FB)),
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
                  const SizedBox(height: 26),
                  const _ResultsSkeleton(),
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
                                  : "Here's what I understood",
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
                if (_resultMode == 'prompt' && _results.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      const Text('Not quite?', style: TextStyle(fontWeight: FontWeight.w800)),
                      const SizedBox(width: 8),
                      Text('Refine without starting over', style: Theme.of(context).textTheme.bodyMedium),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      ActionChip(label: const Text('Funnier'), onPressed: _loading ? null : () => _refinePrompt('make it funnier')),
                      ActionChip(label: const Text('Less dark'), onPressed: _loading ? null : () => _refinePrompt('less dark and nothing bleak')),
                      ActionChip(label: const Text('Shorter'), onPressed: _loading ? null : () => _refinePrompt('short episodes, under 35 minutes')),
                      ActionChip(label: const Text('More gripping'), onPressed: _loading ? null : () => _refinePrompt('more gripping and suspenseful')),
                    ],
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
                  Wrap(
                    spacing: 12,
                    runSpacing: 6,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    alignment: WrapAlignment.spaceBetween,
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
                  const SizedBox(height: 8),
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'For Flick Sakes... pick one.',
                      style: TextStyle(
                        color: Color(0xFFD7B8FF),
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  ..._results.take(_visibleResultCount).map(
                    (show) => Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: ResultCard(
                        show: show,
                        region: widget.region,
                        saved: widget.saved.contains(show.id),
                        onToggleSaved: () => widget.onToggleSaved(show.id),
                        onFeedback: (reason) => widget.onFeedback(show.id, reason),
                      ),
                    ),
                  ),
                  if (_results.length > _visibleResultCount) ...[
                    const SizedBox(height: 4),
                    FilledButton.icon(
                      onPressed: () => setState(() => _visibleResultCount = (_visibleResultCount + 5).clamp(0, _results.length)),
                      icon: const Icon(Icons.add_rounded),
                      label: Text('Show ${(_results.length - _visibleResultCount).clamp(0, 5)} more options'),
                    ),
                    const SizedBox(height: 10),
                  ],
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

class _ResultsSkeleton extends StatelessWidget {
  const _ResultsSkeleton();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(
        3,
        (index) => Container(
          margin: const EdgeInsets.only(bottom: 14),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF12091B),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFF2A153A)),
          ),
          child: Row(
            children: [
              Container(width: 104, height: 150, decoration: BoxDecoration(color: const Color(0xFF24142F), borderRadius: BorderRadius.circular(16))),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(height: 19, width: double.infinity, decoration: BoxDecoration(color: const Color(0xFF291735), borderRadius: BorderRadius.circular(8))),
                    const SizedBox(height: 12),
                    Container(height: 13, width: 130, decoration: BoxDecoration(color: const Color(0xFF21132B), borderRadius: BorderRadius.circular(8))),
                    const SizedBox(height: 20),
                    Container(height: 12, width: double.infinity, decoration: BoxDecoration(color: const Color(0xFF21132B), borderRadius: BorderRadius.circular(8))),
                    const SizedBox(height: 8),
                    Container(height: 12, width: 180, decoration: BoxDecoration(color: const Color(0xFF21132B), borderRadius: BorderRadius.circular(8))),
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
        Expanded(
          child: Image.asset(
            'assets/brand/forflicksakes_logo_wide.png',
            height: 48,
            alignment: Alignment.centerLeft,
            fit: BoxFit.contain,
          ),
        ),
        const SizedBox(width: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          decoration: BoxDecoration(
            color: const Color(0xFF1B0733),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: const Color(0xFF8125E8)),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.cloud_done_outlined,
                size: 16,
                color: Color(0xFFD7B8FF),
              ),
              SizedBox(width: 5),
              Text(
                'LIVE',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.1,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ConciergePanel extends StatelessWidget {
  const _ConciergePanel({required this.languageCode});
  final String languageCode;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(26, 28, 26, 26),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: const Color(0xFF8125E8).withValues(alpha: 0.65)),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF2B0B51), Color(0xFF160927), Color(0xFF050309)],
        ),
        boxShadow: const [
          BoxShadow(color: Color(0x338125E8), blurRadius: 30, offset: Offset(0, 14)),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -28,
            bottom: -28,
            child: Opacity(
              opacity: 0.11,
              child: Image.asset('assets/brand/ffs_icon.png', width: 190, height: 190),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.auto_awesome_rounded, color: Color(0xFFD7B8FF)),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'YOUR WATCH CONCIERGE',
                      style: TextStyle(
                        color: Color(0xFFD7B8FF),
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.8,
                      ),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 18),
              Text(
                'FOR FLICK SAKES.',
                style: TextStyle(
                  color: Color(0xFFD7B8FF),
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.4,
                ),
              ),
              SizedBox(height: 12),
              Text(
                'Stop scrolling.\nStart watching.',
                style: TextStyle(
                  fontSize: 38,
                  height: 1.08,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -1.35,
                  color: Color(0xFFF7F5FB),
                ),
              ),
              SizedBox(height: 18),
              Text(
                'Browse a mood for instant inspiration, or describe your perfect watch for precise, explainable picks.',
                style: TextStyle(color: Color(0xFFC9BED5), fontSize: 16, height: 1.45),
              ),
            ],
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
    required this.onFeedback,
    super.key,
  });

  final ShowItem show;
  final String region;
  final bool saved;
  final VoidCallback onToggleSaved;
  final Future<void> Function(String reason) onFeedback;

  @override
  Widget build(BuildContext context) {
    final reasons = show.matchReasons.take(3).toList();
    return Hero(
      tag: 'show-${show.id}',
      child: Material(
        color: const Color(0xFF100817),
        borderRadius: BorderRadius.circular(26),
        child: InkWell(
          borderRadius: BorderRadius.circular(26),
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => ShowDetailPage(
                show: show,
                region: region,
                saved: saved,
                onToggleSaved: onToggleSaved,
                onLocalFeedback: onFeedback,
              ),
            ),
          ),
          child: Container(
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(26),
              border: Border.all(color: const Color(0xFF2C153D)),
              boxShadow: const [BoxShadow(color: Color(0x22000000), blurRadius: 18, offset: Offset(0, 10))],
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _Poster(url: show.poster, width: 120, height: 178),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(child: Text(show.title, style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w900, height: 1.12))),
                          IconButton(onPressed: onToggleSaved, visualDensity: VisualDensity.compact, icon: Icon(saved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded)),
                        ],
                      ),
                      const SizedBox(height: 5),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          if (show.confidence > 0)
                            _MetaPill(icon: Icons.auto_awesome_rounded, label: '${show.confidence}% match', accent: true),
                          if (show.rating > 0)
                            _MetaPill(icon: Icons.star_rounded, label: '${show.rating}'),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text([
                        if (show.year > 0) '${show.year}',
                        if (show.seasons > 0) '${show.seasons} seasons',
                        if (show.runtime > 0) '${show.runtime} min',
                      ].join(' · '), style: const TextStyle(color: Color(0xFF9F94A8), fontSize: 13)),
                      if (reasons.isNotEmpty) ...[
                        const SizedBox(height: 13),
                        const Text('WHY IT MATCHES', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.2, color: Color(0xFFD7B8FF))),
                        const SizedBox(height: 7),
                        for (final reason in reasons)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(Icons.check_circle_rounded, size: 15, color: Color(0xFFB34CFF)),
                                const SizedBox(width: 6),
                                Expanded(child: Text(reason, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: Color(0xFFC5BBCB)))),
                              ],
                            ),
                          ),
                      ] else ...[
                        const SizedBox(height: 12),
                        Text(show.summary, maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFFAAA0B0), height: 1.4, fontSize: 13)),
                      ],
                      const SizedBox(height: 8),
                      const Row(
                        children: [
                          Text('View details', style: TextStyle(color: Color(0xFFD7B8FF), fontWeight: FontWeight.w800)),
                          SizedBox(width: 4),
                          Icon(Icons.arrow_forward_rounded, size: 17, color: Color(0xFFD7B8FF)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MetaPill extends StatelessWidget {
  const _MetaPill({required this.icon, required this.label, this.accent = false});
  final IconData icon;
  final String label;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
        color: accent ? const Color(0xFF8125E8).withValues(alpha: 0.20) : const Color(0xFF1B1023),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: accent ? const Color(0xFF8125E8) : const Color(0xFF33203E)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 14, color: accent ? const Color(0xFFD7B8FF) : const Color(0xFFFFCC5C)), const SizedBox(width: 4), Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800))]),
    );
  }
}

class ShowDetailPage extends StatefulWidget {
  const ShowDetailPage({
    required this.show,
    required this.region,
    required this.saved,
    required this.onToggleSaved,
    required this.onLocalFeedback,
    super.key,
  });

  final ShowItem show;
  final String region;
  final bool saved;
  final VoidCallback onToggleSaved;
  final Future<void> Function(String reason) onLocalFeedback;

  @override
  State<ShowDetailPage> createState() => _ShowDetailPageState();
}

class _ShowDetailPageState extends State<ShowDetailPage> {
  final ApiService _api = ApiService();
  late bool _saved = widget.saved;
  WatchOptions? _options;
  ShowDetails? _details;
  bool _loadingOptions = true;
  bool _loadingDetails = true;
  String? _optionsError;
  String? _detailsError;
  List<ShowItem> _vibeResults = const <ShowItem>[];
  bool _loadingVibe = false;
  String _vibeMode = 'same';
  String? _vibeError;

  @override
  void initState() {
    super.initState();
    _loadOptions();
    _loadDetails();
  }

  Future<void> _sendShowFeedback(String reason) async {
    try {
      await widget.onLocalFeedback(reason);
      await _api.sendFeedback(type: 'show', reason: reason, showId: widget.show.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Saved: $reason')));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Feedback could not be saved.')));
    }
  }

  Future<void> _loadDetails() async {
    setState(() {
      _loadingDetails = true;
      _detailsError = null;
    });
    try {
      final details = await _api.showDetails(showId: widget.show.id);
      if (!mounted) return;
      setState(() {
        _details = details;
        _loadingDetails = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadingDetails = false;
        _detailsError = 'Extra show details could not be loaded.';
      });
    }
  }

  Future<void> _loadOptions() async {
    setState(() {
      _loadingOptions = true;
      _optionsError = null;
    });
    try {
      final options = await _api.watchOptions(showId: widget.show.id, region: widget.region);
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

  Future<void> _continueVibe(String mode) async {
    setState(() {
      _loadingVibe = true;
      _vibeMode = mode;
      _vibeError = null;
    });
    try {
      final result = await _api.continueTheVibe(
        title: widget.show.title,
        refinement: mode,
        region: widget.region,
      );
      if (!mounted) return;
      setState(() {
        _vibeResults = result.shows.where((item) => item.id != widget.show.id).take(5).toList();
        _loadingVibe = false;
        if (_vibeResults.isEmpty) _vibeError = 'No strong matches found for this direction.';
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loadingVibe = false;
        _vibeError = error.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  void _openVibeShow(ShowItem show) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ShowDetailPage(
          show: show,
          region: widget.region,
          saved: false,
          onToggleSaved: () {},
          onLocalFeedback: (_) async {},
        ),
      ),
    );
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
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${provider.name} could not be opened.')));
  }

  Future<void> _shareShow(BuildContext shareContext) async {
    final show = widget.show;
    final details = <String>[
      'For Flick Sakes... ${show.title} looks worth watching.',
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
        sharePositionOrigin: box == null ? null : box.localToGlobal(Offset.zero) & box.size,
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

  Map<String, List<WatchProvider>> _providerGroups(List<WatchProvider> providers) {
    final groups = <String, List<WatchProvider>>{};
    for (final provider in providers) {
      final raw = provider.type.toLowerCase();
      final label = raw.contains('free')
          ? 'Free'
          : raw.contains('rent')
              ? 'Rent'
              : raw.contains('buy') || raw.contains('purchase')
                  ? 'Buy'
                  : 'Stream';
      groups.putIfAbsent(label, () => <WatchProvider>[]).add(provider);
    }
    return groups;
  }

  Widget _sectionTitle(BuildContext context, String title, {String? subtitle}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleLarge),
        if (subtitle != null) ...[
          const SizedBox(height: 6),
          Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final show = widget.show;
    final details = _details;
    final providerGroups = _options == null ? <String, List<WatchProvider>>{} : _providerGroups(_options!.providers);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 390,
            backgroundColor: const Color(0xFF050309),
            actions: [
              Builder(
                builder: (shareContext) => IconButton(
                  tooltip: 'Share this series',
                  onPressed: () => _shareShow(shareContext),
                  icon: const Icon(Icons.ios_share_rounded),
                ),
              ),
              IconButton(
                tooltip: _saved ? 'Remove from watchlist' : 'Save to watchlist',
                onPressed: () {
                  widget.onToggleSaved();
                  setState(() => _saved = !_saved);
                },
                icon: Icon(_saved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    show.poster,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const ColoredBox(color: Color(0xFF160927)),
                  ),
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Color(0x22050309), Color(0x88050309), Color(0xFF050309)],
                        stops: [0.25, 0.68, 1],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(24, 4, 24, 48),
            sliver: SliverList.list(
              children: [
                const Text(
                  'FOR FLICK SAKES... THIS ONE MIGHT BE IT.',
                  style: TextStyle(color: Color(0xFFD7B8FF), fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.25),
                ),
                const SizedBox(height: 10),
                Text(show.title, style: Theme.of(context).textTheme.headlineLarge),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if (show.confidence > 0) _MetaPill(icon: Icons.auto_awesome_rounded, label: '${show.confidence}% match', accent: true),
                    if (show.rating > 0) _MetaPill(icon: Icons.star_rounded, label: '${show.rating}/10'),
                    if (show.status.isNotEmpty) _MetaPill(icon: Icons.flag_outlined, label: show.status),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  [
                    if (show.year > 0) '${show.year}',
                    if (show.seasons > 0) '${show.seasons} seasons',
                    if (show.runtime > 0) '${show.runtime} min episodes',
                    if (details != null && details.episodeCount > 0) '${details.episodeCount} episodes',
                  ].join(' · '),
                  style: const TextStyle(color: Color(0xFFAAA0B0), fontSize: 14),
                ),
                if (details != null && (details.network.isNotEmpty || details.language.isNotEmpty || details.type.isNotEmpty)) ...[
                  const SizedBox(height: 9),
                  Text(
                    [details.network, details.language, details.type].where((item) => item.isNotEmpty).join(' · '),
                    style: const TextStyle(color: Color(0xFF857E8D), fontSize: 13),
                  ),
                ],
                const SizedBox(height: 18),
                Wrap(spacing: 8, runSpacing: 8, children: show.genres.map((genre) => Chip(label: Text(genre))).toList()),
                const SizedBox(height: 26),
                Row(
                  children: [
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: () {
                          widget.onToggleSaved();
                          setState(() => _saved = !_saved);
                        },
                        icon: Icon(_saved ? Icons.bookmark_rounded : Icons.bookmark_add_outlined),
                        label: Text(_saved ? 'Saved' : 'Save'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Builder(
                        builder: (shareContext) => OutlinedButton.icon(
                          onPressed: () => _shareShow(shareContext),
                          icon: const Icon(Icons.share_outlined),
                          label: const Text('Share'),
                        ),
                      ),
                    ),
                  ],
                ),
                if (show.matchReasons.isNotEmpty) ...[
                  const SizedBox(height: 34),
                  _sectionTitle(context, 'Why this matched', subtitle: 'The evidence behind this recommendation.'),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: const Color(0xFF12091B),
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: const Color(0xFF321747)),
                    ),
                    child: Column(
                      children: show.matchReasons.map((reason) => Padding(
                        padding: const EdgeInsets.only(bottom: 9),
                        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          const Icon(Icons.check_circle_rounded, color: Color(0xFFB34CFF), size: 19),
                          const SizedBox(width: 9),
                          Expanded(child: Text(reason)),
                        ]),
                      )).toList(),
                    ),
                  ),
                ],
                const SizedBox(height: 34),
                _sectionTitle(context, 'About'),
                const SizedBox(height: 12),
                Text(show.summary, style: Theme.of(context).textTheme.bodyLarge),
                if (_loadingDetails) ...[
                  const SizedBox(height: 28),
                  const LinearProgressIndicator(),
                ] else if (_detailsError != null) ...[
                  const SizedBox(height: 20),
                  Text(_detailsError!, style: const TextStyle(color: Color(0xFF8F8697))),
                ] else if (details != null && details.cast.isNotEmpty) ...[
                  const SizedBox(height: 34),
                  _sectionTitle(context, 'Cast', subtitle: 'Main cast from TVMaze.'),
                  const SizedBox(height: 14),
                  SizedBox(
                    height: 150,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: details.cast.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 12),
                      itemBuilder: (context, index) {
                        final member = details.cast[index];
                        return SizedBox(
                          width: 92,
                          child: Column(
                            children: [
                              CircleAvatar(
                                radius: 38,
                                backgroundColor: const Color(0xFF24142F),
                                backgroundImage: member.imageUrl.isEmpty ? null : NetworkImage(member.imageUrl),
                                child: member.imageUrl.isEmpty ? const Icon(Icons.person_outline_rounded) : null,
                              ),
                              const SizedBox(height: 8),
                              Text(member.name, maxLines: 1, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                              if (member.character.isNotEmpty)
                                Text(member.character, maxLines: 1, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center, style: const TextStyle(fontSize: 10, color: Color(0xFF8F8697))),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
                const SizedBox(height: 34),
                _sectionTitle(
                  context,
                  'Continue the vibe',
                  subtitle: 'Use ${show.title} as the reference point, then steer the next picks.',
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ChoiceChip(label: const Text('More like this'), selected: _vibeMode == 'same' && _vibeResults.isNotEmpty, onSelected: (_) => _continueVibe('same')),
                    ChoiceChip(label: const Text('Lighter'), selected: _vibeMode == 'lighter' && _vibeResults.isNotEmpty, onSelected: (_) => _continueVibe('lighter')),
                    ChoiceChip(label: const Text('More gripping'), selected: _vibeMode == 'gripping' && _vibeResults.isNotEmpty, onSelected: (_) => _continueVibe('gripping')),
                    ChoiceChip(label: const Text('Shorter'), selected: _vibeMode == 'shorter' && _vibeResults.isNotEmpty, onSelected: (_) => _continueVibe('shorter')),
                    ChoiceChip(label: const Text('Funnier'), selected: _vibeMode == 'funny' && _vibeResults.isNotEmpty, onSelected: (_) => _continueVibe('funny')),
                  ],
                ),
                if (_loadingVibe) ...[
                  const SizedBox(height: 18),
                  const LinearProgressIndicator(),
                ] else if (_vibeError != null) ...[
                  const SizedBox(height: 14),
                  Text(_vibeError!, style: const TextStyle(color: Color(0xFF9F94A8))),
                ] else if (_vibeResults.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 250,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _vibeResults.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 12),
                      itemBuilder: (context, index) {
                        final item = _vibeResults[index];
                        return SizedBox(
                          width: 145,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(18),
                            onTap: () => _openVibeShow(item),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _Poster(url: item.poster, width: 145, height: 190),
                                const SizedBox(height: 8),
                                Text(item.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w900)),
                                if (item.matchReasons.isNotEmpty)
                                  Text(item.matchReasons.first, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, color: Color(0xFF9F94A8))),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
                const SizedBox(height: 30),
                _sectionTitle(context, 'Help improve your picks'),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final option in const <String>['Loved it', 'Not interested', 'Already watched', 'Wrong genre', 'Too dark', 'Too slow', 'Wrong service'])
                      ActionChip(label: Text(option), onPressed: () => _sendShowFeedback(option)),
                  ],
                ),
                const SizedBox(height: 34),
                Row(
                  children: [
                    Expanded(child: _sectionTitle(context, 'Where to watch', subtitle: 'Availability for ${widget.region}. Tap a service to open it.')),
                    IconButton(tooltip: 'Refresh availability', onPressed: _loadingOptions ? null : _loadOptions, icon: const Icon(Icons.refresh_rounded)),
                  ],
                ),
                const SizedBox(height: 14),
                if (_loadingOptions)
                  const Padding(padding: EdgeInsets.symmetric(vertical: 24), child: Center(child: CircularProgressIndicator()))
                else if (_optionsError != null)
                  _AvailabilityMessage(icon: Icons.cloud_off_rounded, message: _optionsError!, actionLabel: 'Try again', onAction: _loadOptions)
                else if (_options == null || _options!.providers.isEmpty)
                  _AvailabilityMessage(icon: Icons.tv_off_outlined, message: _options?.message ?? 'No verified streaming services are available for this region.', actionLabel: 'Refresh', onAction: _loadOptions)
                else
                  for (final entry in providerGroups.entries) ...[
                    Padding(
                      padding: const EdgeInsets.only(top: 10, bottom: 8),
                      child: Text(entry.key.toUpperCase(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.2, color: Color(0xFFD7B8FF))),
                    ),
                    ...entry.value.map((provider) => Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: const Color(0xFF2A2340),
                          child: Text(provider.name.isEmpty ? '?' : provider.name.characters.first.toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900)),
                        ),
                        title: Text(provider.name),
                        subtitle: Text(_providerSubtitle(provider)),
                        trailing: const Icon(Icons.open_in_new_rounded),
                        onTap: () => _openProvider(provider),
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


class ForYouPage extends StatefulWidget {
  const ForYouPage({
    required this.languageCode,
    required this.saved,
    required this.watched,
    required this.dismissed,
    required this.knownShows,
    required this.region,
    required this.services,
    required this.maxSeasons,
    required this.completedOnly,
    required this.onToggleSaved,
    required this.onFeedback,
    required this.onShowsSeen,
    super.key,
  });

  final String languageCode;
  final Set<int> saved;
  final Set<int> watched;
  final Set<int> dismissed;
  final Map<int, ShowItem> knownShows;
  final String region;
  final Set<String> services;
  final int maxSeasons;
  final bool completedOnly;
  final ValueChanged<int> onToggleSaved;
  final Future<void> Function(int showId, String reason) onFeedback;
  final Future<void> Function(Iterable<ShowItem> shows) onShowsSeen;

  @override
  State<ForYouPage> createState() => _ForYouPageState();
}

class _ForYouPageState extends State<ForYouPage> {
  final ApiService _api = ApiService();
  bool _loading = false;
  String? _error;
  List<_ForYouSection> _sections = const <_ForYouSection>[];
  String _signature = '';

  String get _currentSignature {
    final saved = widget.saved.toList()..sort();
    final watched = widget.watched.toList()..sort();
    final dismissed = widget.dismissed.toList()..sort();
    return '${saved.join(',')}|${watched.join(',')}|${dismissed.join(',')}|${widget.region}|${widget.maxSeasons}|${widget.completedOnly}';
  }

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(_refresh);
  }

  @override
  void didUpdateWidget(covariant ForYouPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (_currentSignature != _signature && !_loading) {
      Future<void>.microtask(_refresh);
    }
  }

  List<ShowItem> get _positiveShows {
    final ids = <int>{...widget.saved, ...widget.watched};
    return ids.map((id) => widget.knownShows[id]).whereType<ShowItem>().toList();
  }

  Future<RecommendationResult> _recommend(String query, Set<int> excluded) {
    return _api.recommendFromPrompt(
      query: query,
      region: widget.region,
      services: widget.services,
      maxSeasons: widget.maxSeasons,
      completedOnly: widget.completedOnly,
      excludedIds: excluded,
    );
  }

  Future<void> _refresh() async {
    final signature = _currentSignature;
    final positives = _positiveShows;
    if (positives.isEmpty) {
      if (!mounted) return;
      setState(() {
        _signature = signature;
        _sections = const <_ForYouSection>[];
        _loading = false;
        _error = null;
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final excluded = <int>{...widget.dismissed, ...widget.watched};
      final anchor = positives.firstWhere(
        (show) => widget.saved.contains(show.id),
        orElse: () => positives.first,
      );

      final genreCounts = <String, int>{};
      for (final show in positives) {
        for (final genre in show.genres) {
          genreCounts[genre] = (genreCounts[genre] ?? 0) + 1;
        }
      }
      final topGenres = genreCounts.entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value));
      final genreNames = topGenres.take(2).map((entry) => entry.key).toList();

      final futures = <Future<RecommendationResult>>[
        _recommend('Something like ${anchor.title}', excluded),
        if (genreNames.isNotEmpty)
          _recommend('A really good ${genreNames.join(' ')} series', excluded),
        _recommend('Something easy to watch with episodes under 40 minutes', excluded),
      ];
      final results = await Future.wait(futures);

      final sections = <_ForYouSection>[
        _ForYouSection(
          title: 'Because you ${widget.saved.contains(anchor.id) ? 'saved' : 'watched'} ${anchor.title}',
          subtitle: 'Using a show you chose as the reference point.',
          shows: results[0].shows.where((show) => show.id != anchor.id && !excluded.contains(show.id)).take(6).toList(),
        ),
      ];
      var resultIndex = 1;
      if (genreNames.isNotEmpty) {
        sections.add(_ForYouSection(
          title: 'Your kind of ${genreNames.first.toLowerCase()}',
          subtitle: 'Based on genres that appear in your saved and watched titles.',
          shows: results[resultIndex++].shows.where((show) => !excluded.contains(show.id)).take(6).toList(),
        ));
      }
      sections.add(_ForYouSection(
        title: 'Easy watches tonight',
        subtitle: 'Shorter episodes, filtered through your normal profile settings.',
        shows: results[resultIndex].shows.where((show) => !excluded.contains(show.id)).take(6).toList(),
      ));

      final allShows = sections.expand((section) => section.shows);
      await widget.onShowsSeen(allShows);

      if (!mounted) return;
      setState(() {
        _signature = signature;
        _sections = sections.where((section) => section.shows.isNotEmpty).toList();
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _signature = signature;
        _loading = false;
        _error = 'Oops, looks like something went wrong. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final positives = _positiveShows;
    return SafeArea(
      child: RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 120),
          children: [
            Text(_t(widget.languageCode, 'forYou'), style: Theme.of(context).textTheme.headlineLarge),
            const SizedBox(height: 8),
            Text(
              _t(widget.languageCode, 'forYouTag'),
              style: TextStyle(color: Color(0xFFD7B8FF), fontSize: 16, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 10),
            const Text(
              'These picks use choices you have actually made in ForFlickSakes. Pull down any time to refresh them.',
            ),
            const SizedBox(height: 26),
            if (positives.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFF100817),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFF2C153D)),
                ),
                child: const Column(
                  children: [
                    Icon(Icons.favorite_outline_rounded, size: 46, color: Color(0xFFD7B8FF)),
                    SizedBox(height: 14),
                    Text('Teach us your taste.', style: TextStyle(fontSize: 21, fontWeight: FontWeight.w900)),
                    SizedBox(height: 8),
                    Text(
                      'Save a show, mark something as watched, or tell us you loved it. Your personalised picks will build from those real signals.',
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              )
            else if (_loading && _sections.isEmpty)
              const Padding(
                padding: EdgeInsets.only(top: 50),
                child: Column(
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 18),
                    Text('Learning the shape of your watchlist...'),
                  ],
                ),
              )
            else if (_error != null && _sections.isEmpty)
              _ForYouError(message: _error!, onRetry: _refresh)
            else ...[
              for (final section in _sections) ...[
                _ForYouSectionView(
                  section: section,
                  region: widget.region,
                  saved: widget.saved,
                  onToggleSaved: widget.onToggleSaved,
                  onFeedback: widget.onFeedback,
                ),
                const SizedBox(height: 30),
              ],
              if (_loading) const LinearProgressIndicator(),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: Color(0xFF9F94A8))),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

class _ForYouSection {
  const _ForYouSection({
    required this.title,
    required this.subtitle,
    required this.shows,
  });
  final String title;
  final String subtitle;
  final List<ShowItem> shows;
}

class _ForYouSectionView extends StatelessWidget {
  const _ForYouSectionView({
    required this.section,
    required this.region,
    required this.saved,
    required this.onToggleSaved,
    required this.onFeedback,
  });
  final _ForYouSection section;
  final String region;
  final Set<int> saved;
  final ValueChanged<int> onToggleSaved;
  final Future<void> Function(int showId, String reason) onFeedback;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(section.title, style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 5),
        Text(section.subtitle, style: const TextStyle(color: Color(0xFF9F94A8))),
        const SizedBox(height: 14),
        for (final show in section.shows.take(3)) ...[
          ResultCard(
            show: show,
            region: region,
            saved: saved.contains(show.id),
            onToggleSaved: () => onToggleSaved(show.id),
            onFeedback: (reason) => onFeedback(show.id, reason),
          ),
          const SizedBox(height: 14),
        ],
      ],
    );
  }
}

class _ForYouError extends StatelessWidget {
  const _ForYouError({required this.message, required this.onRetry});
  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: const Color(0xFF100817),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFF2C153D)),
      ),
      child: Column(
        children: [
          const Icon(Icons.cloud_off_outlined, size: 40),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => onRetry(),
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Try again'),
          ),
        ],
      ),
    );
  }
}

class WatchlistPage extends StatelessWidget {
  const WatchlistPage({
    required this.languageCode,
    required this.saved,
    required this.knownShows,
    required this.region,
    required this.onToggleSaved,
    required this.onFeedback,
    super.key,
  });

  final String languageCode;
  final Set<int> saved;
  final Map<int, ShowItem> knownShows;
  final String region;
  final ValueChanged<int> onToggleSaved;
  final Future<void> Function(int showId, String reason) onFeedback;

  @override
  Widget build(BuildContext context) {
    final shows = saved.map((id) => knownShows[id]).whereType<ShowItem>().toList()
      ..sort((a, b) => a.title.compareTo(b.title));

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 110),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_t(languageCode, 'watchlist'), style: Theme.of(context).textTheme.headlineLarge),
            const SizedBox(height: 10),
            Text(saved.isEmpty ? 'Save a recommendation and it will appear here.' : '${saved.length} saved ${saved.length == 1 ? 'title' : 'titles'}'),
            const SizedBox(height: 22),
            if (saved.isEmpty)
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.bookmark_border_rounded, size: 52, color: Color(0xFFD7B8FF)),
                      SizedBox(height: 14),
                      Text(_t(languageCode, 'watchlistEmpty'), style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800), textAlign: TextAlign.center),
                      SizedBox(height: 8),
                      Text('Save picks from Discover to keep them here.', textAlign: TextAlign.center),
                    ],
                  ),
                ),
              )
            else if (shows.isEmpty)
              const Expanded(
                child: Center(
                  child: Text('Your saved titles are preserved. Open Discover once while online to refresh their details.', textAlign: TextAlign.center),
                ),
              )
            else
              Expanded(
                child: ListView.separated(
                  itemCount: shows.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 14),
                  itemBuilder: (context, index) {
                    final show = shows[index];
                    return ResultCard(
                      show: show,
                      region: region,
                      saved: true,
                      onToggleSaved: () => onToggleSaved(show.id),
                      onFeedback: (reason) => onFeedback(show.id, reason),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class ProfilePage extends StatelessWidget {
  const ProfilePage({
    required this.languageCode,
    required this.onLanguageChanged,
    required this.region,
    required this.services,
    required this.maxSeasons,
    required this.completedOnly,
    required this.watchedCount,
    required this.dismissedCount,
    required this.dismissedIds,
    required this.knownShows,
    required this.feedbackCounts,
    required this.onRegionChanged,
    required this.onServicesChanged,
    required this.onMaxSeasonsChanged,
    required this.onCompletedOnlyChanged,
    required this.onRestoreDismissed,
    required this.onReset,
    super.key,
  });

  final String languageCode;
  final ValueChanged<String> onLanguageChanged;
  final String region;
  final Set<String> services;
  final int maxSeasons;
  final bool completedOnly;
  final int watchedCount;
  final int dismissedCount;
  final Set<int> dismissedIds;
  final Map<int, ShowItem> knownShows;
  final Map<String, int> feedbackCounts;
  final ValueChanged<String> onRegionChanged;
  final ValueChanged<Set<String>> onServicesChanged;
  final ValueChanged<int> onMaxSeasonsChanged;
  final ValueChanged<bool> onCompletedOnlyChanged;
  final Future<void> Function(int id) onRestoreDismissed;
  final Future<void> Function() onReset;

  static const serviceOptions = <String>[
    'Netflix', 'Prime Video', 'Apple TV+', 'Disney+', 'HBO Max', 'Showmax', 'DStv Stream',
  ];

  static const regions = <String, String>{
    'ZA': 'South Africa', 'PT': 'Portugal', 'GB': 'United Kingdom', 'US': 'United States',
    'IE': 'Ireland', 'ES': 'Spain', 'FR': 'France', 'DE': 'Germany', 'AU': 'Australia', 'NZ': 'New Zealand',
  };

  @override
  Widget build(BuildContext context) {
    final topFeedback = feedbackCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 110),
        children: [
          Text(_t(languageCode, 'profileTitle'), style: Theme.of(context).textTheme.headlineLarge),
          const SizedBox(height: 8),
          const Text('Your choices now stay on this device and shape future recommendations.'),
          const SizedBox(height: 24),
          Row(children: [
            Expanded(child: _TasteStat(label: 'Watched', value: '$watchedCount', icon: Icons.visibility_rounded)),
            const SizedBox(width: 12),
            Expanded(child: _TasteStat(label: 'Dismissed', value: '$dismissedCount', icon: Icons.hide_source_rounded)),
          ]),
          if (topFeedback.isNotEmpty) ...[
            const SizedBox(height: 24),
            Text('What we have learned', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: topFeedback.take(5).map((entry) => Chip(label: Text('${entry.key} · ${entry.value}'))).toList(),
            ),
          ],
          const SizedBox(height: 30),
          Text(_t(languageCode, 'language'), style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: languageCode,
            decoration: const InputDecoration(
              filled: true,
              fillColor: Color(0xFF15111D),
              prefixIcon: Icon(Icons.translate_rounded),
            ),
            items: _ffsLanguages.entries
                .map((entry) => DropdownMenuItem<String>(
                      value: entry.key,
                      child: Text(entry.value),
                    ))
                .toList(),
            onChanged: (value) {
              if (value != null) onLanguageChanged(value);
            },
          ),
          const SizedBox(height: 30),
          Text(_t(languageCode, 'streamingRegion'), style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: region,
            decoration: const InputDecoration(filled: true, fillColor: Color(0xFF15111D), prefixIcon: Icon(Icons.public_rounded)),
            items: regions.entries.map((entry) => DropdownMenuItem(value: entry.key, child: Text(entry.value))).toList(),
            onChanged: (value) { if (value != null) onRegionChanged(value); },
          ),
          const SizedBox(height: 30),
          Text(_t(languageCode, 'streamingServices'), style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          const Text('These choices are saved across restarts.'),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 12,
            children: serviceOptions.map((service) {
              final selected = services.contains(service);
              return FilterChip(
                selected: selected,
                label: Text(service),
                selectedColor: const Color(0xFF4FD5CB),
                labelStyle: TextStyle(color: selected ? const Color(0xFF091310) : Colors.white),
                onSelected: (_) {
                  final updated = {...services};
                  if (!updated.add(service)) updated.remove(service);
                  onServicesChanged(updated);
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 30),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            value: completedOnly,
            title: const Text('Completed shows only'),
            subtitle: const Text('Apply this preference automatically to prompt and mood recommendations.'),
            onChanged: onCompletedOnlyChanged,
          ),
          const Divider(height: 42),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.hide_source_rounded),
            title: const Text('Not interested'),
            subtitle: Text(dismissedIds.isEmpty
                ? 'No dismissed titles.'
                : '${dismissedIds.length} dismissed title${dismissedIds.length == 1 ? '' : 's'}. Tap to review or restore.'),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: dismissedIds.isEmpty ? null : () {
              showModalBottomSheet<void>(
                context: context,
                isScrollControlled: true,
                showDragHandle: true,
                backgroundColor: const Color(0xFF15111D),
                builder: (sheetContext) => SafeArea(
                  child: SizedBox(
                    height: MediaQuery.sizeOf(sheetContext).height * 0.7,
                    child: ListView(
                      padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                      children: [
                        Text('Not interested', style: Theme.of(sheetContext).textTheme.headlineSmall),
                        const SizedBox(height: 6),
                        const Text('These titles are excluded from future recommendations. Restore one if you dismissed it by mistake.'),
                        const SizedBox(height: 12),
                        for (final id in dismissedIds)
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(knownShows[id]?.title ?? 'Title #$id'),
                            trailing: TextButton(
                              onPressed: () async {
                                await onRestoreDismissed(id);
                                if (sheetContext.mounted) Navigator.pop(sheetContext);
                              },
                              child: const Text('Restore'),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
          const ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(Icons.info_outline_rounded),
            title: Text('Data sources & terms'),
            subtitle: Text('Catalogue data is provided by TVMaze. Streaming availability uses Streaming Availability API (Movie of the Night). Availability can vary by region and provider.'),
          ),
          const Divider(height: 42),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.restart_alt_rounded),
            title: Text(_t(languageCode, 'reset')),
            subtitle: const Text('Clear saved preferences, learning, watch history and local watchlist.'),
            onTap: () async {
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (dialogContext) => AlertDialog(
                  title: const Text('Reset personalisation?'),
                  content: const Text('This cannot be undone.'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Cancel')),
                    FilledButton(onPressed: () => Navigator.pop(dialogContext, true), child: const Text('Reset')),
                  ],
                ),
              );
              if (confirmed == true) await onReset();
            },
          ),
          const ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(Icons.lock_outline_rounded),
            title: Text('Stored locally'),
            subtitle: Text('Your preferences are saved securely on this device.'),
          ),
        ],
      ),
    );
  }
}

class _TasteStat extends StatelessWidget {
  const _TasteStat({required this.label, required this.value, required this.icon});
  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      color: const Color(0xFF15111D),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: const Color(0xFF2B2633)),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Icon(icon, color: const Color(0xFFD7B8FF)),
      const SizedBox(height: 12),
      Text(value, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900)),
      Text(label, style: const TextStyle(color: Color(0xFF9893A3))),
    ]),
  );
}

