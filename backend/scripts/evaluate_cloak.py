"""Measure how well the cloak hides identity from a *real* face-recognition pipeline.

Uses InsightFace's own ONNX pipeline (its detector + alignment + ArcFace via
onnxruntime) - independent of the PyTorch copy the attack optimises against.

    python scripts/evaluate_cloak.py photo.jpg [--strength medium] [--save out_dir]

Cosine similarity guide for ArcFace: > ~0.40 usually "same person",
< ~0.20 "different person". Lower after cloaking = better protection.
"""
from __future__ import annotations

import argparse
import io
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.cloak import cloak_image  # noqa: E402


def _jpeg(img: Image.Image, q: int) -> Image.Image:
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=q)
    return Image.open(io.BytesIO(buf.getvalue())).convert("RGB")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("image")
    ap.add_argument("--strength", default="all", choices=["all", "low", "medium", "high"])
    ap.add_argument("--save", default=None, help="folder to write cloaked PNGs")
    args = ap.parse_args()

    from insightface.app import FaceAnalysis

    fa = FaceAnalysis(name="buffalo_l", allowed_modules=["detection", "recognition"], providers=["CPUExecutionProvider"])
    fa.prepare(ctx_id=-1, det_size=(640, 640))

    def faces_of(img: Image.Image):
        return [(f.bbox, f.normed_embedding) for f in fa.get(np.ascontiguousarray(np.array(img.convert("RGB"))[:, :, ::-1]))]

    def iou(a, b):
        x0, y0, x1, y1 = max(a[0], b[0]), max(a[1], b[1]), min(a[2], b[2]), min(a[3], b[3])
        inter = max(0, x1 - x0) * max(0, y1 - y0)
        return inter / ((a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter + 1e-9)

    clean = Image.open(args.image).convert("RGB")
    ref = faces_of(clean)
    if not ref:
        sys.exit("No face found in the input image")

    def score(img: Image.Image) -> str:
        """Mean identity similarity over the clean faces; missed faces count as protected."""
        got = faces_of(img)
        sims, missed = [], 0
        for box, emb in ref:
            match = max(got, key=lambda g: iou(box, g[0]), default=None)
            if match is None or iou(box, match[0]) < 0.3:
                missed += 1
                continue
            sims.append(float(emb @ match[1]))
        txt = f"mean sim {np.mean(sims):.3f} (max {np.max(sims):.3f})" if sims else "no faces matched"
        return txt + (f", {missed}/{len(ref)} faces not detected" if missed else "")

    print(f"{len(ref)} faces. clean vs clean JPEG q80: {score(_jpeg(clean, 80))}  (natural baseline)")

    strengths = ["low", "medium", "high"] if args.strength == "all" else [args.strength]
    for st in strengths:
        res = cloak_image(clean, st, seed=0)
        m = res.metrics
        row = [f"{st:>6}: PSNR {m['psnr_db']:.1f} dB, {m['seconds']:.1f}s"]
        for label, img in (("png", res.image), ("jpeg90", _jpeg(res.image, 90)), ("jpeg75", _jpeg(res.image, 75))):
            row.append(f"{label}: {score(img)}")
        print(" | ".join(row))
        print(f"        surrogate sims (png / jpeg80): {m['encoder_similarity']} / {m['encoder_similarity_after_jpeg80']}")
        if args.save:
            out = Path(args.save)
            out.mkdir(parents=True, exist_ok=True)
            res.image.save(out / f"{Path(args.image).stem}_{st}.png")


if __name__ == "__main__":
    main()
