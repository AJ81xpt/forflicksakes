import 'package:flutter/material.dart';
import '../app/app_theme.dart';
import '../models/show.dart';
import 'provider_badge.dart';

class ShowCard extends StatelessWidget {
  const ShowCard({
    required this.show,
    required this.isSaved,
    required this.onToggleSaved,
    required this.onWatchNow,
    super.key,
  });

  final Show show;
  final bool isSaved;
  final VoidCallback onToggleSaved;
  final VoidCallback onWatchNow;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 278,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: AppColors.outline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 16 / 10,
            child: Stack(
              fit: StackFit.expand,
              children: [
                Image.network(
                  show.backdropUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => const ColoredBox(
                    color: AppColors.surfaceElevated,
                    child: Center(child: Icon(Icons.movie_outlined, size: 48)),
                  ),
                ),
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.transparent, Color(0xD9121219)],
                    ),
                  ),
                ),
                Positioned(
                  top: 12,
                  right: 12,
                  child: IconButton.filledTonal(
                    tooltip: isSaved ? 'Remove from watchlist' : 'Save to watchlist',
                    onPressed: onToggleSaved,
                    icon: Icon(isSaved ? Icons.bookmark : Icons.bookmark_border),
                  ),
                ),
                Positioned(
                  left: 14,
                  right: 14,
                  bottom: 12,
                  child: Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: show.providers
                        .map((provider) => ProviderBadge(provider: provider))
                        .toList(),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(show.title, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 6),
                Text(
                  '${show.year}  •  ${show.rating.toStringAsFixed(1)} ★  •  ${show.seasons} season${show.seasons == 1 ? '' : 's'}',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 10),
                Text(
                  show.reason,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: onWatchNow,
                    icon: const Icon(Icons.play_arrow_rounded),
                    label: const Text('Watch now'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
