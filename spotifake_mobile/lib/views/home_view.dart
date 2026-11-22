import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import '../models/song.dart';
import '../models/playlist.dart';
import '../services/audio_manager.dart';
import '../services/api_service.dart';
import 'playlist_detail_view.dart';
import 'server_settings_dialog.dart';
import 'artist_detail_view.dart';
import 'add_album_dialog.dart';
import 'add_to_playlist_dialog.dart';

class HomeView extends StatefulWidget {
  const HomeView({super.key});

  @override
  State<HomeView> createState() => _HomeViewState();
}

class _HomeViewState extends State<HomeView> {
  List<Song> _allSongs = [];
  List<Playlist> _playlists = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _checkNotificationPermission();
    _loadData();
  }

  void _checkNotificationPermission() async {
    try {
      final status = await Permission.notification.status;
      if (!status.isGranted) {
        await Permission.notification.request();
      }
    } catch (_) {}
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final songsFuture = ApiService.instance.fetchSongs();
      final playlistsFuture = ApiService.instance.fetchPlaylists();

      final results = await Future.wait([songsFuture, playlistsFuture]);
      final songs = results[0] as List<Song>;
      final playlists = results[1] as List<Playlist>;

      if (mounted) {
        setState(() {
          _allSongs = songs;
          _playlists = playlists;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = e.toString();
        });
      }
    }
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  void _openPlaylist(Playlist pl) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PlaylistDetailView(
          playlist: pl,
          onPlaylistChanged: _loadData,
        ),
      ),
    );
  }

  void _playMix(String title, List<Song> songs) {
    if (songs.isEmpty) return;
    final mix = List<Song>.from(songs)..shuffle();
    AudioManager.instance.setQueue(mix, startIndex: 0);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF121212),
        elevation: 0,
        title: Text(
          _getGreeting(),
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 22, color: Colors.white),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.download_for_offline_outlined, color: Colors.white70),
            onPressed: () async {
              final done = await showDialog<bool>(
                context: context,
                builder: (_) => const AddAlbumDialog(),
              );
              if (done == true) _loadData();
            },
            tooltip: 'Add Album / Import Songs',
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            onPressed: _loadData,
            tooltip: 'Refresh library',
          ),
          IconButton(
            icon: const Icon(Icons.settings, color: Colors.white70),
            onPressed: () async {
              final changed = await showDialog<bool>(
                context: context,
                builder: (_) => const ServerSettingsDialog(),
              );
              if (changed == true) {
                _loadData();
              }
            },
            tooltip: 'Server Settings',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF1DB954)))
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.cloud_off, size: 64, color: Colors.redAccent),
                        const SizedBox(height: 16),
                        Text(
                          _error!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: Colors.white70, fontSize: 14),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF1DB954),
                            foregroundColor: Colors.black,
                          ),
                          icon: const Icon(Icons.settings),
                          label: const Text('Change Server'),
                          onPressed: () async {
                            final changed = await showDialog<bool>(
                              context: context,
                              builder: (_) => const ServerSettingsDialog(),
                            );
                            if (changed == true) _loadData();
                          },
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  color: const Color(0xFF1DB954),
                  onRefresh: _loadData,
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: [
                      const SizedBox(height: 8),

                      // Quick Access Grid (Liked Songs + User Playlists)
                      _buildQuickGrid(),

                      const SizedBox(height: 24),

                      // Made For You
                      const Text(
                        'Made For You',
                        style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 12),
                      _buildDailyMixes(),

                      const SizedBox(height: 28),

                      // Songs Section
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'All Songs',
                            style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            '${_allSongs.length} tracks',
                            style: const TextStyle(color: Color(0xFFB3B3B3), fontSize: 13),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      _buildSongList(),

                      const SizedBox(height: 80),
                    ],
                  ),
                ),
    );
  }

  Widget _buildQuickGrid() {
    final likedPl = _playlists.firstWhere(
      (p) => p.isLikedSongs,
      orElse: () => Playlist(id: 'liked-songs', name: 'Liked Songs', songs: []),
    );

    final displayItems = <Widget>[
      _buildQuickCard(
        title: 'Liked Songs',
        icon: Icons.favorite,
        iconColor: Colors.white,
        bgGradient: [const Color(0xFF450af5), const Color(0xFF8e8ee5)],
        onTap: () => _openPlaylist(likedPl),
      ),
    ];

    for (var pl in _playlists.where((p) => !p.isLikedSongs).take(5)) {
      displayItems.add(
        _buildQuickCard(
          title: pl.name,
          icon: Icons.music_note,
          iconColor: Colors.white70,
          bgGradient: [const Color(0xFF282828), const Color(0xFF383838)],
          onTap: () => _openPlaylist(pl),
        ),
      );
    }

    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 8,
      mainAxisSpacing: 8,
      childAspectRatio: 3.0,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: displayItems,
    );
  }

  Widget _buildQuickCard({
    required String title,
    required IconData icon,
    required Color iconColor,
    required List<Color> bgGradient,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF282828),
          borderRadius: BorderRadius.circular(6),
        ),
        clipBehavior: Clip.antiAlias,
        child: Row(
          children: [
            Container(
              width: 52,
              height: double.infinity,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: bgGradient),
              ),
              child: Icon(icon, color: iconColor, size: 24),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDailyMixes() {
    if (_allSongs.isEmpty) return const SizedBox.shrink();

    final mixes = [
      {'title': 'Daily Mix 1', 'sub': 'Upbeat & Energy', 'color': Colors.deepOrange},
      {'title': 'Daily Mix 2', 'sub': 'Chill & Acoustic', 'color': Colors.teal},
      {'title': 'Daily Mix 3', 'sub': 'Vocal & Melodic', 'color': Colors.purple},
      {'title': 'Discover Weekly', 'sub': 'Fresh tracks picked for you', 'color': Colors.indigo},
    ];

    return SizedBox(
      height: 180,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: mixes.length,
        separatorBuilder: (_, _) => const SizedBox(width: 14),
        itemBuilder: (ctx, index) {
          final mix = mixes[index];
          final color = mix['color'] as Color;

          return GestureDetector(
            onTap: () => _playMix(mix['title'] as String, _allSongs),
            child: SizedBox(
              width: 130,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 130,
                    height: 130,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [color.withOpacity(0.8), color.withOpacity(0.4)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Icon(Icons.equalizer, color: Colors.white, size: 28),
                        Text(
                          mix['title'] as String,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    mix['sub'] as String,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Color(0xFFB3B3B3), fontSize: 11),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSongList() {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _allSongs.length,
      itemBuilder: (ctx, index) {
        final song = _allSongs[index];
        final coverUrl = ApiService.instance.getCoverUrl(song);

        return StreamBuilder<Song?>(
          stream: AudioManager.instance.currentSongStream,
          builder: (context, songSnap) {
            final isCurrent = songSnap.data?.id == song.id;

            return ListTile(
              contentPadding: const EdgeInsets.symmetric(vertical: 2),
              leading: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: Image.network(
                  coverUrl,
                  width: 48,
                  height: 48,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => Container(
                    width: 48,
                    height: 48,
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
                  fontSize: 15,
                ),
              ),
              subtitle: GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ArtistDetailView(artistName: song.artist),
                    ),
                  );
                },
                child: Text(
                  '${song.artist} • ${song.album}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Color(0xFFB3B3B3), fontSize: 13),
                ),
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
                ],
              ),
              onTap: () {
                AudioManager.instance.setQueue(_allSongs, startIndex: index);
              },
              onLongPress: () => showAddToPlaylistSheet(context, song),
            );
          },
        );
      },
    );
  }
}
