import '../models/show_item.dart';
import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class PersonalizationSnapshot {
  const PersonalizationSnapshot({
    required this.region,
    required this.services,
    required this.maxSeasons,
    required this.completedOnly,
    required this.savedIds,
    required this.dismissedIds,
    required this.watchedIds,
    required this.feedbackCounts,
    required this.knownShows,
    required this.appLanguage,
  });

  final String region;
  final Set<String> services;
  final int maxSeasons;
  final bool completedOnly;
  final Set<int> savedIds;
  final Set<int> dismissedIds;
  final Set<int> watchedIds;
  final Map<String, int> feedbackCounts;
  final Map<int, ShowItem> knownShows;
  final String appLanguage;

  factory PersonalizationSnapshot.defaults() => const PersonalizationSnapshot(
        region: 'ZA',
        services: {'Netflix', 'Prime Video', 'HBO Max', 'Showmax'},
        maxSeasons: 3,
        completedOnly: false,
        savedIds: <int>{},
        dismissedIds: <int>{},
        watchedIds: <int>{},
        feedbackCounts: <String, int>{},
        knownShows: <int, ShowItem>{},
        appLanguage: 'en',
      );
}

class PersonalizationStore {
  static const _regionKey = 'ffs_region';
  static const _servicesKey = 'ffs_services';
  static const _maxSeasonsKey = 'ffs_max_seasons';
  static const _completedOnlyKey = 'ffs_completed_only';
  static const _savedIdsKey = 'ffs_saved_ids';
  static const _dismissedIdsKey = 'ffs_dismissed_ids';
  static const _watchedIdsKey = 'ffs_watched_ids';
  static const _feedbackKey = 'ffs_feedback_counts';
  static const _knownShowsKey = 'ffs_known_shows';
  static const _appLanguageKey = 'ffs_app_language';

  Future<PersonalizationSnapshot> load() async {
    final prefs = await SharedPreferences.getInstance();
    final defaults = PersonalizationSnapshot.defaults();
    return PersonalizationSnapshot(
      region: prefs.getString(_regionKey) ?? defaults.region,
      services: _normalizeServices((prefs.getStringList(_servicesKey) ?? defaults.services.toList()).toSet()),
      maxSeasons: prefs.getInt(_maxSeasonsKey) ?? defaults.maxSeasons,
      completedOnly: prefs.getBool(_completedOnlyKey) ?? defaults.completedOnly,
      savedIds: _decodeIds(prefs.getStringList(_savedIdsKey)),
      dismissedIds: _decodeIds(prefs.getStringList(_dismissedIdsKey)),
      watchedIds: _decodeIds(prefs.getStringList(_watchedIdsKey)),
      feedbackCounts: _decodeFeedback(prefs.getString(_feedbackKey)),
      knownShows: _decodeShows(prefs.getString(_knownShowsKey)),
      appLanguage: prefs.getString(_appLanguageKey) ?? defaults.appLanguage,
    );
  }


  static Set<String> _normalizeServices(Set<String> services) {
    final normalized = <String>{};
    for (final service in services) {
      normalized.add(service == 'Max' ? 'HBO Max' : service);
    }
    return normalized;
  }

  Future<void> savePreferences({
    required String region,
    required Set<String> services,
    required int maxSeasons,
    required bool completedOnly,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await Future.wait([
      prefs.setString(_regionKey, region),
      prefs.setStringList(_servicesKey, _normalizeServices(services).toList()..sort()),
      prefs.setInt(_maxSeasonsKey, maxSeasons),
      prefs.setBool(_completedOnlyKey, completedOnly),
    ]);
  }

  Future<void> saveSavedIds(Set<int> ids) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_savedIdsKey, ids.map((id) => '$id').toList());
  }


  Future<void> saveKnownShows(Iterable<ShowItem> shows) async {
    final prefs = await SharedPreferences.getInstance();
    final current = _decodeShows(prefs.getString(_knownShowsKey));
    for (final show in shows) {
      current[show.id] = show;
    }
    final encoded = current.map((key, value) => MapEntry('$key', value.toJson()));
    await prefs.setString(_knownShowsKey, jsonEncode(encoded));
  }

  Future<void> recordFeedback({required int showId, required String reason}) async {
    final prefs = await SharedPreferences.getInstance();
    final snapshot = await load();
    final dismissed = {...snapshot.dismissedIds};
    final watched = {...snapshot.watchedIds};
    final counts = {...snapshot.feedbackCounts};
    counts[reason] = (counts[reason] ?? 0) + 1;

    if (reason == 'Not interested' || reason == 'Wrong genre' || reason == 'Wrong service') {
      dismissed.add(showId);
    }
    if (reason == 'Already watched' || reason == 'Loved it') {
      watched.add(showId);
    }

    await Future.wait([
      prefs.setStringList(_dismissedIdsKey, dismissed.map((id) => '$id').toList()),
      prefs.setStringList(_watchedIdsKey, watched.map((id) => '$id').toList()),
      prefs.setString(_feedbackKey, jsonEncode(counts)),
    ]);
  }

  Future<void> saveAppLanguage(String languageCode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_appLanguageKey, languageCode);
  }

  Future<void> reset() async {
    final prefs = await SharedPreferences.getInstance();
    for (final key in <String>[
      _regionKey,
      _servicesKey,
      _maxSeasonsKey,
      _completedOnlyKey,
      _savedIdsKey,
      _dismissedIdsKey,
      _watchedIdsKey,
      _feedbackKey,
      _knownShowsKey,
      _appLanguageKey,
    ]) {
      await prefs.remove(key);
    }
  }

  Set<int> _decodeIds(List<String>? values) =>
      (values ?? const <String>[]).map(int.tryParse).whereType<int>().toSet();

  Map<int, ShowItem> _decodeShows(String? value) {
    if (value == null || value.isEmpty) return <int, ShowItem>{};
    try {
      final decoded = jsonDecode(value) as Map<String, dynamic>;
      return decoded.map((key, item) => MapEntry(int.parse(key), ShowItem.fromJson(Map<String, dynamic>.from(item as Map))));
    } catch (_) {
      return <int, ShowItem>{};
    }
  }

  Map<String, int> _decodeFeedback(String? value) {
    if (value == null || value.isEmpty) return <String, int>{};
    try {
      final decoded = jsonDecode(value) as Map<String, dynamic>;
      return decoded.map((key, item) => MapEntry(key, (item as num).toInt()));
    } catch (_) {
      return <String, int>{};
    }
  }
}
