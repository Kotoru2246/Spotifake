class Song {
  final String id;
  final String title;
  final String artist;
  final String album;
  final int durationSeconds;
  final String fileName;
  final String? coverArtUrl;
  final String? lyrics;
  bool isLiked;

  Song({
    required this.id,
    required this.title,
    required this.artist,
    required this.album,
    required this.durationSeconds,
    required this.fileName,
    this.coverArtUrl,
    this.lyrics,
    this.isLiked = false,
  });

  factory Song.fromJson(Map<String, dynamic> json) {
    final rawFileName = json['fileName'] ?? json['FileName'] ?? '';
    final rawIdCandidate = json['id'] ?? json['Id'];
    final rawId = (rawIdCandidate != null && rawIdCandidate.toString().isNotEmpty)
        ? rawIdCandidate.toString()
        : rawFileName.toString();
    final rawTitle = json['title'] ?? json['Title'] ?? json['displayName'] ?? json['DisplayName'] ?? 'Unknown Title';
    final rawArtist = json['artist'] ?? json['Artist'] ?? json['creator'] ?? json['Creator'] ?? 'Unknown Artist';
    final rawAlbum = json['album'] ?? json['Album'] ?? 'Unknown Album';
    final rawDuration = json['durationSeconds'] ?? json['DurationSeconds'] ?? 180;
    final rawCover = json['coverArtUrl'] ?? json['CoverArtUrl'] ?? json['imageUrl'] ?? json['ImageUrl'];
    final rawLyrics = json['lyrics'] ?? json['Lyrics'];

    int durSec = 180;
    if (rawDuration is num) {
      durSec = rawDuration.toInt();
    } else if (rawDuration is String) {
      durSec = int.tryParse(rawDuration) ?? 180;
    }

    return Song(
      id: rawId.toString(),
      title: rawTitle.toString(),
      artist: rawArtist.toString(),
      album: rawAlbum.toString(),
      durationSeconds: durSec,
      fileName: rawFileName.toString(),
      coverArtUrl: rawCover?.toString(),
      lyrics: rawLyrics?.toString(),
      isLiked: json['isLiked'] == true || json['liked'] == true,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'artist': artist,
    'album': album,
    'durationSeconds': durationSeconds,
    'fileName': fileName,
    'coverArtUrl': coverArtUrl,
    'lyrics': lyrics,
    'isLiked': isLiked,
  };

  Song copyWith({
    String? id,
    String? title,
    String? artist,
    String? album,
    int? durationSeconds,
    String? fileName,
    String? coverArtUrl,
    String? lyrics,
    bool? isLiked,
  }) {
    return Song(
      id: id ?? this.id,
      title: title ?? this.title,
      artist: artist ?? this.artist,
      album: album ?? this.album,
      durationSeconds: durationSeconds ?? this.durationSeconds,
      fileName: fileName ?? this.fileName,
      coverArtUrl: coverArtUrl ?? this.coverArtUrl,
      lyrics: lyrics ?? this.lyrics,
      isLiked: isLiked ?? this.isLiked,
    );
  }
}
