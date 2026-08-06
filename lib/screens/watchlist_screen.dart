import 'package:flutter/material.dart';
import '../app/app_theme.dart';
import '../models/demo_catalog.dart';

class WatchlistScreen extends StatelessWidget {
  const WatchlistScreen({required this.savedIds, required this.onRemove, super.key});

  final Set<int> savedIds;
  final ValueChanged<int> onRemove;

  @override
  Widget build(BuildContext context) {
    final saved = demoShows.where((show) => savedIds.contains(show.id)).toList();
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 100),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Watchlist', style: Theme.of(context).textTheme.displaySmall),
            const SizedBox(height: 8),
            Text('Everything you saved for later.', style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: 22),
            Expanded(
              child: saved.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.bookmark_border_rounded, size: 54, color: AppColors.textSecondary),
                          const SizedBox(height: 14),
                          Text('Nothing saved yet', style: Theme.of(context).textTheme.titleLarge),
                          const SizedBox(height: 6),
                          const Text('Save a recommendation and it will appear here.'),
                        ],
                      ),
                    )
                  : ListView.separated(
                      itemCount: saved.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final show = saved[index];
                        return Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: AppColors.outline),
                          ),
                          child: Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Image.network(
                                  show.posterUrl,
                                  width: 70,
                                  height: 98,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) => const SizedBox(
                                    width: 70,
                                    height: 98,
                                    child: ColoredBox(color: AppColors.surfaceElevated),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(show.title, style: Theme.of(context).textTheme.titleLarge),
                                    const SizedBox(height: 6),
                                    Text(show.genres.join(' • ')),
                                    const SizedBox(height: 10),
                                    Text('Available on ${show.providers.first.name}'),
                                  ],
                                ),
                              ),
                              IconButton(
                                tooltip: 'Remove ${show.title}',
                                onPressed: () => onRemove(show.id),
                                icon: const Icon(Icons.delete_outline_rounded),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
