import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../api.dart';
import '../storage.dart';
import 'pdf_view_screen.dart';

const incidentTypes = {
  'deepfake': 'Deepfake / AI-edited image or video',
  'non_consensual_image_sharing': 'Private photos shared without consent',
  'sextortion': 'Sextortion / blackmail',
  'impersonation_fake_profile': 'Fake profile / impersonation',
  'harassment_threats': 'Harassment or threats',
  'doxxing': 'Personal details published',
  'hacked_account': 'Hacked account',
  'other': 'Something else',
};

class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key});

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  int _step = 0;
  bool _busy = false;
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _desc = TextEditingController();
  final _who = TextEditingController();
  final _url = TextEditingController();
  String _type = 'deepfake';
  DateTime? _firstSeen;
  final List<File> _evidence = [];
  final List<String> _urls = [];

  @override
  void dispose() {
    for (final c in [_name, _email, _phone, _desc, _who, _url]) {
      c.dispose();
    }
    super.dispose();
  }

  String? _opt(TextEditingController c) => c.text.trim().isEmpty ? null : c.text.trim();

  Map<String, dynamic> _incident() => {
        'complainant': {'full_name': _name.text.trim(), 'email': _opt(_email), 'phone': _opt(_phone)},
        'incident_type': _type,
        if (_firstSeen != null) 'date_first_seen': _firstSeen!.toIso8601String().substring(0, 10),
        'description': _desc.text.trim(),
        'perpetrator': _opt(_who),
        'urls': _urls.map((u) => {'url': u}).toList(),
      };

  bool get _stepValid => switch (_step) {
        0 => _name.text.trim().isNotEmpty,
        1 => _desc.text.trim().isNotEmpty,
        _ => _evidence.isNotEmpty || _urls.isNotEmpty,
      };

  Future<void> _addEvidence() async {
    // requestFullMetadata keeps the original bytes so the hash matches the original file.
    final picked = await ImagePicker().pickMultiImage(requestFullMetadata: true);
    setState(() => _evidence.addAll(picked.map((x) => File(x.path))));
  }

  Future<void> _generate() async {
    setState(() => _busy = true);
    try {
      final api = await AegisApi.load();
      final res = await api.report(_incident(), _evidence);
      final file = await ReportStore.save(res);
      if (!mounted) return;
      await Navigator.push(context, MaterialPageRoute(builder: (_) => PdfViewScreen(file: file, title: res.reportId)));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not create report: $e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Container(
        width: double.infinity,
        color: Theme.of(context).colorScheme.primaryContainer,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: const Text('This is not your fault. In immediate danger? Call 119.', style: TextStyle(fontWeight: FontWeight.w600)),
      ),
      Expanded(
        child: Stepper(
          currentStep: _step,
          onStepTapped: (i) => setState(() => _step = i),
          onStepCancel: _step == 0 ? null : () => setState(() => _step--),
          onStepContinue: _busy
              ? null
              : () {
                  if (!_stepValid) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill in the required fields')));
                    return;
                  }
                  if (_step < 2) {
                    setState(() => _step++);
                  } else {
                    _generate();
                  }
                },
          controlsBuilder: (context, d) => Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Row(children: [
              FilledButton(
                onPressed: d.onStepContinue,
                child: _busy
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(_step == 2 ? 'Generate PDF report' : 'Continue'),
              ),
              if (d.onStepCancel != null) TextButton(onPressed: d.onStepCancel, child: const Text('Back')),
            ]),
          ),
          steps: [
            Step(
              title: const Text('About you'),
              isActive: _step >= 0,
              content: Column(children: [
                TextField(controller: _name, decoration: const InputDecoration(labelText: 'Full name *')),
                TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email'), keyboardType: TextInputType.emailAddress),
                TextField(controller: _phone, decoration: const InputDecoration(labelText: 'Phone'), keyboardType: TextInputType.phone),
              ]),
            ),
            Step(
              title: const Text('What happened'),
              isActive: _step >= 1,
              content: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                DropdownButtonFormField<String>(
                  value: _type,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Type of abuse'),
                  items: [for (final e in incidentTypes.entries) DropdownMenuItem(value: e.key, child: Text(e.value))],
                  onChanged: (v) => setState(() => _type = v ?? _type),
                ),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(_firstSeen == null ? 'When did you first notice it?' : 'First noticed: ${_firstSeen!.toIso8601String().substring(0, 10)}'),
                  trailing: const Icon(Icons.calendar_today_outlined),
                  onTap: () async {
                    final d = await showDatePicker(context: context, firstDate: DateTime(2000), lastDate: DateTime.now());
                    if (d != null) setState(() => _firstSeen = d);
                  },
                ),
                TextField(
                  controller: _desc,
                  minLines: 4,
                  maxLines: 10,
                  maxLength: 6000,
                  decoration: const InputDecoration(labelText: 'Describe what happened * (English or සිංහල)', alignLabelWithHint: true),
                ),
                TextField(controller: _who, decoration: const InputDecoration(labelText: 'Who is responsible? (accounts, links – if known)')),
              ]),
            ),
            Step(
              title: const Text('Evidence'),
              isActive: _step >= 2,
              content: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Add original screenshots – don’t crop or edit them.'),
                const SizedBox(height: 8),
                Wrap(spacing: 8, runSpacing: 8, children: [
                  for (var i = 0; i < _evidence.length; i++)
                    InputChip(
                      avatar: CircleAvatar(backgroundImage: FileImage(_evidence[i])),
                      label: Text('E-${(i + 1).toString().padLeft(2, '0')}'),
                      onDeleted: () => setState(() => _evidence.removeAt(i)),
                    ),
                  ActionChip(avatar: const Icon(Icons.add), label: const Text('Add screenshots'), onPressed: _addEvidence),
                ]),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(child: TextField(controller: _url, decoration: const InputDecoration(labelText: 'Link to harmful content'), keyboardType: TextInputType.url)),
                  IconButton(
                    icon: const Icon(Icons.add_link),
                    onPressed: () {
                      if (_url.text.trim().isEmpty) return;
                      setState(() {
                        _urls.add(_url.text.trim());
                        _url.clear();
                      });
                    },
                  ),
                ]),
                for (var i = 0; i < _urls.length; i++)
                  ListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    title: Text(_urls[i], overflow: TextOverflow.ellipsis),
                    trailing: IconButton(icon: const Icon(Icons.close), onPressed: () => setState(() => _urls.removeAt(i))),
                  ),
              ]),
            ),
          ],
        ),
      ),
    ]);
  }
}
