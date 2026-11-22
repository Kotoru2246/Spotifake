import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import '../models/song.dart';
import '../services/audio_manager.dart';
import '../services/api_service.dart';
import 'queue_sheet.dart';
import 'artist_detail_view.dart';
import 'add_to_playlist_dialog.dart';

class LrcLine {
  final Duration timestamp;
  final String text;
  LrcLine(this.timestamp, this.text);
}

class NowPlayingModal extends StatefulWidget {
  const NowPlayingModal({super.key});

  @override
  State<NowPlayingModal> createState() => _NowPlayingModalState();
}

class _NowPlayingModalState extends State<NowPlayingModal> {
  bool _showLyrics = false;
  List<LrcLine> _parsedLyrics = [];
  String _plainLyrics = '';
  bool _loadingLyrics = false;
  String? _lastLyricsSongId;
  final ScrollController _lyricsScrollController = ScrollController();
  int _activeLyricIndex = -1;

  @override
  void dispose() {
    _lyricsScrollController.dispose();
    super.dispose();
  }

  void _loadLyrics(String songId) async {
    if (_lastLyricsSongId == songId) return;
    setState(() {
      _loadingLyrics = true;
      _lastLyricsSongId = songId;
      _parsedLyrics = [];
      _plainLyrics = '';
      _activeLyricIndex = -1;
    });

    final raw = await ApiService.instance.fetchLyrics(songId);
    if (!mounted) return;

    if (raw.isEmpty) {
      setState(() {
        _plainLyrics = 'No lyrics available for this song.';
        _loadingLyrics = false;
      });
      return;
    }

    final lrcRegex = RegExp(r'^\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\](.*)$');
    final lines = raw.split('\n');
    List<LrcLine> parsed = [];

    for (var line in lines) {
      final trimmed = line.trim();
      final match = lrcRegex.firstMatch(trimmed);
      if (match != null) {
        final min = int.parse(match.group(1)!);
        final sec = int.parse(match.group(2)!);
        int ms = 0;
        final msGroup = match.group(3);
        if (msGroup != null) {
          ms = int.parse(msGroup.padRight(3, '0').substring(0, 3));
        }
        final text = match.group(4)!.trim();
        parsed.add(LrcLine(Duration(minutes: min, seconds: sec, milliseconds: ms), text));
      }
    }

    setState(() {
      _loadingLyrics = false;
      if (parsed.isNotEmpty) {
        _parsedLyrics = parsed;
      } else {
        _plainLyrics = raw;
      }
    });
  }

  void _updateActiveLyric(Duration currentPosition) {
    if (_parsedLyrics.isEmpty) return;

    int active = -1;
    for (int i = 0; i < _parsedLyrics.length; i++) {
      if (currentPosition >= _parsedLyrics[i].timestamp) {
        active = i;
      } else {
        break;
      }
    }

    if (active != _activeLyricIndex && active >= 0) {
      _activeLyricIndex = active;
      if (_lyricsScrollController.hasClients) {
        const itemHeight = 44.0;
        final targetOffset = (active * itemHeight) - 100.0;
        _lyricsScrollController.animateTo(
          targetOffset.clamp(0.0, _lyricsScrollController.position.maxScrollExtent),
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    }
  }

  void _toggleFavorite(Song song) async {
    final ok = await ApiService.instance.toggleFavorite(song);
    if (ok && mounted) {
      setState(() {});
    }
  }

  void _openQueue() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const QueueSheet(),
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

        if (_showLyrics && _lastLyricsSongId != song.id) {
          _loadLyrics(song.id);
        }

        final coverUrl = ApiService.instance.getCoverUrl(song);

        return Container(
          height: MediaQuery.of(context).size.height * 0.94,
          decoration: const BoxDecoration(
            color: Color(0xFF121212),
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
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
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.keyboard_arrow_down, color: Colors.white, size: 30),
                      onPressed: () => Navigator.pop(context),
                    ),
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text(
                            'PLAYING FROM PLAYLIST',
                            style: TextStyle(color: Color(0xFFB3B3B3), fontSize: 10, letterSpacing: 1.0, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            song.album,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: Icon(
                        _showLyrics ? Icons.lyrics : Icons.lyrics_outlined,
                        color: _showLyrics ? const Color(0xFF1DB954) : Colors.white70,
                      ),
                      onPressed: () {
                        setState(() {
                          _showLyrics = !_showLyrics;
                        });
                        if (_showLyrics) {
                          _loadLyrics(song.id);
                        }
                      },
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 28),
                  child: _showLyrics
                      ? _buildLyricsPanel()
                      : Center(
                          child: AspectRatio(
                            aspectRatio: 1,
                            child: Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.5),
                                    blurRadius: 20,
                                    offset: const Offset(0, 10),
                                  ),
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Image.network(
                                  coverUrl,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, _, _) => Container(
                                    color: const Color(0xFF242424),
                                    child: const Icon(Icons.music_note, color: Colors.white24, size: 80),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 16),
              // Song Info & Heart
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            song.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          GestureDetector(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ArtistDetailView(artistName: song.artist),
                                ),
                              );
                            },
                            child: Text(
                              song.artist,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: Color(0xFFB3B3B3), fontSize: 15),
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(
                        Icons.playlist_add,
                        color: Colors.white70,
                        size: 28,
                      ),
                      tooltip: 'Add to playlist',
                      onPressed: () => showAddToPlaylistSheet(context, song),
                    ),
                    IconButton(
                      icon: Icon(
                        song.isLiked ? Icons.favorite : Icons.favorite_border,
                        color: song.isLiked ? const Color(0xFF1DB954) : Colors.white70,
                        size: 28,
                      ),
                      onPressed: () => _toggleFavorite(song),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              // Seek Slider
              StreamBuilder<PositionData>(
                stream: AudioManager.instance.positionDataStream,
                builder: (context, posSnapshot) {
                  final positionData = posSnapshot.data;
                  final position = positionData?.position ?? Duration.zero;
                  final duration = positionData?.duration ?? Duration(seconds: song.durationSeconds);

                  if (_showLyrics) {
                    _updateActiveLyric(position);
                  }

                  double sliderVal = 0.0;
                  if (duration.inMilliseconds > 0) {
                    sliderVal = (position.inMilliseconds / duration.inMilliseconds).clamp(0.0, 1.0);
                  }

                  return Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        child: Slider(
                          value: sliderVal,
                          onChanged: (val) {
                            final targetMs = (val * duration.inMilliseconds).round();
                            AudioManager.instance.seek(Duration(milliseconds: targetMs));
                          },
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 28),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(_fmt(position), style: const TextStyle(color: Color(0xFFB3B3B3), fontSize: 12)),
                            Text(_fmt(duration), style: const TextStyle(color: Color(0xFFB3B3B3), fontSize: 12)),
                          ],
                        ),
                      ),
                    ],
                  );
                },
              ),
              const SizedBox(height: 8),
              // Controls Row
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    IconButton(
                      icon: Icon(
                        Icons.shuffle,
                        color: AudioManager.instance.isShuffle ? const Color(0xFF1DB954) : Colors.white54,
                        size: 24,
                      ),
                      onPressed: () {
                        setState(() {
                          AudioManager.instance.toggleShuffle();
                        });
                      },
                    ),
                    IconButton(
                      icon: const Icon(Icons.skip_previous, color: Colors.white, size: 38),
                      onPressed: AudioManager.instance.previous,
                    ),
                    StreamBuilder<PlayerState>(
                      stream: AudioManager.instance.player.playerStateStream,
                      builder: (context, stateSnap) {
                        final playing = stateSnap.data?.playing ?? false;
                        return GestureDetector(
                          onTap: AudioManager.instance.togglePlayPause,
                          child: Container(
                            width: 64,
                            height: 64,
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              playing ? Icons.pause : Icons.play_arrow,
                              color: Colors.black,
                              size: 38,
                            ),
                          ),
                        );
                      },
                    ),
                    IconButton(
                      icon: const Icon(Icons.skip_next, color: Colors.white, size: 38),
                      onPressed: AudioManager.instance.next,
                    ),
                    StreamBuilder<LoopMode>(
                      stream: AudioManager.instance.player.loopModeStream,
                      initialData: AudioManager.instance.player.loopMode,
                      builder: (context, loopSnap) {
                        final mode = loopSnap.data ?? LoopMode.off;
                        IconData icon = Icons.repeat;
                        Color color = Colors.white54;
                        if (mode == LoopMode.all) {
                          icon = Icons.repeat;
                          color = const Color(0xFF1DB954);
                        } else if (mode == LoopMode.one) {
                          icon = Icons.repeat_one;
                          color = const Color(0xFF1DB954);
                        }
                        return IconButton(
                          icon: Icon(icon, color: color, size: 24),
                          onPressed: AudioManager.instance.toggleRepeat,
                        );
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              // Bottom Action Bar: Queue
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.devices, color: Colors.white54, size: 20),
                      onPressed: () {},
                    ),
                    IconButton(
                      icon: const Icon(Icons.queue_music, color: Colors.white70, size: 24),
                      onPressed: _openQueue,
                      tooltip: 'Playback Queue',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  Widget _buildLyricsPanel() {
    if (_loadingLyrics) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF1DB954)));
    }

    if (_parsedLyrics.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFF222222),
          borderRadius: BorderRadius.circular(16),
        ),
        child: SingleChildScrollView(
          child: Text(
            _plainLyrics,
            style: const TextStyle(color: Colors.white, fontSize: 16, height: 1.8),
          ),
        ),
      );
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1c1c1c),
        borderRadius: BorderRadius.circular(16),
      ),
      child: ListView.builder(
        controller: _lyricsScrollController,
        itemCount: _parsedLyrics.length,
        itemBuilder: (ctx, idx) {
          final line = _parsedLyrics[idx];
          final isActive = idx == _activeLyricIndex;

          return GestureDetector(
            onTap: () {
              AudioManager.instance.seek(line.timestamp);
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text(
                line.text.isNotEmpty ? line.text : '• • •',
                style: TextStyle(
                  color: isActive ? Colors.white : Colors.white38,
                  fontSize: isActive ? 20 : 16,
                  fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                  height: 1.4,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  String _fmt(Duration d) {
    final m = d.inMinutes;
    final s = d.inSeconds % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }
}
