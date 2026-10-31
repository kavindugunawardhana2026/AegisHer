import 'dart:io';

import 'package:flutter/material.dart';

/// Drag left/right to compare the original and shielded photo.
class BeforeAfter extends StatefulWidget {
  const BeforeAfter({super.key, required this.before, required this.after});
  final File before;
  final File after;

  @override
  State<BeforeAfter> createState() => _BeforeAfterState();
}

class _BeforeAfterState extends State<BeforeAfter> {
  double _pos = 0.5;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: LayoutBuilder(builder: (context, c) {
        return GestureDetector(
          onHorizontalDragUpdate: (d) => setState(() => _pos = (d.localPosition.dx / c.maxWidth).clamp(0.0, 1.0)),
          onTapDown: (d) => setState(() => _pos = (d.localPosition.dx / c.maxWidth).clamp(0.0, 1.0)),
          child: Stack(children: [
            Image.file(widget.after, width: c.maxWidth, fit: BoxFit.contain),
            ClipRect(
              clipper: _LeftClipper(_pos),
              child: Image.file(widget.before, width: c.maxWidth, fit: BoxFit.contain),
            ),
            Positioned.fill(
              child: Align(
                alignment: Alignment(_pos * 2 - 1, 0),
                child: Container(width: 3, color: Colors.white),
              ),
            ),
            const Positioned(left: 8, top: 8, child: _Tag('Original')),
            const Positioned(right: 8, top: 8, child: _Tag('Shielded')),
          ]),
        );
      }),
    );
  }
}

class _LeftClipper extends CustomClipper<Rect> {
  _LeftClipper(this.fraction);
  final double fraction;
  @override
  Rect getClip(Size size) => Rect.fromLTWH(0, 0, size.width * fraction, size.height);
  @override
  bool shouldReclip(_LeftClipper old) => old.fraction != fraction;
}

class _Tag extends StatelessWidget {
  const _Tag(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(12)),
        child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 12)),
      );
}
