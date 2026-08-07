import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/show_item.dart';

class ApiService {
  ApiService({http.Client? client}) : _client = client ?? http.Client();

  static const String _baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8080',
  );

  final http.Client _client;

  Future<RecommendationResult> recommendFromPrompt({
    required String query,
    required String region,
    required Set<String> services,
    required int maxSeasons,
    required bool completedOnly,
    required Set<int> excludedIds,
  }) {
    return _recommend(<String, dynamic>{
      'mode': 'prompt',
      'query': query,
      'profile': _profile(region, services, maxSeasons, completedOnly, excludedIds),
    });
  }

  Future<RecommendationResult> recommendFromMood({
    required String mood,
    required String region,
    required Set<String> services,
    required int maxSeasons,
    required bool completedOnly,
    required Set<int> excludedIds,
  }) {
    return _recommend(<String, dynamic>{
      'mode': 'mood',
      'mood': mood.toLowerCase(),
      'profile': _profile(region, services, maxSeasons, completedOnly, excludedIds),
    });
  }

  Map<String, dynamic> _profile(
    String region,
    Set<String> services,
    int maxSeasons,
    bool completedOnly,
    Set<int> excludedIds,
  ) => <String, dynamic>{
        'region': region,
        'services': services.toList(),
        'maxSeasons': maxSeasons,
        'completedOnly': completedOnly,
        'excludedIds': excludedIds.toList(),
      };

  Future<RecommendationResult> _recommend(
    Map<String, dynamic> body,
  ) async {
    final response = await _client
        .post(
          Uri.parse('$_baseUrl/recommendations'),
          headers: const {'Content-Type': 'application/json'},
          body: jsonEncode(body),
        )
        .timeout(const Duration(seconds: 20));

    if (response.statusCode != 200) {
      String message = 'Recommendation service returned ${response.statusCode}.';
      try {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        message = json['error'] as String? ?? message;
      } catch (_) {
        // Preserve the generic message.
      }
      throw Exception(message);
    }

    return RecommendationResult.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<void> sendFeedback({
    required String type,
    required String reason,
    int? showId,
    String? mode,
    String? mood,
    String? query,
    List<int> resultIds = const <int>[],
  }) async {
    final response = await _client
        .post(
          Uri.parse('$_baseUrl/feedback'),
          headers: const {'Content-Type': 'application/json'},
          body: jsonEncode(<String, dynamic>{
            'type': type,
            'reason': reason,
            'showId': showId,
            'mode': mode,
            'mood': mood,
            'query': query,
            'resultIds': resultIds,
          }),
        )
        .timeout(const Duration(seconds: 10));

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Feedback could not be saved.');
    }
  }

  Future<WatchOptions> watchOptions({
    required int showId,
    required String region,
  }) async {
    final uri = Uri.parse(
      '$_baseUrl/shows/$showId/providers?region=${Uri.encodeQueryComponent(region)}',
    );
    final response = await _client.get(uri).timeout(const Duration(seconds: 15));

    if (response.statusCode != 200) {
      throw Exception('Provider service returned ${response.statusCode}.');
    }

    return WatchOptions.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }
}
