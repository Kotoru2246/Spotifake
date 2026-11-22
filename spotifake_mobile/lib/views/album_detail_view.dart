import 'package:flutter/material.dart';
import '../models/song.dart';
import '../services/audio_manager.dart';
import '../services/api_service.dart';
import 'artist_detail_view.dart';
import 'add_to_playlist_dialog.dart';

class AlbumDetailView extends StatefulWidget {
  final String albumId;
  final String albumTitle;

  const AlbumDetailView({
    super.key,
    required this.albumId,
    required this.albumTitle,
  });

  @override
  State<AlbumDetailView> createState() => _AlbumDetailViewState();
}

class _AlbumDetailViewState extends State<AlbumDetailView> {
  bool _isLoading = true;
  String? _error;
  String _title = '';
  String _coverUrl = '';
  List<Song> _songs = [];
  String _artistName = '';

  @override
  void initState() {
    super.initState();
    _title = widget.albumTitle;
    _loadAlbum();
  }

  Future<void> _loadAlbum() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final data = await ApiService.instance.fetchAlbumDetails(widget.albumId);
    if (!mounted) return;

    if (data != null) {
      final rawSongs = data['songs'] as List? ?? [];
      final parsed = rawSongs.map((j) => Song.fromJson(j as Map<String, dynamic>)).toList();
      final artist = parsed.isNotEmpty ? parsed.first.artist : '';

      setState(() {
        _isLoading = false;
        _title = data['title']?.toString() ?? data['name']?.toString() ?? widget.albumTitle;
        _coverUrl = data['coverUrl']?.toString() ?? data['imageUrl']?.toString() ?? '';
        _songs = parsed;
        _artistName = artist;
      });
    } else {
      setState(() {
        _isLoading = false;
        _error = 'Could not load album details.';
      });
    }
  }

  void _playAll({bool shuffle = false}) {
    if (_songs.isEmpty) return;
    final queue = List<Song>.from(_songs);
    if (shuffle) queue.shuffle();
    AudioManager.instance.setQueue(queue, startIndex: 0);
  }

  void _openArtist() {
    if (_artistName.isEmpty) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ArtistDetailView(artistName: _artistName),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF1DB954)))
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_error!, style: const TextStyle(color: Colors.white70)),
                      const SizedBox(height: 12),
                      ElevatedButton(onPressed: _loadAlbum, child: const Text('Retry')),
                    ],
                  ),
                )
              : CustomScrollView(
                  slivers: [
                    SliverAppBar(
                      expandedHeight: 300.0,
                      pinned: true,
                      backgroundColor: const Color(0xFF121212),
                      flexibleSpace: FlexibleSpaceBar(
                        titlePadding: const EdgeInsets.only(left: 56, bottom: 16),
                        title: Text(
                          _title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                        ),
                        background: Container(
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [Color(0xFF2e77d0), Color(0xFF121212)],
                            ),
                          ),
                          child: Center(
                            child: Container(
                              width: 140,
                              height: 140,
                              margin: const EdgeInsets.only(bottom: 24),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.5),
                                    blurRadius: 18,
                                    offset: const Offset(0, 8),
                                  ),
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.network(
                                  _coverUrl.isNotEmpty ? _coverUrl : ApiService.instance.getCoverUrl(_title),
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, _, _) => Container(
                                    color: const Color(0xFF282828),
                                    child: const Icon(Icons.album, size: 60, color: Colors.white30),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (_artistName.isNotEmpty)
                              GestureDetector(
                                onTap: _openArtist,
                                child: Row(
                                  children: [
                                    const CircleAvatar(
                                      radius: 12,
                                      backgroundColor: Color(0xFF282828),
                                      child: Icon(Icons.person, size: 14, color: Colors.white),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      _artistName,
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                                    ),
                                    const Icon(Icons.chevron_right, color: Color(0xFFB3B3B3), size: 18),
                                  ],
                                ),
                              ),
                            const SizedBox(height: 6),
                            Text(
                              'Album • ${_songs.length} songs',
                              style: const TextStyle(color: Color(0xFFB3B3B3), fontSize: 12),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.shuffle, color: Colors.white70, size: 26),
                                  onPressed: () => _playAll(shuffle: true),
                                ),
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
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (ctx, index) {
                          final song = _songs[index];
                          return StreamBuilder<Song?>(
                            stream: AudioManager.instance.currentSongStream,
                            builder: (context, songSnap) {
                              final isCurrent = songSnap.data?.id == song.id;

                              return ListTile(
                                leading: SizedBox(
                                  width: 28,
                                  child: Center(
                                    child: isCurrent
                                        ? const Icon(Icons.volume_up, color: Color(0xFF1DB954), size: 18)
                                        : Text('${index + 1}', style: const TextStyle(color: Color(0xFF727272), fontSize: 14)),
                                  ),
                                ),
                                title: Text(
                                  song.title,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    color: isCurrent ? const Color(0xFF1DB954) : Colors.white,
                                    fontWeight: isCurrent ? FontWeight.bold : FontWeight.w500,
                                    fontSize: 15,
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
                                      },
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.more_vert, color: Colors.white54, size: 20),
                                      tooltip: 'Add to playlist',
                                      onPressed: () => showAddToPlaylistSheet(context, song),
                                    ),
                                    Text(
                                      _fmtDur(song.durationSeconds),
                                      style: const TextStyle(color: Color(0xFF727272), fontSize: 12),
                                    ),
                                  ],
                                ),
                                onTap: () {
                                  AudioManager.instance.setQueue(_songs, startIndex: index);
                                },
                                onLongPress: () => showAddToPlaylistSheet(context, song),
                              );
                            },
                          );
                        },
                        childCount: _songs.length,
                      ),
                    ),
                    const SliverToBoxAdapter(child: SizedBox(height: 80)),
                  ],
                ),
    );
  }

  String _fmtDur(int sec) {
    final m = sec ~/ 60;
    final s = sec % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }
}
