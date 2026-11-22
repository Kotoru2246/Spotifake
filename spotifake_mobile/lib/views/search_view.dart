import 'dart:async';
import 'package:flutter/material.dart';
import '../models/song.dart';
import '../services/audio_manager.dart';
import '../services/api_service.dart';
import 'artist_detail_view.dart';
import 'album_detail_view.dart';
import 'add_to_playlist_dialog.dart';

class SearchView extends StatefulWidget {
  const SearchView({super.key});

  @override
  State<SearchView> createState() => _SearchViewState();
}

class _SearchViewState extends State<SearchView> {
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounce;
  bool _isSearching = false;
  String _selectedCategory = 'All';

  List<Song> _songs = [];
  List<Map<String, dynamic>> _albums = [];
  List<Map<String, dynamic>> _artists = [];

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    _debounce?.cancel();
    if (query.trim().isEmpty) {
      setState(() {
        _isSearching = false;
        _songs = [];
        _albums = [];
        _artists = [];
      });
      return;
    }

    _debounce = Timer(const Duration(milliseconds: 300), () async {
      setState(() => _isSearching = true);
      final results = await ApiService.instance.search(query);
      if (mounted) {
        setState(() {
          _isSearching = false;
          _songs = results['songs'] as List<Song>;
          _albums = results['albums'] as List<Map<String, dynamic>>;
          _artists = results['artists'] as List<Map<String, dynamic>>;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final queryEmpty = _searchController.text.trim().isEmpty;

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF121212),
        elevation: 0,
        title: const Text('Search', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: Colors.white)),
      ),
      body: Column(
        children: [
          // Search Input
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: TextField(
              controller: _searchController,
              onChanged: _onSearchChanged,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                filled: true,
                fillColor: const Color(0xFF282828),
                prefixIcon: const Icon(Icons.search, color: Color(0xFFB3B3B3)),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: Color(0xFFB3B3B3)),
                        onPressed: () {
                          _searchController.clear();
                          _onSearchChanged('');
                        },
                      )
                    : null,
                hintText: 'What do you want to listen to?',
                hintStyle: const TextStyle(color: Color(0xFF727272), fontSize: 14),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
            ),
          ),

          // Category Chips
          if (!queryEmpty)
            SizedBox(
              height: 38,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: ['All', 'Songs', 'Artists', 'Albums'].map((cat) {
                  final isSelected = _selectedCategory == cat;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      selected: isSelected,
                      label: Text(cat),
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.black : Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                      backgroundColor: const Color(0xFF282828),
                      selectedColor: const Color(0xFF1DB954),
                      checkmarkColor: Colors.black,
                      onSelected: (val) {
                        setState(() => _selectedCategory = cat);
                      },
                    ),
                  );
                }).toList(),
              ),
            ),

          const SizedBox(height: 8),

          // Main Search Body
          Expanded(
            child: queryEmpty
                ? _buildBrowseCategories()
                : _isSearching
                    ? const Center(child: CircularProgressIndicator(color: Color(0xFF1DB954)))
                    : _buildSearchResults(),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchResults() {
    final showSongs = _selectedCategory == 'All' || _selectedCategory == 'Songs';
    final showArtists = _selectedCategory == 'All' || _selectedCategory == 'Artists';
    final showAlbums = _selectedCategory == 'All' || _selectedCategory == 'Albums';

    if (_songs.isEmpty && _albums.isEmpty && _artists.isEmpty) {
      return const Center(
        child: Text('No results found', style: TextStyle(color: Color(0xFFB3B3B3), fontSize: 16)),
      );
    }

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        if (showSongs && _songs.isNotEmpty) ...[
          const Text('Songs', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ..._songs.map((song) {
            final coverUrl = ApiService.instance.getCoverUrl(song);
            return ListTile(
              contentPadding: const EdgeInsets.symmetric(vertical: 2),
              leading: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: Image.network(
                  coverUrl,
                  width: 46,
                  height: 46,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => Container(
                    width: 46,
                    height: 46,
                    color: const Color(0xFF282828),
                    child: const Icon(Icons.music_note, color: Colors.white30),
                  ),
                ),
              ),
              title: Text(song.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
              subtitle: Text(song.artist, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFFB3B3B3), fontSize: 12)),
              trailing: IconButton(
                icon: const Icon(Icons.more_vert, color: Colors.white54, size: 20),
                tooltip: 'Add to playlist',
                onPressed: () => showAddToPlaylistSheet(context, song),
              ),
              onTap: () {
                AudioManager.instance.playSong(song, queue: _songs);
              },
              onLongPress: () => showAddToPlaylistSheet(context, song),
            );
          }),
          const SizedBox(height: 16),
        ],

        if (showArtists && _artists.isNotEmpty) ...[
          const Text('Artists', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ..._artists.map((artist) {
            final name = artist['title'] ?? artist['Title'] ?? artist['name'] ?? 'Artist';
            return ListTile(
              contentPadding: const EdgeInsets.symmetric(vertical: 2),
              leading: const CircleAvatar(
                radius: 23,
                backgroundColor: Color(0xFF282828),
                child: Icon(Icons.person, color: Colors.white54),
              ),
              title: Text(name.toString(), style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
              subtitle: const Text('Artist', style: TextStyle(color: Color(0xFFB3B3B3), fontSize: 12)),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => ArtistDetailView(artistName: name.toString()),
                  ),
                );
              },
            );
          }),
          const SizedBox(height: 16),
        ],

        if (showAlbums && _albums.isNotEmpty) ...[
          const Text('Albums', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ..._albums.map((album) {
            final title = album['title'] ?? album['Title'] ?? 'Album';
            final artist = album['creator'] ?? album['Creator'] ?? 'Unknown Artist';
            final albumId = album['id']?.toString() ?? album['Id']?.toString() ?? '';
            return ListTile(
              contentPadding: const EdgeInsets.symmetric(vertical: 2),
              leading: Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(color: const Color(0xFF282828), borderRadius: BorderRadius.circular(4)),
                child: const Icon(Icons.album, color: Colors.white54),
              ),
              title: Text(title.toString(), style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
              subtitle: Text('Album • $artist', style: const TextStyle(color: Color(0xFFB3B3B3), fontSize: 12)),
              onTap: () {
                if (albumId.isNotEmpty) {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => AlbumDetailView(albumId: albumId, albumTitle: title.toString()),
                    ),
                  );
                }
              },
            );
          }),
        ],
        const SizedBox(height: 80),
      ],
    );
  }

  Widget _buildBrowseCategories() {
    final categories = [
      {'title': 'Pop', 'color': const Color(0xFF8c1932)},
      {'title': 'Rock', 'color': const Color(0xFFe91429)},
      {'title': 'Hip-Hop', 'color': const Color(0xFFba5d07)},
      {'title': 'Chill', 'color': const Color(0xFF477d95)},
      {'title': 'J-Pop & Anime', 'color': const Color(0xFF006450)},
      {'title': 'Indie', 'color': const Color(0xFF503750)},
    ];

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        const Text(
          'Browse all',
          style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.6,
          ),
          itemCount: categories.length,
          itemBuilder: (ctx, index) {
            final cat = categories[index];
            final color = cat['color'] as Color;

            return Container(
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(8),
              ),
              padding: const EdgeInsets.all(12),
              child: Text(
                cat['title'] as String,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
              ),
            );
          },
        ),
      ],
    );
  }
}
