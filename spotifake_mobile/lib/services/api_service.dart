import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/song.dart';
import '../models/playlist.dart';

class ApiService {
  static final ApiService instance = ApiService._internal();
  ApiService._internal();

  String _baseUrl = 'https://contractors-gps-policies-cloud.trycloudflare.com';
  String get baseUrl => _baseUrl;

  final StreamController<String> _urlController = StreamController<String>.broadcast();
  Stream<String> get urlStream => _urlController.stream;

  Set<String> _likedSongFileNames = {};
  Set<String> get likedSongFileNames => _likedSongFileNames;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('server_url');
    if (saved != null && saved.isNotEmpty) {
      _baseUrl = _sanitizeUrl(saved);
    }
  }

  String _sanitizeUrl(String input) {
    String clean = input.trim();
    if (clean == '102') clean = '192.168.30.102:8000';
    if (clean == '104') clean = '192.168.30.104:8000';
    if (clean.endsWith('/')) {
      clean = clean.substring(0, clean.length - 1);
    }
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'http://$clean';
    }
    final parsed = Uri.tryParse(clean);
    if (parsed != null && !parsed.hasPort && !clean.contains('trycloudflare.com') && !clean.startsWith('https://')) {
      clean = '$clean:8000';
    }
    return clean;
  }

  Future<void> setServerUrl(String newUrl) async {
    _baseUrl = _sanitizeUrl(newUrl);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('server_url', _baseUrl);
    _urlController.add(_baseUrl);
  }

  String getStreamUrl(dynamic songOrId) {
    String id = '';
    if (songOrId is Song) {
      id = songOrId.id.isNotEmpty ? songOrId.id : songOrId.fileName;
    } else {
      id = songOrId.toString();
    }
    return '$_baseUrl/api/music/stream/${Uri.encodeComponent(id)}';
  }

  String getCoverUrl(dynamic songOrId) {
    if (songOrId is Song) {
      if (songOrId.coverArtUrl != null && songOrId.coverArtUrl!.startsWith('http')) {
        return songOrId.coverArtUrl!;
      }
      final target = songOrId.id.isNotEmpty ? songOrId.id : songOrId.fileName;
      return '$_baseUrl/api/music/cover/${Uri.encodeComponent(target)}';
    }
    final str = songOrId.toString();
    if (str.startsWith('http')) return str;
    return '$_baseUrl/api/music/cover/${Uri.encodeComponent(str)}';
  }

  Future<bool> checkConnection() async {
    try {
      final res = await http.get(Uri.parse('$_baseUrl/api/music')).timeout(const Duration(seconds: 4));
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  Future<List<Song>> fetchSongs() async {
    final res = await http.get(Uri.parse('$_baseUrl/api/music')).timeout(const Duration(seconds: 8));
    if (res.statusCode == 200) {
      final List<dynamic> list = jsonDecode(utf8.decode(res.bodyBytes));
      return list.map((j) {
        final song = Song.fromJson(j as Map<String, dynamic>);
        song.isLiked = _likedSongFileNames.contains(song.fileName) || _likedSongFileNames.contains(song.id);
        return song;
      }).toList();
    }
    throw Exception('Failed to load songs: HTTP ${res.statusCode}');
  }

  Future<List<Playlist>> fetchPlaylists() async {
    final res = await http.get(Uri.parse('$_baseUrl/api/playlists/my')).timeout(const Duration(seconds: 8));
    if (res.statusCode == 200) {
      final List<dynamic> list = jsonDecode(utf8.decode(res.bodyBytes));
      final playlists = list.map((j) => Playlist.fromJson(j as Map<String, dynamic>)).toList();

      for (var pl in playlists) {
        if (pl.isLikedSongs) {
          _likedSongFileNames = pl.songs.map((s) => s.fileName).toSet();
          _likedSongFileNames.addAll(pl.songs.map((s) => s.id));
        }
      }
      return playlists;
    }
    throw Exception('Failed to load playlists: HTTP ${res.statusCode}');
  }

  Future<bool> toggleFavorite(Song song) async {
    try {
      final res = await http.post(
        Uri.parse('$_baseUrl/api/playlists/toggle-favorite'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'songFileName': song.fileName,
          'songId': song.id,
          'fileName': song.fileName,
        }),
      ).timeout(const Duration(seconds: 6));

      if (res.statusCode == 200) {
        if (_likedSongFileNames.contains(song.fileName)) {
          _likedSongFileNames.remove(song.fileName);
          _likedSongFileNames.remove(song.id);
          song.isLiked = false;
        } else {
          _likedSongFileNames.add(song.fileName);
          _likedSongFileNames.add(song.id);
          song.isLiked = true;
        }
        return true;
      }
    } catch (_) {}
    return false;
  }

  Future<bool> createPlaylist(String name) async {
    try {
      final res = await http.post(
        Uri.parse('$_baseUrl/api/playlists'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': name,
          'imageUrl': '',
          'songFileNames': [],
        }),
      ).timeout(const Duration(seconds: 6));
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  Future<bool> deletePlaylist(String playlistId) async {
    try {
      final res = await http.delete(
        Uri.parse('$_baseUrl/api/playlists/$playlistId'),
      ).timeout(const Duration(seconds: 6));
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  Future<bool> addSongToPlaylist(String playlistId, String songRef) async {
    try {
      final res = await http.post(
        Uri.parse('$_baseUrl/api/playlists/$playlistId/songs'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'songFileName': songRef, 'songId': songRef}),
      ).timeout(const Duration(seconds: 6));
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  Future<bool> removeSongFromPlaylist(String playlistId, String songRef) async {
    try {
      final res = await http.delete(
        Uri.parse('$_baseUrl/api/playlists/$playlistId/songs'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'songFileName': songRef, 'songId': songRef}),
      ).timeout(const Duration(seconds: 6));
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  Future<Map<String, dynamic>> search(String query) async {
    if (query.trim().isEmpty) {
      return {'songs': <Song>[], 'albums': [], 'artists': []};
    }
    try {
      final res = await http.get(
        Uri.parse('$_baseUrl/api/search?q=${Uri.encodeComponent(query)}'),
      ).timeout(const Duration(seconds: 6));

      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        List<Song> songs = [];
        List<Map<String, dynamic>> albums = [];
        List<Map<String, dynamic>> artists = [];

        final items = data['items'] ?? data['songs'] ?? [];
        if (items is List) {
          for (var item in items) {
            final type = (item['type'] ?? item['Type'] ?? 'Song').toString().toLowerCase();
            if (type == 'song') {
              songs.add(Song.fromJson(item as Map<String, dynamic>));
            } else if (type == 'album') {
              albums.add(item as Map<String, dynamic>);
            } else if (type == 'artist') {
              artists.add(item as Map<String, dynamic>);
            }
          }
        }
        return {'songs': songs, 'albums': albums, 'artists': artists};
      }
    } catch (_) {}
    return {'songs': <Song>[], 'albums': [], 'artists': []};
  }

  Future<String> fetchLyrics(String songId) async {
    try {
      final res = await http.get(Uri.parse('$_baseUrl/api/music/lyrics/$songId')).timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        final decoded = jsonDecode(utf8.decode(res.bodyBytes));
        if (decoded is Map && decoded['lyrics'] != null) {
          return decoded['lyrics'].toString().trim();
        } else if (decoded is String) {
          return decoded.trim();
        }
      }
    } catch (_) {}
    return '';
  }

  Future<void> recordPlay(String songId) async {
    try {
      await http.post(
        Uri.parse('$_baseUrl/api/music/play'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'songId': songId}),
      ).timeout(const Duration(seconds: 3));
    } catch (_) {}
  }

  Future<Map<String, dynamic>?> fetchArtistDetails(String nameOrId) async {
    try {
      final res = await http.get(
        Uri.parse('$_baseUrl/artist/details?name=${Uri.encodeComponent(nameOrId)}'),
      ).timeout(const Duration(seconds: 8));
      if (res.statusCode == 200) {
        return jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  Future<Map<String, dynamic>?> fetchAlbumDetails(String albumId) async {
    try {
      final res = await http.get(
        Uri.parse('$_baseUrl/api/albums/$albumId'),
      ).timeout(const Duration(seconds: 8));
      if (res.statusCode == 200) {
        return jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  Future<Map<String, dynamic>?> startDownloadJob(String query) async {
    try {
      final res = await http.post(
        Uri.parse('$_baseUrl/api/downloader/download'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'query': query}),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        return jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  Future<Map<String, dynamic>?> fetchDownloadJob(String jobId) async {
    try {
      final res = await http.get(
        Uri.parse('$_baseUrl/api/downloader/jobs/$jobId'),
      ).timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        return jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }
}
