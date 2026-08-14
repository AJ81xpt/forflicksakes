import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../models/show_item.dart';

class ApiService {
  ApiService({http.Client? client}) : _client = client ?? http.Client();

  static const String _baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://forflicksakes.onrender.com',
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
    return _recommend(
      <String, dynamic>{
        'mode': 'prompt',
        'query': query,
        'profile': _profile(
          region,
          services,
          maxSeasons,
          completedOnly,
          excludedIds,
        ),
      },
    );
  }

  Future<RecommendationResult> continueTheVibe({
    required String title,
    required String refinement,
    required String region,
  }) {
    final suffix = switch (refinement) {
      'lighter' => ' but lighter and less dark',
      'gripping' => ' but more gripping',
      'shorter' => ' but with short episodes under 35 minutes',
      'funny' => ' but funnier',
      _ => '',
    };

    return recommendFromPrompt(
      query: 'Something like $title$suffix',
      region: region,
      services: const <String>{},
      maxSeasons: 10,
      completedOnly: false,
      excludedIds: const <int>{},
    );
  }

  Future<RecommendationResult> recommendFromMood({
    required String mood,
    required String region,
    required Set<String> services,
    required int maxSeasons,
    required bool completedOnly,
    required Set<int> excludedIds,
  }) {
    return _recommend(
      <String, dynamic>{
        'mode': 'mood',
        'mood': mood.toLowerCase(),
        'profile': _profile(
          region,
          services,
          maxSeasons,
          completedOnly,
          excludedIds,
        ),
      },
    );
  }

  Map<String, dynamic> _profile(
    String region,
    Set<String> services,
    int maxSeasons,
    bool completedOnly,
    Set<int> excludedIds,
  ) {
    return <String, dynamic>{
      'region': region,
      'services': services.toList(),
      'maxSeasons': maxSeasons,
      'completedOnly': completedOnly,
      'excludedIds': excludedIds.toList(),
    };
  }

  Future<RecommendationResult> _recommend(
    Map<String, dynamic> body,
  ) async {
    final response = await _client
        .post(
          Uri.parse('$_baseUrl/recommendations'),
          headers: const <String, String>{
            'Content-Type': 'application/json',
          },
          body: jsonEncode(body),
        )
        .timeout(
          const Duration(seconds: 70),
          onTimeout: () {
            throw Exception(
              'Your Watch Concierge is taking longer than usual to wake up. '
              'Please try again.',
            );
          },
        );

    if (response.statusCode != 200) {
      String message =
          'Recommendation service returned ${response.statusCode}.';

      try {
        final json =
            jsonDecode(response.body) as Map<String, dynamic>;
        message = json['error'] as String? ?? message;
      } catch (_) {
        // Keep the generic error message.
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
          headers: const <String, String>{
            'Content-Type': 'application/json',
          },
          body: jsonEncode(
            <String, dynamic>{
              'type': type,
              'reason': reason,
              'showId': showId,
              'mode': mode,
              'mood': mood,
              'query': query,
              'resultIds': resultIds,
            },
          ),
        )
        .timeout(
          const Duration(seconds: 10),
          onTimeout: () {
            throw Exception('Feedback could not be saved.');
          },
        );

    if (response.statusCode < 200 ||
        response.statusCode >= 300) {
      throw Exception('Feedback could not be saved.');
    }
  }

  Future<ShowDetails> showDetails({
    required int showId,
  }) async {
    final response = await _client
        .get(
          Uri.parse('$_baseUrl/shows/$showId/details'),
        )
        .timeout(
          const Duration(seconds: 60),
          onTimeout: () {
            throw Exception(
              'Show details are taking longer than usual. '
              'Please try again.',
            );
          },
        );

    if (response.statusCode != 200) {
      String message =
          'Show details service returned ${response.statusCode}.';

      try {
        final json =
            jsonDecode(response.body) as Map<String, dynamic>;
        message = json['error'] as String? ?? message;
      } catch (_) {
        // Keep the generic error message.
      }

      throw Exception(message);
    }

    return ShowDetails.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<WatchOptions> watchOptions({
    required int showId,
    required String region,
  }) async {
    final uri = Uri.parse(
      '$_baseUrl/shows/$showId/providers'
      '?region=${Uri.encodeQueryComponent(region)}',
    );

    debugPrint('WATCH REQUEST: $uri');

    final response = await _client
        .get(uri)
        .timeout(
          const Duration(seconds: 60),
          onTimeout: () {
            throw Exception(
              'Streaming availability is taking longer than usual. '
              'Please try again.',
            );
          },
        );

    debugPrint('WATCH RESPONSE ${response.statusCode}: ${response.body}');

    if (response.statusCode != 200) {
      String message =
          'Streaming availability service returned '
          '${response.statusCode}.';

      try {
        final json =
            jsonDecode(response.body) as Map<String, dynamic>;
        message = json['error'] as String? ?? message;
      } catch (_) {
        // Keep the generic error message.
      }

      throw Exception(message);
    }

    return WatchOptions.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  void dispose() {
    _client.close();
  }
}