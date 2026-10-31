import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:receive_sharing_intent/receive_sharing_intent.dart';

import 'screens/report_screen.dart';
import 'screens/reports_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/shield_screen.dart';

void main() => runApp(const AegisHerApp());

const brand = Color(0xFF7C3AED);

class AegisHerApp extends StatelessWidget {
  const AegisHerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AegisHer',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: brand),
        useMaterial3: true,
        // Noto Sans Sinhala ships with Android; iOS falls back to its Sinhala font.
        fontFamilyFallback: const ['Noto Sans Sinhala', 'Sinhala Sangam MN'],
      ),
      home: const HomeShell(),
    );
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _tab = 0;
  File? _sharedPhoto;
  StreamSubscription<List<SharedMediaFile>>? _shareSub;

  @override
  void initState() {
    super.initState();
    // "Share to AegisHer" while the app is running…
    _shareSub = ReceiveSharingIntent.instance.getMediaStream().listen(_onShared);
    // …or when the share sheet launched the app.
    ReceiveSharingIntent.instance.getInitialMedia().then((files) {
      _onShared(files);
      ReceiveSharingIntent.instance.reset();
    });
  }

  void _onShared(List<SharedMediaFile> files) {
    final image = files.where((f) => f.type == SharedMediaType.image).firstOrNull;
    if (image == null) return;
    setState(() {
      _sharedPhoto = File(image.path);
      _tab = 0;
    });
  }

  @override
  void dispose() {
    _shareSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      ShieldScreen(key: ValueKey(_sharedPhoto?.path), initialPhoto: _sharedPhoto),
      const ReportScreen(),
      const ReportsScreen(),
    ];
    return Scaffold(
      appBar: AppBar(
        title: const Row(children: [
          Icon(Icons.shield, color: brand),
          SizedBox(width: 8),
          Text('AegisHer', style: TextStyle(fontWeight: FontWeight.w700)),
        ]),
        actions: [
          IconButton(
            tooltip: 'Server settings',
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen())),
          ),
        ],
      ),
      body: IndexedStack(index: _tab, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.shield_outlined), selectedIcon: Icon(Icons.shield), label: 'Shield'),
          NavigationDestination(icon: Icon(Icons.report_outlined), selectedIcon: Icon(Icons.report), label: 'Report'),
          NavigationDestination(icon: Icon(Icons.folder_outlined), selectedIcon: Icon(Icons.folder), label: 'My reports'),
        ],
      ),
    );
  }
}
