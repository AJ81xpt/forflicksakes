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
  });

  final String name;
  final String type;
  final String? webUrl;
  final String? iosUrl;
  final String? androidUrl;

  factory WatchProvider.fromJson(Map<String, dynamic> json) {
    return WatchProvider(
      name: json['name'] as String? ?? 'Provider',
      type: json['type'] as String? ?? 'stream',
      webUrl: json['webUrl'] as String?,
      iosUrl: json['iosUrl'] as String?,
      androidUrl: json['androidUrl'] as String?,
    );
  }
}

class WatchOptions {
  const WatchOptions({
    required this.providers,
    required this.fallbackUrl,
    required this.verified,
  });

  final List<WatchProvider> providers;
  final String fallbackUrl;
  final bool verified;

  factory WatchOptions.fromJson(Map<String, dynamic> json) {
    return WatchOptions(
      providers: (json['providers'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(WatchProvider.fromJson)
          .toList(),
      fallbackUrl: json['fallbackUrl'] as String? ?? 'https://www.justwatch.com/',
      verified: json['verified'] as bool? ?? false,
    );
  }
}
