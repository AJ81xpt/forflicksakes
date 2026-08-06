import 'package:flutter/material.dart';
import '../app/app_theme.dart';
import '../models/demo_catalog.dart';
import '../models/show.dart';
import '../widgets/provider_badge.dart';
import '../widgets/section_header.dart';
import '../widgets/show_card.dart';

class DiscoverScreen extends StatefulWidget {
  const DiscoverScreen({required this.savedIds, required this.onToggleSaved, super.key});

  final Set<int> savedIds;
  final ValueChanged<int> onToggleSaved;

  @override
  State<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends State<DiscoverScreen> {
  final _promptController = TextEditingController();
  bool _thinking = false;
  String _selectedMood = 'Mind-bending';

  static const moods = [
    'Mind-bending',
    'Funny',
    'Comforting',
    'Dark',
    'Romantic',
    'Fast-paced',
  ];

  @override
  void dispose() {
    _promptController.dispose();
    super.dispose();
  }

  Future<void> _findSomething() async {
    setState(() => _thinking = true);
    await Future<void>.delayed(const Duration(milliseconds: 850));
    if (!mounted) return;
    setState(() => _thinking = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          _promptController.text.trim().isEmpty
              ? 'Fresh picks ready for a $_selectedMood mood.'
              : 'Recommendations refined around your request.',
        ),
      ),
    );
  }

  void _watchNow(Show show) {
    final provider = show.providers.first.name;
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      backgroundColor: AppColors.surface,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Where to watch', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 8),
              Text('${show.title} is available on $provider in your selected region.'),
              const SizedBox(height: 18),
              Row(
                children: show.providers
                    .map((item) => Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ProviderBadge(provider: item),
                        ))
                    .toList(),
              ),
              const SizedBox(height: 22),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(this.context).showSnackBar(
                      const SnackBar(
                        content: Text('Live provider linking is added in the next integration step.'),
                      ),
                    );
                  },
                  icon: const Icon(Icons.open_in_new_rounded),
                  label: Text('Open $provider'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hero = demoShows.first;
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          backgroundColor: AppColors.background.withValues(alpha: 0.92),
          title: const Text(
            'ForFlickSakes',
            style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: -0.5),
          ),
          actions: [
            IconButton(
              tooltip: 'Notifications',
              onPressed: () {},
              icon: const Icon(Icons.notifications_none_rounded),
            ),
            const SizedBox(width: 6),
          ],
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 120),
          sliver: SliverList.list(
            children: [
              Text('Stop scrolling.\nStart watching.', style: Theme.of(context).textTheme.displaySmall),
              const SizedBox(height: 10),
              Text(
                'Tell us what you feel like and get a small set of genuinely useful picks.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _promptController,
                minLines: 2,
                maxLines: 4,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _findSomething(),
                decoration: const InputDecoration(
                  hintText: 'Something tense, clever and under three seasons…',
                  prefixIcon: Icon(Icons.auto_awesome_rounded),
                ),
              ),
              const SizedBox(height: 14),
              SizedBox(
                height: 42,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: moods.length,
                  separatorBuilder: (context, index) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final mood = moods[index];
                    return ChoiceChip(
                      label: Text(mood),
                      selected: _selectedMood == mood,
                      onSelected: (_) => setState(() => _selectedMood = mood),
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                height: 52,
                child: FilledButton.icon(
                  onPressed: _thinking ? null : _findSomething,
                  icon: _thinking
                      ? const SizedBox.square(
                          dimension: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.auto_awesome_rounded),
                  label: Text(_thinking ? 'Finding your next obsession…' : 'Find something great'),
                ),
              ),
              const SizedBox(height: 30),
              const SectionHeader(title: "Tonight's best pick", action: 'Refresh'),
              const SizedBox(height: 14),
              _HeroRecommendation(
                show: hero,
                isSaved: widget.savedIds.contains(hero.id),
                onToggleSaved: () => widget.onToggleSaved(hero.id),
                onWatchNow: () => _watchNow(hero),
              ),
              const SizedBox(height: 32),
              const SectionHeader(title: 'More picks for you', action: 'See all'),
              const SizedBox(height: 14),
              SizedBox(
                height: 420,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: demoShows.length - 1,
                  separatorBuilder: (context, index) => const SizedBox(width: 14),
                  itemBuilder: (context, index) {
                    final show = demoShows[index + 1];
                    return ShowCard(
                      show: show,
                      isSaved: widget.savedIds.contains(show.id),
                      onToggleSaved: () => widget.onToggleSaved(show.id),
                      onWatchNow: () => _watchNow(show),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _HeroRecommendation extends StatelessWidget {
  const _HeroRecommendation({
    required this.show,
    required this.isSaved,
    required this.onToggleSaved,
    required this.onWatchNow,
  });

  final Show show;
  final bool isSaved;
  final VoidCallback onToggleSaved;
  final VoidCallback onWatchNow;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 500,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: AppColors.outline),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.network(
            show.backdropUrl,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) => const ColoredBox(color: AppColors.surface),
          ),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0x18000000), Color(0xFF0A0A0E)],
                stops: [0.2, 0.82],
              ),
            ),
          ),
          Positioned(
            left: 22,
            right: 22,
            bottom: 22,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: show.providers.map((item) => ProviderBadge(provider: item)).toList(),
                ),
                const SizedBox(height: 14),
                Text(show.title, style: Theme.of(context).textTheme.displaySmall),
                const SizedBox(height: 8),
                Text(
                  '${show.year}  •  ${show.rating.toStringAsFixed(1)} ★  •  ${show.seasons} seasons',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 12),
                Text(show.reason, style: Theme.of(context).textTheme.bodyLarge),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: onWatchNow,
                        icon: const Icon(Icons.play_arrow_rounded),
                        label: const Text('Watch now'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    IconButton.filledTonal(
                      tooltip: isSaved ? 'Remove from watchlist' : 'Save to watchlist',
                      onPressed: onToggleSaved,
                      icon: Icon(isSaved ? Icons.bookmark : Icons.bookmark_border),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
