import 'dart:io';

import 'package:flutter/material.dart';
import 'package:pdfx/pdfx.dart';
import 'package:share_plus/share_plus.dart';

/// Offline PDF viewer for saved reports.
class PdfViewScreen extends StatefulWidget {
  const PdfViewScreen({super.key, required this.file, required this.title});
  final File file;
  final String title;

  @override
  State<PdfViewScreen> createState() => _PdfViewScreenState();
}

class _PdfViewScreenState extends State<PdfViewScreen> {
  late final PdfControllerPinch _controller = PdfControllerPinch(document: PdfDocument.openFile(widget.file.path));

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        actions: [
          IconButton(
            tooltip: 'Send report',
            icon: const Icon(Icons.send_outlined),
            onPressed: () => Share.shareXFiles([XFile(widget.file.path, mimeType: 'application/pdf')], subject: 'Cyber-harassment report ${widget.title}'),
          ),
        ],
      ),
      body: PdfViewPinch(controller: _controller),
    );
  }
}
