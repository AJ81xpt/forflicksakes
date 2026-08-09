class ShowItem {
  const ShowItem({
    required this.id,
    required this.title,
    required this.year,
    required this.seasons,
    required this.runtime,
    required this.rating,
    required this.poster,
    required this.summary,
    required this.genres,
    required this.matchReasons,
    this.confidence = 0,
    this.status = '',
    this.imdbId,
    this.officialUrl,
  });

  final int id;
  final String title;
  final int year;
  final int seasons;
  final int runtime;
  final double rating;
  final String poster;
  final String summary;
  final List<String> genres;
  final List<String> matchReasons;
  final int confidence;
  final String status;
  final String? imdbId;
  final String? officialUrl;

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'title': title,
        'year': year,
        'seasons': seasons,
        'runtime': runtime,
        'rating': rating,
        'poster': poster,
        'summary': summary,
        'genres': genres,
        'matchReasons': matchReasons,
        'confidence': confidence,
        'status': status,
        'imdbId': imdbId,
        'officialUrl': officialUrl,
      };

  factory ShowItem.fromJson(Map<String, dynamic> json) {
    return ShowItem(
      id: (json['id'] as num?)?.toInt() ?? 0,
      title: json['title'] as String? ?? 'Untitled',
      year: (json['year'] as num?)?.toInt() ?? 0,
      seasons: (json['seasons'] as num?)?.toInt() ?? 0,
      runtime: (json['runtime'] as num?)?.toInt() ?? 0,
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      poster: json['poster'] as String? ?? '',
      summary: json['summary'] as String? ?? 'No summary available.',
      genres: (json['genres'] as List<dynamic>? ?? const <dynamic>[])
          .map((item) => item.toString())
          .toList(),
      matchReasons:
          (json['matchReasons'] as List<dynamic>? ?? const <dynamic>[])
              .map((item) => item.toString())
              .where((item) => item.isNotEmpty)
              .toList(),
      confidence: (json['confidence'] as num?)?.toInt() ?? 0,
      status: json['status'] as String? ?? '',
      imdbId: json['imdbId'] as String?,
      officialUrl: json['officialUrl'] as String?,
    );
  }
}

class WatchProvider {
  const WatchProvider({
    required this.name,
    required this.type,
    this.webUrl,
    this.iosUrl,
    this.androidUrl,
    this.format,
    this.price,
  });

  final String name;
  final String type;
  final String? webUrl;
  final String? iosUrl;
  final String? androidUrl;
  final String? format;
  final num? price;

  factory WatchProvider.fromJson(Map<String, dynamic> json) {
    return WatchProvider(
      name: _normalizeProviderName(json['name'] as String? ?? 'Provider'),
      type: json['type'] as String? ?? 'stream',
      webUrl: json['webUrl'] as String?,
      iosUrl: json['iosUrl'] as String?,
      androidUrl: json['androidUrl'] as String?,
      format: json['format'] as String?,
      price: json['price'] as num?,
    );
  }
}

class WatchOptions {
  const WatchOptions({
    required this.providers,
    required this.verified,
    required this.attribution,
    this.message,
  });

  final List<WatchProvider> providers;
  final bool verified;
  final String attribution;
  final String? message;

  factory WatchOptions.fromJson(Map<String, dynamic> json) {
    return WatchOptions(
      providers: (json['providers'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(WatchProvider.fromJson)
          .toList(),
      verified: json['verified'] as bool? ?? false,
      attribution: json['attribution'] as String? ?? '',
      message: json['message'] as String?,
    );
  }
}

class RecommendationResult {
  const RecommendationResult({
    required this.shows,
    required this.interpretation,
    required this.mode,
    this.mood,
  });

  final List<ShowItem> shows;
  final List<String> interpretation;
  final String mode;
  final String? mood;

  factory RecommendationResult.fromJson(Map<String, dynamic> json) {
    return RecommendationResult(
      shows: (json['results'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(ShowItem.fromJson)
          .toList(),
      interpretation:
          (json['interpretation'] as List<dynamic>? ?? const <dynamic>[])
              .map((item) => item.toString())
              .where((item) => item.isNotEmpty)
              .toList(),
      mode: json['mode'] as String? ?? 'prompt',
      mood: json['mood'] as String?,
    );
  }
}


class ShowCastMember {
  const ShowCastMember({
    required this.name,
    required this.character,
    required this.imageUrl,
  });

  final String name;
  final String character;
  final String imageUrl;

  factory ShowCastMember.fromJson(Map<String, dynamic> json) => ShowCastMember(
        name: json['name'] as String? ?? '',
        character: json['character'] as String? ?? '',
        imageUrl: json['imageUrl'] as String? ?? '',
      );
}

class ShowDetails {
  const ShowDetails({
    required this.language,
    required this.type,
    required this.network,
    required this.premiered,
    required this.ended,
    required this.episodeCount,
    required this.cast,
  });

  final String language;
  final String type;
  final String network;
  final String premiered;
  final String ended;
  final int episodeCount;
  final List<ShowCastMember> cast;

  factory ShowDetails.fromJson(Map<String, dynamic> json) => ShowDetails(
        language: json['language'] as String? ?? '',
        type: json['type'] as String? ?? '',
        network: json['network'] as String? ?? '',
        premiered: json['premiered'] as String? ?? '',
        ended: json['ended'] as String? ?? '',
        episodeCount: (json['episodeCount'] as num?)?.toInt() ?? 0,
        cast: (json['cast'] as List<dynamic>? ?? const <dynamic>[])
            .whereType<Map<String, dynamic>>()
            .map(ShowCastMember.fromJson)
            .toList(),
      );
}

String _normalizeProviderName(String name) => name == 'Max' ? 'HBO Max' : name;
