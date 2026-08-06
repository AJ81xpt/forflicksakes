import 'package:flutter/material.dart';
import 'show.dart';

const netflix = StreamingProvider(
  name: 'Netflix',
  shortName: 'N',
  color: Color(0xFFE50914),
);
const maxProvider = StreamingProvider(
  name: 'Max',
  shortName: 'M',
  color: Color(0xFF5B4DFF),
);
const appleTv = StreamingProvider(
  name: 'Apple TV+',
  shortName: 'TV+',
  color: Color(0xFF191919),
);
const primeVideo = StreamingProvider(
  name: 'Prime Video',
  shortName: 'P',
  color: Color(0xFF00A8E1),
);
const disneyPlus = StreamingProvider(
  name: 'Disney+',
  shortName: 'D+',
  color: Color(0xFF173F8A),
);
const showmax = StreamingProvider(
  name: 'Showmax',
  shortName: 'S',
  color: Color(0xFFE8005A),
);

const demoShows = <Show>[
  Show(
    id: 1,
    title: 'Severance',
    summary: 'A team of office workers have surgically divided their work and personal memories.',
    year: 2022,
    rating: 8.7,
    seasons: 2,
    genres: ['Mystery', 'Drama', 'Sci-Fi'],
    providers: [appleTv],
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/lFf6LLrQjYldcZItzOkGmMMigP7.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w500/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg',
    reason: 'You asked for something intelligent, tense and easy to become obsessed with.',
  ),
  Show(
    id: 2,
    title: 'The Last of Us',
    summary: 'A hardened survivor escorts a teenager across a post-pandemic America.',
    year: 2023,
    rating: 8.6,
    seasons: 2,
    genres: ['Drama', 'Thriller'],
    providers: [maxProvider],
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
    reason: 'A character-led thriller with emotional weight and a premium production feel.',
  ),
  Show(
    id: 3,
    title: 'Slow Horses',
    summary: 'A dysfunctional team of British intelligence agents navigate espionage and office politics.',
    year: 2022,
    rating: 8.2,
    seasons: 4,
    genres: ['Spy', 'Drama', 'Dark comedy'],
    providers: [appleTv],
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/aYQm2A2oBHbVDbUnrT5t9FdR5f8.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w500/vJIJHKq8aZmYF5FGDV3RpHqrPe.jpg',
    reason: 'Sharp dialogue, compact seasons and a clever workplace dynamic.',
  ),
  Show(
    id: 4,
    title: 'The Bear',
    summary: 'A young chef returns home to run his family sandwich shop and rebuild a chaotic kitchen.',
    year: 2022,
    rating: 8.6,
    seasons: 3,
    genres: ['Drama', 'Comedy'],
    providers: [disneyPlus],
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/sR0SpCrXamlIkYMdfz83sFn5JS6.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w500/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg',
    reason: 'Fast, human and emotionally intense without wasting an episode.',
  ),
];
