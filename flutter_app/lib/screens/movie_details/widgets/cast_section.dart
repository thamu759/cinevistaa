import 'package:flutter/material.dart';
import '../../../models/movie.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../theme/app_colors.dart';

class CastSection extends StatelessWidget {
  final List<CastMember> cast;
  const CastSection({super.key, required this.cast});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Cast', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textMain)),
          const SizedBox(height: 12),
          SizedBox(
            height: 100,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: cast.length,
              itemBuilder: (context, index) {
                final member = cast[index];
                return Container(
                  width: 80,
                  margin: const EdgeInsets.only(right: 12),
                  child: Column(
                    children: [
                      CircleAvatar(
                        radius: 30,
                        backgroundImage: member.avatarUrl.isNotEmpty
                            ? CachedNetworkImageProvider(member.avatarUrl)
                            : null,
                        backgroundColor: AppColors.bgDark,
                        child: member.avatarUrl.isEmpty
                            ? const Icon(Icons.person, color: Colors.white24)
                            : null,
                      ),
                      const SizedBox(height: 6),
                      Text(member.name,
                          style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis),
                      Text(member.role,
                          style: const TextStyle(color: AppColors.textMuted, fontSize: 9),
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
