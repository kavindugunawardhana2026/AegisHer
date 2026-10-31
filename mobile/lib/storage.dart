import 'dart:io';

import 'package:path_provider/path_provider.dart';

import 'api.dart';

/// Reports are saved in the app's private documents folder so they can be
/// opened offline later (not visible to other apps).
class ReportStore {
  static Future<Directory> _dir() async {
    final base = await getApplicationDocumentsDirectory();
    final d = Directory('${base.path}/reports');
    if (!await d.exists()) await d.create(recursive: true);
    return d;
  }

  static Future<File> save(ReportResult r) async {
    final f = File('${(await _dir()).path}/${r.reportId}.pdf');
    return f.writeAsBytes(r.pdf, flush: true);
  }

  static Future<List<File>> list() async {
    final files = (await _dir()).listSync().whereType<File>().where((f) => f.path.endsWith('.pdf')).toList();
    files.sort((a, b) => b.lastModifiedSync().compareTo(a.lastModifiedSync()));
    return files;
  }
}
