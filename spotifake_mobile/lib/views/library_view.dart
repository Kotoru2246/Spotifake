import 'package:flutter/material.dart';
import '../models/playlist.dart';
import '../services/api_service.dart';
import 'playlist_detail_view.dart';
import 'add_album_dialog.dart';

class LibraryView extends StatefulWidget {
  const LibraryView({super.key});

  @override
  State<LibraryView> createState() => _LibraryViewState();
}

class _LibraryViewState extends State<LibraryView> {
  List<Playlist> _playlists = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPlaylists();
  }

  Future<void> _loadPlaylists() async {
    setState(() => _isLoading = true);
    try {
      final list = await ApiService.instance.fetchPlaylists();
      if (mounted) {
        setState(() {
          _playlists = list;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _openCreateDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF282828),
        title: const Text('New Playlist', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: TextField(
          controller: controller,
          autofocus: true,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(
            hintText: 'Give your playlist a title',
            hintStyle: TextStyle(color: Colors.grey),
            enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFF1DB954))),
            focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFF1DB954), width: 2)),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1DB954),
              foregroundColor: Colors.black,
            ),
            onPressed: () async {
              final name = controller.text.trim();
              if (name.isNotEmpty) {
                Navigator.pop(ctx);
                final ok = await ApiService.instance.createPlaylist(name);
                if (ok) _loadPlaylists();
              }
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  void _deletePlaylist(Playlist pl) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF282828),
        title: Text('Delete "${pl.name}"?', style: const TextStyle(color: Colors.white)),
        content: const Text('This will delete the playlist from your library.', style: TextStyle(color: Color(0xFFB3B3B3))),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel', style: TextStyle(color: Colors.grey))),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete', style: TextStyle(color: Colors.redAccent))),
        ],
      ),
    );

    if (confirm == true) {
      final ok = await ApiService.instance.deletePlaylist(pl.id);
      if (ok) _loadPlaylists();
    }
  }

  void _openPlaylist(Playlist pl) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PlaylistDetailView(
          playlist: pl,
          onPlaylistChanged: _loadPlaylists,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF121212),
        elevation: 0,
        title: const Text('Your Library', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: Colors.white)),
        actions: [
          IconButton(
            icon: const Icon(Icons.download_for_offline_outlined, color: Colors.white, size: 26),
            onPressed: () async {
              final done = await showDialog<bool>(
                context: context,
                builder: (_) => const AddAlbumDialog(),
              );
              if (done == true) _loadPlaylists();
            },
            tooltip: 'Add Album / Import Songs',
          ),
          IconButton(
            icon: const Icon(Icons.add, color: Colors.white, size: 28),
            onPressed: _openCreateDialog,
            tooltip: 'Create Playlist',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF1DB954)))
          : RefreshIndicator(
              color: const Color(0xFF1DB954),
              onRefresh: _loadPlaylists,
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                itemCount: _playlists.length,
                itemBuilder: (ctx, index) {
                  final pl = _playlists[index];
                  final isLiked = pl.isLikedSongs;

                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(vertical: 4),
                    leading: Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        gradient: isLiked
                            ? const LinearGradient(colors: [Color(0xFF450af5), Color(0xFF8e8ee5)])
                            : const LinearGradient(colors: [Color(0xFF282828), Color(0xFF383838)]),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Center(
                        child: Icon(
                          isLiked ? Icons.favorite : Icons.music_note,
                          color: Colors.white,
                          size: 28,
                        ),
                      ),
                    ),
                    title: Text(
                      pl.name,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    subtitle: Text(
                      'Playlist • ${pl.songs.length} songs',
                      style: const TextStyle(color: Color(0xFFB3B3B3), fontSize: 13),
                    ),
                    trailing: isLiked
                        ? null
                        : PopupMenuButton<String>(
                            icon: const Icon(Icons.more_vert, color: Colors.white54),
                            color: const Color(0xFF282828),
                            onSelected: (val) {
                              if (val == 'delete') _deletePlaylist(pl);
                            },
                            itemBuilder: (context) => [
                              const PopupMenuItem(
                                value: 'delete',
                                child: Row(
                                  children: [
                                    Icon(Icons.delete, color: Colors.redAccent, size: 18),
                                    SizedBox(width: 8),
                                    Text('Delete playlist', style: TextStyle(color: Colors.white, fontSize: 13)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                    onTap: () => _openPlaylist(pl),
                  );
                },
              ),
            ),
    );
  }
}
