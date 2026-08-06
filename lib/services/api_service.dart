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

  Future<List<ShowItem>> recommend({
    required String query,
    required String mood,
  }) async {
    final response = await _client
        .post(
          Uri.parse('$_baseUrl/recommendations'),
          headers: const {'Content-Type': 'application/json'},
          body: jsonEncode({'query': query, 'mood': mood}),
        )
        .timeout(const Duration(seconds: 15));

    if (response.statusCode != 200) {
      throw Exception('Recommendation service returned ${response.statusCode}.');
    }

    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    final results = decoded['results'] as List<dynamic>? ?? const <dynamic>[];
    return results
        .whereType<Map<String, dynamic>>()
        .map(ShowItem.fromJson)
        .toList();
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
