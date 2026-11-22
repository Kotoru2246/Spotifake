import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import '../services/api_service.dart';

class ServerSettingsDialog extends StatefulWidget {
  const ServerSettingsDialog({super.key});

  @override
  State<ServerSettingsDialog> createState() => _ServerSettingsDialogState();
}

class _ServerSettingsDialogState extends State<ServerSettingsDialog> {
  late final TextEditingController _controller;
  bool _testing = false;
  String? _testResult;
  bool _isSuccess = false;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: ApiService.instance.baseUrl);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _testConnection() async {
    setState(() {
      _testing = true;
      _testResult = null;
    });

    final tempUrl = _controller.text.trim();
    await ApiService.instance.setServerUrl(tempUrl);
    final ok = await ApiService.instance.checkConnection();

    setState(() {
      _testing = false;
      _isSuccess = ok;
      _testResult = ok ? 'Connected successfully! (HTTP 200)' : 'Could not connect. Check network or URL.';
    });
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: const Color(0xFF242424),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Row(
        children: [
          Icon(Icons.dns, color: Color(0xFF1DB954)),
          SizedBox(width: 10),
          Text('Spotifake Server', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Stream from Cloudflare (Anywhere on 4G/5G) or Local LAN (Wi-Fi):',
              style: TextStyle(color: Color(0xFFB3B3B3), fontSize: 13),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _controller,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: InputDecoration(
                filled: true,
                fillColor: const Color(0xFF333333),
                hintText: 'https://....trycloudflare.com',
                hintStyle: const TextStyle(color: Colors.grey),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
            const SizedBox(height: 14),
            const Text('Quick Switch:', style: TextStyle(color: Color(0xFFB3B3B3), fontSize: 12, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                _buildChip('Cloudflare Global', 'https://contractors-gps-policies-cloud.trycloudflare.com', isHighlight: true),
                _buildChip('Wi-Fi LAN (161)', 'http://172.17.144.161:8000'),
                _buildChip('Laptop 1 (102)', 'http://192.168.30.102:8000'),
                _buildChip('Laptop 2 (104)', 'http://192.168.30.104:8000'),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                const Icon(Icons.notifications_active, color: Color(0xFF1DB954), size: 18),
                const SizedBox(width: 8),
                const Text('Notifications:', style: TextStyle(color: Color(0xFFB3B3B3), fontSize: 12, fontWeight: FontWeight.bold)),
                const Spacer(),
                TextButton(
                  onPressed: () async {
                    final status = await Permission.notification.request();
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(status.isGranted ? 'Notifications Allowed' : 'Permission: $status'),
                        backgroundColor: status.isGranted ? Colors.green : Colors.orange,
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                  child: const Text('Check / Allow', style: TextStyle(color: Color(0xFF1DB954), fontSize: 12)),
                ),
              ],
            ),
            if (_testResult != null) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: _isSuccess ? Colors.green.withOpacity(0.15) : Colors.red.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(_isSuccess ? Icons.check_circle : Icons.error, color: _isSuccess ? Colors.greenAccent : Colors.redAccent, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _testResult!,
                        style: TextStyle(color: _isSuccess ? Colors.greenAccent : Colors.redAccent, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _testing ? null : _testConnection,
          child: _testing
              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Test Connection', style: TextStyle(color: Color(0xFF1DB954))),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF1DB954),
            foregroundColor: Colors.black,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          ),
          onPressed: () async {
            await ApiService.instance.setServerUrl(_controller.text.trim());
            if (!context.mounted) return;
            Navigator.pop(context, true);
          },
          child: const Text('Save & Connect', style: TextStyle(fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }

  Widget _buildChip(String label, String url, {bool isHighlight = false}) {
    return ActionChip(
      backgroundColor: isHighlight ? const Color(0xFF1DB954).withOpacity(0.2) : const Color(0xFF383838),
      side: isHighlight ? const BorderSide(color: Color(0xFF1DB954), width: 1) : BorderSide.none,
      label: Text(label, style: TextStyle(color: isHighlight ? const Color(0xFF1DB954) : Colors.white, fontSize: 11)),
      onPressed: () {
        setState(() {
          _controller.text = url;
          _testResult = null;
        });
      },
    );
  }
}
