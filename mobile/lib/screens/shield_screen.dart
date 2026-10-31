import 'dart:io';

import 'package:flutter/material.dart';
import 'package:gal/gal.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../api.dart';
import '../widgets/before_after.dart';

class ShieldScreen extends StatefulWidget {
  const ShieldScreen({super.key, this.initialPhoto});
  final File? initialPhoto;

  @override
  State<ShieldScreen> createState() => _ShieldScreenState();
}

class _ShieldScreenState extends State<ShieldScreen> {
  File? _photo;
  String _strength = 'medium';
  bool _busy = false;
  CloakResult? _result;
  File? _resultFile;

  @override
  void initState() {
    super.initState();
    _photo = widget.initialPhoto;
  }

  Future<void> _pick() async {
    final x = await ImagePicker().pickImage(source: ImageSource.gallery);
    if (x == null) return;
    setState(() {
      _photo = File(x.path);
      _result = null;
      _resultFile = null;
    });
  }

  Future<void> _shield() async {
    if (_photo == null) return;
    setState(() => _busy = true);
    try {
      final api = await AegisApi.load();
      final res = await api.cloak(_photo!, _strength);
      // Kept in the app's temp folder only so it can be shared; the OS clears it.
      final dir = await getTemporaryDirectory();
      final f = File('${dir.path}/aegis_${DateTime.now().millisecondsSinceEpoch}.png');
      await f.writeAsBytes(res.bytes, flush: true);
      setState(() {
        _result = res;
        _resultFile = f;
      });
    } catch (e) {
      _snack('Could not shield the photo: $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _save() async {
    if (_resultFile == null) return;
    try {
      if (!await Gal.hasAccess()) await Gal.requestAccess();
      await Gal.putImage(_resultFile!.path, album: 'AegisHer');
      _snack('Saved to your gallery (AegisHer album)');
    } catch (e) {
      _snack('Could not save: $e');
    }
  }

  Future<void> _share() async {
    if (_resultFile == null) return;
    await Share.shareXFiles([XFile(_resultFile!.path, mimeType: 'image/png')]);
  }

  void _snack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Shield a photo before you post it', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        Text(
          'Adds tiny, nearly invisible pixel changes so deepfake and face-swap AI cannot recognise your face.',
          style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
        ),
        const SizedBox(height: 16),
        if (_photo == null)
          OutlinedButton.icon(
            onPressed: _pick,
            icon: const Icon(Icons.add_photo_alternate_outlined),
            label: const Padding(padding: EdgeInsets.symmetric(vertical: 28), child: Text('Choose a photo')),
          )
        else if (_result != null && _resultFile != null)
          BeforeAfter(before: _photo!, after: _resultFile!)
        else
          Stack(alignment: Alignment.center, children: [
            ClipRRect(borderRadius: BorderRadius.circular(16), child: Image.file(_photo!, fit: BoxFit.contain)),
            if (_busy)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.85), borderRadius: BorderRadius.circular(12)),
                child: const Column(mainAxisSize: MainAxisSize.min, children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 12),
                  Text('Shielding… this can take up to a minute'),
                ]),
              ),
          ]),
        const SizedBox(height: 16),
        SegmentedButton<String>(
          segments: const [
            ButtonSegment(value: 'low', label: Text('Light')),
            ButtonSegment(value: 'medium', label: Text('Balanced')),
            ButtonSegment(value: 'high', label: Text('Maximum')),
          ],
          selected: {_strength},
          onSelectionChanged: _busy ? null : (s) => setState(() => _strength = s.first),
        ),
        const SizedBox(height: 12),
        if (_result == null || _result!.metrics['strength'] != _strength)
          FilledButton.icon(
            onPressed: _photo == null || _busy ? null : _shield,
            icon: const Icon(Icons.shield),
            label: const Text('Shield my photo'),
          )
        else ...[
          _Metrics(result: _result!),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: FilledButton.icon(onPressed: _share, icon: const Icon(Icons.ios_share), label: const Text('Share / Post'))),
            const SizedBox(width: 8),
            Expanded(child: OutlinedButton.icon(onPressed: _save, icon: const Icon(Icons.download), label: const Text('Save'))),
          ]),
        ],
        if (_photo != null)
          TextButton(onPressed: _busy ? null : _pick, child: const Text('Choose another photo')),
        const SizedBox(height: 8),
        Text(
          'Post the shielded file as it is – no filters or re-edits. Shielding reduces risk but cannot guarantee protection against every future AI model.',
          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
        ),
      ],
    );
  }
}

class _Metrics extends StatelessWidget {
  const _Metrics({required this.result});
  final CloakResult result;

  @override
  Widget build(BuildContext context) {
    final sim = result.identitySimilarity;
    final pct = (sim.clamp(0, 1) * 100).round();
    final (label, color) = sim < 0.2
        ? ('Strong protection', Colors.green.shade700)
        : sim < 0.4
            ? ('Moderate protection', Colors.orange.shade800)
            : ('Weak – try a higher strength', Colors.red.shade700);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text('AI identity match: $pct%  (100% = recognised as you)'),
          const SizedBox(height: 6),
          LinearProgressIndicator(value: pct / 100, minHeight: 6, borderRadius: BorderRadius.circular(3)),
          const SizedBox(height: 8),
          Text('Faces protected: ${result.faces} · Visual change: ${result.psnr.toStringAsFixed(1)} dB'),
          const Text('Location & camera data removed ✓'),
        ]),
      ),
    );
  }
}
