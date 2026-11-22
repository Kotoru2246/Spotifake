import 'package:flutter/material.dart';
import '../models/song.dart';
import '../models/playlist.dart';
import '../services/api_service.dart';

void showAddToPlaylistSheet(BuildContext context, Song song) {
  showModalBottomSheet(
    context: context,
    backgroundColor: const Color(0xFF181818),
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    isScrollControlled: true,
    builder: (ctx) => AddToPlaylistSheet(song: song),
  );
}

class AddToPlaylistSheet extends StatefulWidget {
  final Song song;
  const AddToPlaylistSheet({super.key, required this.song});

  @override
  State<AddToPlaylistSheet> createState() => _AddToPlaylistSheetState();
}

class _AddToPlaylistSheetState extends State<AddToPlaylistSheet> {
  late Future<List<Playlist>> _playlistsFuture;
  bool _isAdding = false;

  @override
  void initState() {
    super.initState();
    _loadPlaylists();
  }

  void _loadPlaylists() {
    setState(() {
      _playlistsFuture = ApiService.instance.fetchPlaylists();
    });
  }

  Future<void> _createNewPlaylistAndAdd() async {
    final controller = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF282828),
        title: const Text('New Playlist', style: TextStyle(color: Colors.white)),
        content: TextField(
          controller: controller,
          autofocus: true,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(
            hintText: 'My Playlist Name',
            hintStyle: TextStyle(color: Color(0xFF727272)),
            enabledBorder: UnderlineInputBorder(
              borderSide: BorderSide(color: Color(0xFF1DB954)),
            ),
            focusedBorder: UnderlineInputBorder(
              borderSide: BorderSide(color: Color(0xFF1DB954), width: 2),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFFB3B3B3))),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1DB954)),
            onPressed: () {
              if (controller.text.trim().isNotEmpty) {
                Navigator.pop(ctx, controller.text.trim());
              }
            },
            child: const Text('Create & Add', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (name != null && name.isNotEmpty && mounted) {
      setState(() => _isAdding = true);
      final created = await ApiService.instance.createPlaylist(name);
      if (created) {
        final updated = await ApiService.instance.fetchPlaylists();
        final newPl = updated.firstWhere(
          (p) => p.name == name,
          orElse: () => updated.last,
        );
        final songRef = widget.song.id.isNotEmpty ? widget.song.id : widget.song.fileName;
        final added = await ApiService.instance.addSongToPlaylist(newPl.id, songRef);
        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(added ? 'Added to "${newPl.name}"' : 'Failed to add track'),
              backgroundColor: const Color(0xFF282828),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } else {
        if (mounted) {
          setState(() => _isAdding = false);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to create playlist'),
              backgroundColor: Colors.redAccent,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    }
  }

  Future<void> _addToExistingPlaylist(Playlist pl) async {
    setState(() => _isAdding = true);
    final songRef = widget.song.id.isNotEmpty ? widget.song.id : widget.song.fileName;
    final success = await ApiService.instance.addSongToPlaylist(pl.id, songRef);
    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success ? 'Added to "${pl.name}"' : 'Failed to add to "${pl.name}"'),
          backgroundColor: const Color(0xFF282828),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final coverUrl = ApiService.instance.getCoverUrl(widget.song);

    return Container(
      padding: const EdgeInsets.only(top: 16, bottom: 24),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                ClipRRect(
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
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Add to playlist',
                        style: TextStyle(color: Color(0xFFB3B3B3), fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        widget.song.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        widget.song.artist,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Color(0xFF727272), fontSize: 13),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white70),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const Divider(color: Color(0xFF282828), height: 1),

          // "New playlist" action
          ListTile(
            leading: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFF282828),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Icon(Icons.add, color: Colors.white, size: 24),
            ),
            title: const Text(
              'New playlist',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
            ),
            subtitle: const Text(
              'Create a new playlist and add this track',
              style: TextStyle(color: Color(0xFF727272), fontSize: 12),
            ),
            onTap: _isAdding ? null : _createNewPlaylistAndAdd,
          ),
          const Divider(color: Color(0xFF282828), height: 1),

          // Playlists list
          Expanded(
            child: FutureBuilder<List<Playlist>>(
              future: _playlistsFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(
                    child: CircularProgressIndicator(color: Color(0xFF1DB954)),
                  );
                }
                if (snapshot.hasError) {
                  return Center(
                    child: Text(
                      'Failed to load playlists',
                      style: TextStyle(color: Colors.red[300]),
                    ),
                  );
                }

                // Filter out Liked Songs (custom playlists only)
                final playlists = (snapshot.data ?? []).where((p) => !p.isLikedSongs).toList();

                if (playlists.isEmpty) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(20),
                      child: Text(
                        'No custom playlists yet.\nTap "New playlist" above to create one!',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Color(0xFF727272), fontSize: 14),
                      ),
                    ),
                  );
                }

                return ListView.builder(
                  itemCount: playlists.length,
                  itemBuilder: (ctx, idx) {
                    final pl = playlists[idx];
                    final alreadyIn = pl.songs.any((s) => s.id == widget.song.id || s.fileName == widget.song.fileName);

                    return ListTile(
                      leading: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: const Color(0xFF282828),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Icon(Icons.playlist_play, color: Colors.white70, size: 26),
                      ),
                      title: Text(
                        pl.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15),
                      ),
                      subtitle: Text(
                        '${pl.songs.length} tracks',
                        style: const TextStyle(color: Color(0xFF727272), fontSize: 12),
                      ),
                      trailing: alreadyIn
                          ? const Icon(Icons.check, color: Color(0xFF1DB954), size: 20)
                          : const Icon(Icons.add_circle_outline, color: Colors.white54, size: 20),
                      onTap: _isAdding ? null : () => _addToExistingPlaylist(pl),
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
