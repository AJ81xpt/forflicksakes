import 'package:flutter/material.dart';
import '../models/show.dart';

class ProviderBadge extends StatelessWidget {
  const ProviderBadge({required this.provider, super.key});

  final StreamingProvider provider;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Available on ${provider.name}',
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
        decoration: BoxDecoration(
          color: provider.color,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
          boxShadow: [
            BoxShadow(
              color: provider.color.withValues(alpha: 0.25),
              blurRadius: 14,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Text(
          provider.shortName,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w900,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}
