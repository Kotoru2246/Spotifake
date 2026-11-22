import 'package:flutter/material.dart';
import '../services/audio_manager.dart';
import '../services/api_service.dart';
import 'add_to_playlist_dialog.dart';

class QueueSheet extends StatelessWidget {
  const QueueSheet({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: const BoxDecoration(
        color: Color(0xFF181818),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2)),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Playback Queue', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                Text(
                  '${AudioManager.instance.queue.length} songs',
                  style: const TextStyle(color: Color(0xFFB3B3B3), fontSize: 13),
                ),
              ],
            ),
          ),
          const Divider(color: Color(0xFF282828), height: 1),
          Expanded(
            child: StreamBuilder<List<dynamic>>(
              stream: AudioManager.instance.queueStream,
              initialData: AudioManager.instance.queue,
              builder: (context, snapshot) {
                final queue = AudioManager.instance.queue;
                final currentIndex = AudioManager.instance.currentIndex;

                if (queue.isEmpty) {
                  return const Center(
                    child: Text('Queue is empty', style: TextStyle(color: Color(0xFFB3B3B3))),
                  );
                }

                return ListView.builder(
                  itemCount: queue.length,
                  itemBuilder: (ctx, index) {
                    final song = queue[index];
                    final isCurrent = index == currentIndex;
                    final coverUrl = ApiService.instance.getCoverUrl(song);

                    return ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                      leading: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: Image.network(
                          coverUrl,
                          width: 44,
                          height: 44,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => Container(
                            width: 44,
                            height: 44,
                            color: const Color(0xFF282828),
                            child: const Icon(Icons.music_note, color: Colors.white30),
                          ),
                        ),
                      ),
                      title: Text(
                        song.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: isCurrent ? const Color(0xFF1DB954) : Colors.white,
                          fontWeight: isCurrent ? FontWeight.bold : FontWeight.w500,
                          fontSize: 14,
                        ),
                      ),
                      subtitle: Text(
                        song.artist,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Color(0xFFB3B3B3), fontSize: 12),
                      ),
                      trailing: isCurrent
                          ? const Icon(Icons.volume_up, color: Color(0xFF1DB954), size: 20)
                          : Text('${index + 1}', style: const TextStyle(color: Color(0xFF727272), fontSize: 12)),
                      onTap: () {
                        AudioManager.instance.jumpToQueueIndex(index);
                      },
                      onLongPress: () => showAddToPlaylistSheet(context, song),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
