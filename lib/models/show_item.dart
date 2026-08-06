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
  final String? imdbId;
  final String? officialUrl;

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
      name: json['name'] as String? ?? 'Provider',
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
  });

  final List<ShowItem> shows;
  final List<String> interpretation;

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
    );
  }
}
