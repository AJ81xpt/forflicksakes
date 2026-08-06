import 'package:flutter/material.dart';

@immutable
class StreamingProvider {
  const StreamingProvider({
    required this.name,
    required this.shortName,
    required this.color,
  });

  final String name;
  final String shortName;
  final Color color;
}

@immutable
class Show {
  const Show({
    required this.id,
    required this.title,
    required this.summary,
    required this.year,
    required this.rating,
    required this.seasons,
    required this.genres,
    required this.providers,
    required this.backdropUrl,
    required this.posterUrl,
    required this.reason,
  });

  final int id;
  final String title;
  final String summary;
  final int year;
  final double rating;
  final int seasons;
  final List<String> genres;
  final List<StreamingProvider> providers;
  final String backdropUrl;
  final String posterUrl;
  final String reason;
}
