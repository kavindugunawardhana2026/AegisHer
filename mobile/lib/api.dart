import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Talks to the AegisHer FastAPI backend.
class AegisApi {
  AegisApi(this.baseUrl);

  /// Android emulator reaches the host machine on 10.0.2.2.
  static const defaultUrl = 'http://10.0.2.2:8000';
  static const _prefKey = 'api_base_url';

  final String baseUrl;

  static Future<AegisApi> load() async {
    final prefs = await SharedPreferences.getInstance();
    return AegisApi(prefs.getString(_prefKey) ?? defaultUrl);
  }

  static Future<void> saveUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKey, url.trim().replaceAll(RegExp(r'/+$'), ''));
  }

  Uri _u(String path) => Uri.parse('$baseUrl$path');

  Future<CloakResult> cloak(File photo, String strength) async {
    final req = http.MultipartRequest('POST', _u('/api/cloak'))
      ..fields['strength'] = strength
      ..files.add(await http.MultipartFile.fromPath('file', photo.path));
    final res = await http.Response.fromStream(await req.send().timeout(const Duration(minutes: 5)));
    _check(res);
    return CloakResult(
      bytes: res.bodyBytes,
      metrics: jsonDecode(res.headers['x-aegis-metrics'] ?? '{}') as Map<String, dynamic>,
    );
  }

  Future<ReportResult> report(Map<String, dynamic> incident, List<File> evidence, {String thumbnails = 'blurred'}) async {
    final req = http.MultipartRequest('POST', _u('/api/report'))
      ..fields['incident'] = jsonEncode(incident)
      ..fields['thumbnails'] = thumbnails;
    for (final f in evidence) {
      req.files.add(await http.MultipartFile.fromPath('files', f.path));
    }
    final res = await http.Response.fromStream(await req.send().timeout(const Duration(minutes: 2)));
    _check(res);
    return ReportResult(
      pdf: res.bodyBytes,
      reportId: res.headers['x-report-id'] ?? 'report',
      pdfSha256: res.headers['x-report-sha256'] ?? '',
    );
  }

  void _check(http.Response res) {
    if (res.statusCode >= 200 && res.statusCode < 300) return;
    String msg = 'Error ${res.statusCode}';
    try {
      final d = jsonDecode(res.body)['detail'];
      if (d is String) msg = d;
      if (d is List) msg = d.map((e) => e['msg']).join('; ');
    } catch (_) {}
    throw AegisException(msg);
  }
}

class AegisException implements Exception {
  AegisException(this.message);
  final String message;
  @override
  String toString() => message;
}

class CloakResult {
  CloakResult({required this.bytes, required this.metrics});
  final Uint8List bytes;
  final Map<String, dynamic> metrics;

  /// Identity similarity seen by the face-recognition model (1.0 = same person).
  double get identitySimilarity {
    final sims = (metrics['encoder_similarity'] as Map?) ?? {};
    final v = sims['arcface'] ?? (sims.values.isNotEmpty ? sims.values.first : 1.0);
    return (v as num).toDouble();
  }

  double get psnr => (metrics['psnr_db'] as num?)?.toDouble() ?? 0;
  int get faces => (metrics['faces_detected'] as num?)?.toInt() ?? 0;
}

class ReportResult {
  ReportResult({required this.pdf, required this.reportId, required this.pdfSha256});
  final Uint8List pdf;
  final String reportId;
  final String pdfSha256;
}
