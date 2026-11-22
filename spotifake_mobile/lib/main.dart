import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:just_audio_background/just_audio_background.dart';
import 'package:permission_handler/permission_handler.dart';
import 'services/api_service.dart';
import 'services/audio_manager.dart';
import 'views/home_view.dart';
import 'views/search_view.dart';
import 'views/library_view.dart';
import 'views/mini_player.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));

  // Request POST_NOTIFICATIONS runtime permission for Android 13+ (Motorola Razr 2023, etc.)
  try {
    await Permission.notification.request();
  } catch (_) {}

  await JustAudioBackground.init(
    androidNotificationChannelId: 'com.spotifake.audio.playback.v2',
    androidNotificationChannelName: 'Spotifake Audio Playback',
    androidNotificationIcon: 'mipmap/ic_launcher',
    androidNotificationOngoing: true,
    androidStopForegroundOnPause: false,
    androidShowNotificationBadge: true,
  );

  await ApiService.instance.init();
  await AudioManager.instance.init();

  runApp(const SpotifakeApp());
}

class SpotifakeApp extends StatelessWidget {
  const SpotifakeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Spotifake',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF121212),
        primaryColor: const Color(0xFF1DB954),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF1DB954),
          surface: Color(0xFF181818),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF121212),
          elevation: 0,
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: Color(0xFF121212),
          selectedItemColor: Colors.white,
          unselectedItemColor: Color(0xFFB3B3B3),
          selectedLabelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
          unselectedLabelStyle: TextStyle(fontSize: 11),
          elevation: 0,
        ),
        sliderTheme: const SliderThemeData(
          activeTrackColor: Color(0xFF1DB954),
          inactiveTrackColor: Color(0xFF404040),
          thumbColor: Colors.white,
          trackHeight: 3.0,
          thumbShape: RoundSliderThumbShape(enabledThumbRadius: 6.0),
        ),
      ),
      home: const MainNavigationScreen(),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _views = const [
    HomeView(),
    SearchView(),
    LibraryView(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _views,
      ),
      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const MiniPlayer(),
          BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: (index) {
              setState(() => _currentIndex = index);
            },
            type: BottomNavigationBarType.fixed,
            items: const [
              BottomNavigationBarItem(
                icon: Icon(Icons.home_outlined),
                activeIcon: Icon(Icons.home),
                label: 'Home',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.search),
                activeIcon: Icon(Icons.search),
                label: 'Search',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.library_music_outlined),
                activeIcon: Icon(Icons.library_music),
                label: 'Your Library',
              ),
            ],
          ),
        ],
      ),
    );
  }
}
