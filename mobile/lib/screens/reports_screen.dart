import 'dart:io';

import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

import '../storage.dart';
import 'pdf_view_screen.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  late Future<List<File>> _files = ReportStore.list();

  Future<void> _refresh() async => setState(() => _files = ReportStore.list());

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: FutureBuilder<List<File>>(
        future: _files,
        builder: (context, snap) {
          final files = snap.data ?? [];
          if (snap.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator());
          if (files.isEmpty) {
            return ListView(children: const [
              Padding(padding: EdgeInsets.all(32), child: Text('No reports yet. Reports you create are kept here and open without internet.', textAlign: TextAlign.center)),
            ]);
          }
          return ListView.separated(
            itemCount: files.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, i) {
              final f = files[i];
              final name = f.uri.pathSegments.last.replaceAll('.pdf', '');
              return ListTile(
                leading: const Icon(Icons.picture_as_pdf_outlined),
                title: Text(name),
                subtitle: Text(f.lastModifiedSync().toLocal().toString().substring(0, 16)),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => PdfViewScreen(file: f, title: name))),
                trailing: IconButton(
                  tooltip: 'Send',
                  icon: const Icon(Icons.send_outlined),
                  onPressed: () => Share.shareXFiles([XFile(f.path, mimeType: 'application/pdf')], subject: 'Cyber-harassment report $name'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
