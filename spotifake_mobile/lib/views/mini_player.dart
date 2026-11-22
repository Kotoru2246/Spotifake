import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import '../models/song.dart';
import '../services/audio_manager.dart';
import '../services/api_service.dart';
import 'now_playing_modal.dart';

class MiniPlayer extends StatelessWidget {
  const MiniPlayer({super.key});

  void _openNowPlaying(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const NowPlayingModal(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<Song?>(
      stream: AudioManager.instance.currentSongStream,
      initialData: AudioManager.instance.currentSong,
      builder: (context, snapshot) {
        final song = snapshot.data ?? AudioManager.instance.currentSong;
        if (song == null) {
          return const SizedBox.shrink();
        }

        final coverUrl = ApiService.instance.getCoverUrl(song);

        return GestureDetector(
          onTap: () => _openNowPlaying(context),
          child: Container(
            margin: const EdgeInsets.fromLTRB(8, 0, 8, 4),
            decoration: BoxDecoration(
              color: const Color(0xFF282828),
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.4),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: Image.network(
                          coverUrl,
                          width: 44,
                          height: 44,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => Container(
                            width: 44,
                            height: 44,
                            color: const Color(0xFF383838),
                            child: const Icon(Icons.music_note, color: Colors.white54, size: 22),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              song.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              song.artist,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: Color(0xFFB3B3B3), fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: Icon(
                          song.isLiked ? Icons.favorite : Icons.favorite_border,
                          color: song.isLiked ? const Color(0xFF1DB954) : Colors.white70,
                          size: 22,
                        ),
                        onPressed: () async {
                          await ApiService.instance.toggleFavorite(song);
                        },
                      ),
                      StreamBuilder<PlayerState>(
                        stream: AudioManager.instance.player.playerStateStream,
                        builder: (context, stateSnap) {
                          final isPlaying = stateSnap.data?.playing ?? false;
                          return IconButton(
                            icon: Icon(
                              isPlaying ? Icons.pause_circle_filled : Icons.play_circle_filled,
                              color: Colors.white,
                              size: 34,
                            ),
                            onPressed: AudioManager.instance.togglePlayPause,
                          );
                        },
                      ),
                      IconButton(
                        icon: const Icon(Icons.skip_next, color: Colors.white, size: 24),
                        onPressed: AudioManager.instance.next,
                      ),
                    ],
                  ),
                ),
                StreamBuilder<PositionData>(
                  stream: AudioManager.instance.positionDataStream,
                  builder: (context, snapshot) {
                    final positionData = snapshot.data;
                    final position = positionData?.position ?? Duration.zero;
                    final duration = positionData?.duration ?? Duration(seconds: song.durationSeconds);
                    double progress = 0.0;
                    if (duration.inMilliseconds > 0) {
                      progress = (position.inMilliseconds / duration.inMilliseconds).clamp(0.0, 1.0);
                    }
                    return LinearProgressIndicator(
                      value: progress,
                      backgroundColor: Colors.transparent,
                      valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF1DB954)),
                      minHeight: 2,
                    );
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
