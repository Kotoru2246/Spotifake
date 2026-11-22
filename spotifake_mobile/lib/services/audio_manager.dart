import 'dart:async';
import 'package:just_audio/just_audio.dart';
import 'package:just_audio_background/just_audio_background.dart';
import '../models/song.dart';
import 'api_service.dart';

class PositionData {
  final Duration position;
  final Duration bufferedPosition;
  final Duration duration;

  PositionData(this.position, this.bufferedPosition, this.duration);
}

class AudioManager {
  static final AudioManager instance = AudioManager._internal();
  AudioManager._internal();

  final AudioPlayer _player = AudioPlayer();
  AudioPlayer get player => _player;

  List<Song> _queue = [];
  List<Song> get queue => List.unmodifiable(_queue);

  int _currentIndex = -1;
  int get currentIndex => _currentIndex;

  Song? get currentSong => (_currentIndex >= 0 && _currentIndex < _queue.length) ? _queue[_currentIndex] : null;

  final StreamController<Song?> _currentSongController = StreamController<Song?>.broadcast();
  Stream<Song?> get currentSongStream => _currentSongController.stream;

  final StreamController<List<Song>> _queueController = StreamController<List<Song>>.broadcast();
  Stream<List<Song>> get queueStream => _queueController.stream;

  bool _isShuffle = false;
  bool get isShuffle => _isShuffle;

  // Sliding window bounds to keep Android MediaSession IPC Binder transaction under 100KB
  int _windowStartIndex = 0;
  List<Song> _windowSongs = [];

  AudioSource _createAudioSource(Song song) {
    final streamUrl = ApiService.instance.getStreamUrl(song);
    final coverUrl = ApiService.instance.getCoverUrl(song);

    Uri? artUri;
    try {
      if (coverUrl.isNotEmpty && (coverUrl.startsWith('http://') || coverUrl.startsWith('https://'))) {
        artUri = Uri.tryParse(coverUrl);
      }
    } catch (_) {
      artUri = null;
    }

    return AudioSource.uri(
      Uri.parse(streamUrl),
      tag: MediaItem(
        id: song.id.isNotEmpty ? song.id : song.fileName,
        album: song.album.isNotEmpty ? song.album : 'Unknown Album',
        title: song.title.isNotEmpty ? song.title : (song.fileName.isNotEmpty ? song.fileName : 'Unknown Title'),
        artist: song.artist.isNotEmpty ? song.artist : 'Unknown Artist',
        artUri: artUri,
        duration: Duration(seconds: song.durationSeconds > 0 ? song.durationSeconds : 180),
      ),
    );
  }

  Future<void> init() async {
    // Default loop mode to all so Previous/Next are always available
    await _player.setLoopMode(LoopMode.all);

    // Sync state when track changes from Notification, Lockscreen, or Bluetooth headset
    _player.currentIndexStream.listen((playerIdx) {
      if (playerIdx != null && playerIdx >= 0 && playerIdx < _windowSongs.length) {
        final globalIdx = _windowStartIndex + playerIdx;
        if (globalIdx >= 0 && globalIdx < _queue.length && _currentIndex != globalIdx) {
          _currentIndex = globalIdx;
          _currentSongController.add(_queue[_currentIndex]);
          ApiService.instance.recordPlay(_queue[_currentIndex].id);
        }
      }
    });

    _player.playerStateStream.listen((state) {
      if (state.processingState == ProcessingState.completed) {
        if (_player.loopMode == LoopMode.one) {
          _player.seek(Duration.zero);
          _player.play();
        } else {
          next();
        }
      }
    });
  }

  Future<void> _loadWindow({bool initialPlay = true}) async {
    if (_queue.isEmpty || _currentIndex < 0 || _currentIndex >= _queue.length) return;

    final targetSong = _queue[_currentIndex];
    _currentSongController.add(targetSong);

    // Limit window to 25 items so Binder transaction stays tiny (~35 KB)
    // and never triggers TransactionTooLargeException on Samsung / older Androids
    int start = 0;
    int end = _queue.length;
    if (_queue.length > 25) {
      start = _currentIndex - 5;
      if (start < 0) start = 0;
      end = start + 25;
      if (end > _queue.length) {
        end = _queue.length;
        start = end - 25;
        if (start < 0) start = 0;
      }
    }

    _windowStartIndex = start;
    _windowSongs = _queue.sublist(start, end);
    final playerIdx = _currentIndex - start;

    try {
      final sources = _windowSongs.map(_createAudioSource).toList();
      await _player.setAudioSources(
        sources,
        initialIndex: playerIdx,
        initialPosition: Duration.zero,
      );
      if (initialPlay) {
        await _player.play();
        ApiService.instance.recordPlay(targetSong.id);
      }
    } catch (e) {
      // In case setAudioSources encounters any platform error, fallback to single source so playback NEVER crashes
      try {
        final singleSource = _createAudioSource(targetSong);
        await _player.setAudioSource(singleSource);
        if (initialPlay) {
          await _player.play();
          ApiService.instance.recordPlay(targetSong.id);
        }
      } catch (_) {}
    }
  }

  Future<void> setQueue(List<Song> newQueue, {int startIndex = 0, bool autoPlay = true}) async {
    if (newQueue.isEmpty) return;
    _queue = List.from(newQueue);
    _currentIndex = (startIndex >= 0 && startIndex < _queue.length) ? startIndex : 0;
    _queueController.add(_queue);

    await _loadWindow(initialPlay: autoPlay);
  }

  Future<void> playSong(Song song, {List<Song>? queue, int? index}) async {
    if (queue != null && queue.isNotEmpty) {
      await setQueue(queue, startIndex: index ?? queue.indexWhere((s) => s.id == song.id));
      return;
    }

    final existingIdx = _queue.indexWhere((s) => s.id == song.id);
    if (existingIdx != -1) {
      _currentIndex = existingIdx;
      // If already inside active window, seek directly for instant response
      if (_currentIndex >= _windowStartIndex && _currentIndex < _windowStartIndex + _windowSongs.length) {
        final playerIdx = _currentIndex - _windowStartIndex;
        await _player.seek(Duration.zero, index: playerIdx);
        _currentSongController.add(currentSong);
        await _player.play();
        ApiService.instance.recordPlay(song.id);
        return;
      }
    } else {
      _queue.add(song);
      _currentIndex = _queue.length - 1;
      _queueController.add(_queue);
    }
    await _loadWindow(initialPlay: true);
  }

  Future<void> togglePlayPause() async {
    if (_player.playing) {
      await _player.pause();
    } else {
      if (_player.audioSource == null && _queue.isNotEmpty) {
        await setQueue(_queue, startIndex: _currentIndex >= 0 ? _currentIndex : 0);
      } else {
        await _player.play();
      }
    }
  }

  Future<void> next() async {
    if (_queue.isEmpty) return;
    if (_player.hasNext) {
      await _player.seekToNext();
    } else {
      // Reached boundary of active window or queue
      int nextIdx = _currentIndex + 1;
      if (nextIdx >= _queue.length) {
        nextIdx = 0; // loop back to first track
      }
      _currentIndex = nextIdx;
      await _loadWindow(initialPlay: true);
    }
    if (!_player.playing) {
      await _player.play();
    }
  }

  Future<void> previous() async {
    if (_queue.isEmpty) return;
    if (_player.position.inSeconds > 3) {
      await _player.seek(Duration.zero);
      return;
    }
    if (_player.hasPrevious) {
      await _player.seekToPrevious();
    } else {
      // Reached start of active window
      int prevIdx = _currentIndex - 1;
      if (prevIdx < 0) {
        prevIdx = _queue.length - 1; // loop back to last track
      }
      _currentIndex = prevIdx;
      await _loadWindow(initialPlay: true);
    }
    if (!_player.playing) {
      await _player.play();
    }
  }

  Future<void> seek(Duration position) async {
    await _player.seek(position);
  }

  Future<void> toggleRepeat() async {
    final current = _player.loopMode;
    if (current == LoopMode.off) {
      await _player.setLoopMode(LoopMode.all);
    } else if (current == LoopMode.all) {
      await _player.setLoopMode(LoopMode.one);
    } else {
      await _player.setLoopMode(LoopMode.off);
    }
  }

  Future<void> toggleShuffle() async {
    final enabled = !_player.shuffleModeEnabled;
    await _player.setShuffleModeEnabled(enabled);
    if (enabled) {
      await _player.shuffle();
    }
    _isShuffle = enabled;
  }

  Future<void> jumpToQueueIndex(int index) async {
    if (index >= 0 && index < _queue.length) {
      _currentIndex = index;
      if (_currentIndex >= _windowStartIndex && _currentIndex < _windowStartIndex + _windowSongs.length) {
        final playerIdx = _currentIndex - _windowStartIndex;
        await _player.seek(Duration.zero, index: playerIdx);
        _currentSongController.add(currentSong);
        if (!_player.playing) {
          await _player.play();
        }
        if (currentSong != null) {
          ApiService.instance.recordPlay(currentSong!.id);
        }
      } else {
        await _loadWindow(initialPlay: true);
      }
    }
  }

  Stream<PositionData> get positionDataStream {
    return _PositionStreamZip(
      _player.positionStream,
      _player.bufferedPositionStream,
      _player.durationStream,
    ).stream;
  }

  void dispose() {
    _player.dispose();
    _currentSongController.close();
    _queueController.close();
  }
}

class _PositionStreamZip {
  final Stream<Duration> positionStream;
  final Stream<Duration> bufferedStream;
  final Stream<Duration?> durationStream;

  _PositionStreamZip(this.positionStream, this.bufferedStream, this.durationStream);

  Stream<PositionData> get stream {
    late StreamController<PositionData> controller;
    Duration pos = Duration.zero;
    Duration buf = Duration.zero;
    Duration dur = Duration.zero;

    StreamSubscription? sub1;
    StreamSubscription? sub2;
    StreamSubscription? sub3;

    controller = StreamController<PositionData>(
      onListen: () {
        sub1 = positionStream.listen((p) {
          pos = p;
          controller.add(PositionData(pos, buf, dur));
        });
        sub2 = bufferedStream.listen((b) {
          buf = b;
          controller.add(PositionData(pos, buf, dur));
        });
        sub3 = durationStream.listen((d) {
          dur = d ?? Duration.zero;
          controller.add(PositionData(pos, buf, dur));
        });
      },
      onCancel: () {
        sub1?.cancel();
        sub2?.cancel();
        sub3?.cancel();
      },
    );

    return controller.stream;
  }
}
