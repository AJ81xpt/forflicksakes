import 'package:flutter/material.dart';
import '../app/app_theme.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 110),
        children: [
          Text('Profile', style: Theme.of(context).textTheme.displaySmall),
          const SizedBox(height: 22),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.outline),
            ),
            child: const Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: AppColors.violet,
                  child: Text('A', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Guest profile', style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
                      SizedBox(height: 4),
                      Text('Sign in later to sync your taste and watchlist.'),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          _SettingsTile(icon: Icons.language_rounded, title: 'Region', subtitle: 'South Africa'),
          _SettingsTile(icon: Icons.subscriptions_outlined, title: 'Streaming services', subtitle: 'Choose your subscriptions'),
          _SettingsTile(icon: Icons.tune_rounded, title: 'Taste profile', subtitle: 'Genres, moods and content preferences'),
          _SettingsTile(icon: Icons.accessibility_new_rounded, title: 'Accessibility', subtitle: 'Text size and motion preferences'),
          _SettingsTile(icon: Icons.privacy_tip_outlined, title: 'Privacy and legal', subtitle: 'Terms, privacy and AI notice'),
          const SizedBox(height: 24),
          Text(
            'ForFlickSakes\nStop scrolling. Start watching.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  const _SettingsTile({required this.icon, required this.title, required this.subtitle});

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 5),
      leading: CircleAvatar(
        backgroundColor: AppColors.surfaceElevated,
        child: Icon(icon),
      ),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_right_rounded),
      onTap: () {},
    );
  }
}
