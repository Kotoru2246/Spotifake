import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AddAlbumDialog extends StatefulWidget {
  const AddAlbumDialog({super.key});

  @override
  State<AddAlbumDialog> createState() => _AddAlbumDialogState();
}

class _AddAlbumDialogState extends State<AddAlbumDialog> {
  final TextEditingController _controller = TextEditingController();
  bool _isDownloading = false;
  String _statusText = '';
  String? _jobId;
  Timer? _pollTimer;

  @override
  void dispose() {
    _pollTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _startDownload() async {
    final query = _controller.text.trim();
    if (query.isEmpty) return;

    setState(() {
      _isDownloading = true;
      _statusText = 'Starting downloader engine...';
    });

    final res = await ApiService.instance.startDownloadJob(query);
    if (!mounted) return;

    if (res != null && res['id'] != null) {
      _jobId = res['id'].toString();
      _pollTimer = Timer.periodic(const Duration(seconds: 2), (_) => _pollJob());
    } else {
      setState(() {
        _isDownloading = false;
        _statusText = 'Could not start download. Check server connection.';
      });
    }
  }

  void _pollJob() async {
    if (_jobId == null) return;
    final job = await ApiService.instance.fetchDownloadJob(_jobId!);
    if (!mounted) return;

    if (job != null) {
      final status = job['status']?.toString();
      final progress = job['progress']?.toString() ?? '';

      setState(() {
        _statusText = progress.isNotEmpty ? progress : status ?? '';
      });

      if (status == 'COMPLETED') {
        _pollTimer?.cancel();
        setState(() => _isDownloading = false);
        Future.delayed(const Duration(seconds: 1), () {
          if (mounted) Navigator.pop(context, true);
        });
      } else if (status == 'FAILED') {
        _pollTimer?.cancel();
        setState(() => _isDownloading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: const Color(0xFF242424),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Row(
        children: [
          Icon(Icons.download_for_offline, color: Color(0xFF1DB954), size: 24),
          SizedBox(width: 10),
          Text('Add Album / Songs', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Paste a Spotify Album or Track URL, or song title to download and import with high-res art & synced lyrics:',
              style: TextStyle(color: Color(0xFFB3B3B3), fontSize: 13),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _controller,
              enabled: !_isDownloading,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: InputDecoration(
                filled: true,
                fillColor: const Color(0xFF333333),
                hintText: 'https://open.spotify.com/album/...',
                hintStyle: const TextStyle(color: Colors.grey, fontSize: 13),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
            if (_statusText.isNotEmpty) ...[
              const SizedBox(height: 14),
              Row(
                children: [
                  if (_isDownloading) ...[
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF1DB954)),
                    ),
                    const SizedBox(width: 10),
                  ],
                  Expanded(
                    child: Text(
                      _statusText,
                      style: TextStyle(
                        color: _statusText.contains('Error') || _statusText.contains('FAILED')
                            ? Colors.redAccent
                            : const Color(0xFF1DB954),
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isDownloading ? null : () => Navigator.pop(context),
          child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF1DB954),
            foregroundColor: Colors.black,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          ),
          onPressed: _isDownloading ? null : _startDownload,
          child: const Text('Download Album', style: TextStyle(fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }
}
