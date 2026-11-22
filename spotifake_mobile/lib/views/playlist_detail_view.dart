import 'package:flutter/material.dart';
import '../models/playlist.dart';
import '../models/song.dart';
import '../services/audio_manager.dart';
import '../services/api_service.dart';
import 'add_to_playlist_dialog.dart';

class PlaylistDetailView extends StatefulWidget {
  final Playlist playlist;
  final VoidCallback onPlaylistChanged;

  const PlaylistDetailView({
    super.key,
    required this.playlist,
    required this.onPlaylistChanged,
  });

  @override
  State<PlaylistDetailView> createState() => _PlaylistDetailViewState();
}

class _PlaylistDetailViewState extends State<PlaylistDetailView> {
  late Playlist _playlist;

  @override
  void initState() {
    super.initState();
    _playlist = widget.playlist;
  }

  void _playAll({bool shuffle = false}) {
    if (_playlist.songs.isEmpty) return;
    List<Song> queue = List.from(_playlist.songs);
    if (shuffle) {
      queue.shuffle();
    }
    AudioManager.instance.setQueue(queue, startIndex: 0);
  }

  void _removeSong(Song song) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF282828),
        title: const Text('Remove from playlist?', style: TextStyle(color: Colors.white)),
        content: Text('Remove "${song.title}" from "${_playlist.name}"?', style: const TextStyle(color: Color(0xFFB3B3B3))),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel', style: TextStyle(color: Colors.grey))),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Remove', style: TextStyle(color: Colors.redAccent))),
        ],
      ),
    );

    if (confirm == true) {
      final ok = await ApiService.instance.removeSongFromPlaylist(_playlist.id, song.fileName);
      if (ok) {
        setState(() {
          _playlist.songs.removeWhere((s) => s.fileName == song.fileName);
        });
        widget.onPlaylistChanged();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLikedSongs = _playlist.isLikedSongs;

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 260.0,
            pinned: true,
            backgroundColor: const Color(0xFF121212),
            flexibleSpace: FlexibleSpaceBar(
              titlePadding: const EdgeInsets.only(left: 56, bottom: 16),
              title: Text(
                _playlist.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: isLikedSongs
                        ? [const Color(0xFF450af5), const Color(0xFF121212)]
                        : [const Color(0xFF2e77d0), const Color(0xFF121212)],
                  ),
                ),
                child: Center(
                  child: Container(
                    width: 120,
                    height: 120,
                    margin: const EdgeInsets.only(bottom: 30),
                    decoration: BoxDecoration(
                      color: isLikedSongs ? const Color(0xFF5038a0) : const Color(0xFF282828),
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.5),
                          blurRadius: 16,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Icon(
                        isLikedSongs ? Icons.favorite : Icons.music_note,
                        size: 60,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${_playlist.songs.length} songs',
                        style: const TextStyle(color: Color(0xFFB3B3B3), fontSize: 13),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.shuffle, color: Colors.white70, size: 26),
                        onPressed: () => _playAll(shuffle: true),
                      ),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: () => _playAll(shuffle: false),
                        child: Container(
                          width: 52,
                          height: 52,
                          decoration: const BoxDecoration(
                            color: Color(0xFF1DB954),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.play_arrow, color: Colors.black, size: 34),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          _playlist.songs.isEmpty
              ? const SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Text('This playlist has no songs yet.', style: TextStyle(color: Color(0xFFB3B3B3))),
                  ),
                )
              : SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (ctx, index) {
                      final song = _playlist.songs[index];
                      final coverUrl = ApiService.instance.getCoverUrl(song);

                      return StreamBuilder<Song?>(
                        stream: AudioManager.instance.currentSongStream,
                        builder: (context, songSnap) {
                          final isCurrent = songSnap.data?.id == song.id;

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
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: Icon(
                                    song.isLiked ? Icons.favorite : Icons.favorite_border,
                                    color: song.isLiked ? const Color(0xFF1DB954) : Colors.white54,
                                    size: 20,
                                  ),
                                  onPressed: () async {
                                    await ApiService.instance.toggleFavorite(song);
                                    setState(() {});
                                    widget.onPlaylistChanged();
                                  },
                                ),
                                PopupMenuButton<String>(
                                  icon: const Icon(Icons.more_vert, color: Colors.white54, size: 20),
                                  color: const Color(0xFF282828),
                                  onSelected: (val) {
                                    if (val == 'add_to_playlist') {
                                      showAddToPlaylistSheet(context, song);
                                    } else if (val == 'remove') {
                                      _removeSong(song);
                                    }
                                  },
                                  itemBuilder: (context) => [
                                    const PopupMenuItem(
                                      value: 'add_to_playlist',
                                      child: Row(
                                        children: [
                                          Icon(Icons.playlist_add, color: Colors.white70, size: 18),
                                          SizedBox(width: 8),
                                          Text('Add to playlist', style: TextStyle(color: Colors.white, fontSize: 13)),
                                        ],
                                      ),
                                    ),
                                    if (!isLikedSongs)
                                      const PopupMenuItem(
                                        value: 'remove',
                                        child: Row(
                                          children: [
                                            Icon(Icons.delete, color: Colors.redAccent, size: 18),
                                            SizedBox(width: 8),
                                            Text('Remove from playlist', style: TextStyle(color: Colors.white, fontSize: 13)),
                                          ],
                                        ),
                                      ),
                                  ],
                                ),
                              ],
                            ),
                            onLongPress: () => showAddToPlaylistSheet(context, song),
                            onTap: () {
                              AudioManager.instance.setQueue(_playlist.songs, startIndex: index);
                            },
                          );
                        },
                      );
                    },
                    childCount: _playlist.songs.length,
                  ),
                ),
          const SliverToBoxAdapter(child: SizedBox(height: 80)),
        ],
      ),
    );
  }
}
