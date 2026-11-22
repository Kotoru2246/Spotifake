import 'package:flutter/material.dart';
import '../models/song.dart';
import '../services/audio_manager.dart';
import '../services/api_service.dart';
import 'album_detail_view.dart';
import 'add_to_playlist_dialog.dart';

class ArtistDetailView extends StatefulWidget {
  final String artistName;

  const ArtistDetailView({
    super.key,
    required this.artistName,
  });

  @override
  State<ArtistDetailView> createState() => _ArtistDetailViewState();
}

class _ArtistDetailViewState extends State<ArtistDetailView> {
  bool _isLoading = true;
  String? _error;
  String _name = '';
  String _bannerUrl = '';
  String _profileUrl = '';
  bool _verified = false;
  int _monthlyListeners = 0;
  String _bio = '';
  List<Song> _popularSongs = [];
  List<Map<String, dynamic>> _discography = [];

  @override
  void initState() {
    super.initState();
    _name = widget.artistName;
    _loadArtist();
  }

  Future<void> _loadArtist() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final data = await ApiService.instance.fetchArtistDetails(widget.artistName);
    if (!mounted) return;

    if (data != null) {
      final rawPopular = data['popularSongs'] as List? ?? [];
      final parsedSongs = rawPopular.map((j) {
        final map = j as Map<String, dynamic>;
        return Song(
          id: map['id']?.toString() ?? map['fileName']?.toString() ?? '',
          title: map['title']?.toString() ?? 'Unknown Title',
          artist: map['artist']?.toString() ?? widget.artistName,
          album: map['album']?.toString() ?? '',
          durationSeconds: (map['duration'] as num?)?.toInt() ?? 180,
          fileName: map['fileName']?.toString() ?? '',
          coverArtUrl: map['coverUrl']?.toString(),
        );
      }).toList();

      final rawDisco = data['discography'] as List? ?? [];
      final disco = rawDisco.map((d) => d as Map<String, dynamic>).toList();

      final about = data['about'] as Map<String, dynamic>?;

      setState(() {
        _isLoading = false;
        _name = data['name']?.toString() ?? widget.artistName;
        _bannerUrl = data['bannerUrl']?.toString() ?? '';
        _profileUrl = data['profileUrl']?.toString() ?? '';
        _verified = data['verified'] == true;
        _monthlyListeners = (data['monthlyListeners'] as num?)?.toInt() ?? 0;
        _bio = about?['bio']?.toString() ?? '';
        _popularSongs = parsedSongs;
        _discography = disco;
      });
    } else {
      setState(() {
        _isLoading = false;
        _error = 'Could not load artist details.';
      });
    }
  }

  void _playAll() {
    if (_popularSongs.isEmpty) return;
    AudioManager.instance.setQueue(_popularSongs, startIndex: 0);
  }

  void _openAlbum(Map<String, dynamic> album) {
    final albumId = album['id']?.toString() ?? '';
    final albumTitle = album['title']?.toString() ?? 'Album';
    if (albumId.isEmpty) return;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AlbumDetailView(albumId: albumId, albumTitle: albumTitle),
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
                      ElevatedButton(onPressed: _loadArtist, child: const Text('Retry')),
                    ],
                  ),
                )
              : CustomScrollView(
                  slivers: [
                    SliverAppBar(
                      expandedHeight: 280.0,
                      pinned: true,
                      backgroundColor: const Color(0xFF121212),
                      flexibleSpace: FlexibleSpaceBar(
                        titlePadding: const EdgeInsets.only(left: 56, bottom: 16),
                        title: Row(
                          children: [
                            Text(
                              _name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
                            ),
                            if (_verified) ...[
                              const SizedBox(width: 6),
                              const Icon(Icons.verified, color: Colors.blueAccent, size: 18),
                            ],
                          ],
                        ),
                        background: Stack(
                          fit: StackFit.expand,
                          children: [
                            Image.network(
                              _bannerUrl.isNotEmpty
                                  ? _bannerUrl
                                  : (_profileUrl.isNotEmpty ? _profileUrl : ApiService.instance.getCoverUrl(_name)),
                              fit: BoxFit.cover,
                              errorBuilder: (_, _, _) => Container(
                                color: const Color(0xFF282828),
                                child: const Icon(Icons.person, size: 80, color: Colors.white24),
                              ),
                            ),
                            Container(
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [Colors.transparent, Color(0xFF121212)],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (_monthlyListeners > 0)
                              Text(
                                '${_formatListeners(_monthlyListeners)} monthly listeners',
                                style: const TextStyle(color: Color(0xFFB3B3B3), fontSize: 13),
                              ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                OutlinedButton(
                                  style: OutlinedButton.styleFrom(
                                    side: const BorderSide(color: Colors.white60),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                  ),
                                  onPressed: () {},
                                  child: const Text('Follow', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                ),
                                GestureDetector(
                                  onTap: _playAll,
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
                            const SizedBox(height: 20),
                            const Text('Popular', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                    // Popular Songs
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (ctx, index) {
                          final song = _popularSongs[index];
                          return StreamBuilder<Song?>(
                            stream: AudioManager.instance.currentSongStream,
                            builder: (context, songSnap) {
                              final isCurrent = songSnap.data?.id == song.id;

                              return ListTile(
                                leading: ClipRRect(
                                  borderRadius: BorderRadius.circular(4),
                                  child: Image.network(
                                    ApiService.instance.getCoverUrl(song),
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
                                  song.album,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(color: Color(0xFFB3B3B3), fontSize: 12),
                                ),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
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
                                  AudioManager.instance.setQueue(_popularSongs, startIndex: index);
                                },
                                onLongPress: () => showAddToPlaylistSheet(context, song),
                              );
                            },
                          );
                        },
                        childCount: _popularSongs.length,
                      ),
                    ),
                    // Discography
                    if (_discography.isNotEmpty) ...[
                      const SliverToBoxAdapter(
                        child: Padding(
                          padding: EdgeInsets.fromLTRB(16, 20, 16, 10),
                          child: Text('Discography', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                        ),
                      ),
                      SliverToBoxAdapter(
                        child: SizedBox(
                          height: 190,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _discography.length,
                            separatorBuilder: (_, _) => const SizedBox(width: 14),
                            itemBuilder: (ctx, idx) {
                              final album = _discography[idx];
                              final title = album['title']?.toString() ?? 'Album';
                              final cover = album['coverUrl']?.toString() ?? '';
                              final year = album['year']?.toString() ?? '';

                              return GestureDetector(
                                onTap: () => _openAlbum(album),
                                child: SizedBox(
                                  width: 130,
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(6),
                                        child: Image.network(
                                          cover.isNotEmpty ? cover : ApiService.instance.getCoverUrl(title),
                                          width: 130,
                                          height: 130,
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, _, _) => Container(
                                            width: 130,
                                            height: 130,
                                            color: const Color(0xFF282828),
                                            child: const Icon(Icons.album, size: 50, color: Colors.white30),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        title,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                      ),
                                      if (year.isNotEmpty)
                                        Text(year, style: const TextStyle(color: Color(0xFFB3B3B3), fontSize: 11)),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                    ],
                    if (_bio.isNotEmpty) ...[
                      const SliverToBoxAdapter(
                        child: Padding(
                          padding: EdgeInsets.fromLTRB(16, 20, 16, 8),
                          child: Text('About', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                        ),
                      ),
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1c1c1c),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              _bio,
                              style: const TextStyle(color: Color(0xFFB3B3B3), fontSize: 14, height: 1.5),
                            ),
                          ),
                        ),
                      ),
                    ],
                    const SliverToBoxAdapter(child: SizedBox(height: 80)),
                  ],
                ),
    );
  }

  String _formatListeners(int num) {
    if (num >= 1000000) {
      return '${(num / 1000000).toStringAsFixed(1)}M';
    }
    if (num >= 1000) {
      return '${(num / 1000).toStringAsFixed(1)}K';
    }
    return num.toString();
  }

  String _fmtDur(int sec) {
    final m = sec ~/ 60;
    final s = sec % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }
}
