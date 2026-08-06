import 'package:flutter/material.dart';
import '../app/app_theme.dart';
import '../models/demo_catalog.dart';

class SearchScreen extends StatelessWidget {
  const SearchScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 100),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Search', style: Theme.of(context).textTheme.displaySmall),
            const SizedBox(height: 8),
            Text('Find a title, actor, genre or mood.', style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: 22),
            const TextField(
              decoration: InputDecoration(
                hintText: 'Search shows and films',
                prefixIcon: Icon(Icons.search_rounded),
              ),
            ),
            const SizedBox(height: 24),
            Text('Popular right now', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            Expanded(
              child: ListView.separated(
                itemCount: demoShows.length,
                separatorBuilder: (context, index) => const Divider(color: AppColors.outline),
                itemBuilder: (context, index) {
                  final show = demoShows[index];
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.network(
                        show.posterUrl,
                        width: 54,
                        height: 76,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => const SizedBox(
                          width: 54,
                          height: 76,
                          child: ColoredBox(color: AppColors.surfaceElevated),
                        ),
                      ),
                    ),
                    title: Text(show.title),
                    subtitle: Text(show.genres.join(' • ')),
                    trailing: const Icon(Icons.chevron_right_rounded),
                    onTap: () {},
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
