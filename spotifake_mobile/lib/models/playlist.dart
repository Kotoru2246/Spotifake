import 'song.dart';

class Playlist {
  final String id;
  final String name;
  final String description;
  final String? imageUrl;
  final bool isPublic;
  final bool isOwner;
  final String type;
  final List<Song> songs;

  Playlist({
    required this.id,
    required this.name,
    this.description = '',
    this.imageUrl,
    this.isPublic = true,
    this.isOwner = true,
    this.type = 'Playlist',
    required this.songs,
  });

  bool get isLikedSongs => id.startsWith('liked-songs') || name.toLowerCase() == 'liked songs';

  factory Playlist.fromJson(Map<String, dynamic> json) {
    final rawId = json['id'] ?? json['Id'] ?? '';
    final rawName = json['name'] ?? json['Name'] ?? 'Untitled Playlist';
    final rawDesc = json['description'] ?? json['Description'] ?? '';
    final rawImage = json['imageUrl'] ?? json['ImageUrl'];
    final rawPublic = json['isPublic'] ?? json['IsPublic'] ?? true;
    final rawOwner = json['isOwner'] ?? json['IsOwner'] ?? true;
    final rawType = json['type'] ?? json['Type'] ?? 'Playlist';

    List<Song> parsedSongs = [];
    if (json['songs'] is List) {
      parsedSongs = (json['songs'] as List).map((s) => Song.fromJson(s as Map<String, dynamic>)).toList();
    }

    return Playlist(
      id: rawId.toString(),
      name: rawName.toString(),
      description: rawDesc.toString(),
      imageUrl: rawImage?.toString(),
      isPublic: rawPublic == true,
      isOwner: rawOwner == true,
      type: rawType.toString(),
      songs: parsedSongs,
    );
  }
}
