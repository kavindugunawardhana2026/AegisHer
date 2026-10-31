import 'package:flutter/material.dart';

import '../api.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _url = TextEditingController();

  @override
  void initState() {
    super.initState();
    AegisApi.load().then((a) => _url.text = a.baseUrl);
  }

  @override
  void dispose() {
    _url.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Server')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        TextField(
          controller: _url,
          keyboardType: TextInputType.url,
          decoration: const InputDecoration(
            labelText: 'AegisHer server URL',
            helperText: 'Emulator: http://10.0.2.2:8000 · Phone on same Wi-Fi: http://<your PC IP>:8000',
          ),
        ),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: () async {
            await AegisApi.saveUrl(_url.text);
            if (context.mounted) Navigator.pop(context);
          },
          child: const Text('Save'),
        ),
      ]),
    );
  }
}
