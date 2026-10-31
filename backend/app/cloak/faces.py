"""Face detection.

Uses InsightFace (SCRFD detector + 5-point landmarks) when installed, otherwise
falls back to OpenCV's bundled Haar cascade. Boxes and landmarks are returned
in *normalised* coordinates (0..1) so they stay valid after the image is resized.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from functools import lru_cache

import cv2
import numpy as np

log = logging.getLogger(__name__)


@dataclass
class Face:
    x0: float
    y0: float
    x1: float
    y1: float
    score: float = 1.0
    # 5 landmarks (eyes, nose, mouth corners) as [[x, y], ...] in 0..1, if known.
    kps: list[list[float]] | None = field(default=None)

    def to_dict(self) -> dict:
        return {"box": [self.x0, self.y0, self.x1, self.y1], "score": round(self.score, 3)}


@lru_cache(maxsize=1)
def _insightface_detector():
    try:
        from insightface.app import FaceAnalysis  # type: ignore
    except Exception:
        return None
    try:
        app = FaceAnalysis(name="buffalo_l", allowed_modules=["detection"], providers=["CPUExecutionProvider"])
        app.prepare(ctx_id=-1, det_size=(640, 640))
        return app
    except Exception as exc:  # weights missing / download failed
        log.warning("InsightFace detector unavailable: %s", exc)
        return None


@lru_cache(maxsize=1)
def _haar():
    if not hasattr(cv2, "CascadeClassifier"):  # removed in OpenCV 5
        log.warning("OpenCV %s has no Haar detector; install opencv-python-headless<5 or insightface", cv2.__version__)
        return None
    path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    return cv2.CascadeClassifier(path)


def detector_name() -> str:
    if _insightface_detector() is not None:
        return "insightface-scrfd"
    return "opencv-haar" if _haar() is not None else "none"


def detect_faces(rgb: np.ndarray) -> list[Face]:
    """Detect faces in an RGB uint8 image."""
    h, w = rgb.shape[:2]
    det = _insightface_detector()
    if det is not None:
        bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
        out = []
        for f in det.get(bgr):
            x0, y0, x1, y1 = f.bbox.tolist()
            kps = None
            if getattr(f, "kps", None) is not None:
                kps = [[float(px) / w, float(py) / h] for px, py in f.kps]
            out.append(Face(max(0, x0 / w), max(0, y0 / h), min(1, x1 / w), min(1, y1 / h), float(f.det_score), kps))
        return out

    # Haar fallback: run on a downscaled grey image for speed.
    haar = _haar()
    if haar is None:
        return []
    scale = min(1.0, 800 / max(h, w))
    small = cv2.resize(rgb, (int(w * scale), int(h * scale))) if scale < 1 else rgb
    grey = cv2.equalizeHist(cv2.cvtColor(small, cv2.COLOR_RGB2GRAY))
    min_side = max(24, int(min(grey.shape) * 0.06))
    boxes = haar.detectMultiScale(grey, scaleFactor=1.1, minNeighbors=6, minSize=(min_side, min_side))
    sh, sw = grey.shape
    return [Face(x / sw, y / sh, (x + bw) / sw, (y + bh) / sh, 0.9) for (x, y, bw, bh) in boxes]


def face_mask(faces: list[Face], h: int, w: int, background: float) -> np.ndarray:
    """Soft weight map: 1.0 over (slightly enlarged) faces, `background` elsewhere."""
    if not faces:
        return np.ones((h, w), np.float32)
    mask = np.zeros((h, w), np.float32)
    for f in faces:
        cx, cy = (f.x0 + f.x1) / 2 * w, (f.y0 + f.y1) / 2 * h
        ax, ay = (f.x1 - f.x0) * w * 0.75, (f.y1 - f.y0) * h * 0.9
        cv2.ellipse(mask, (int(cx), int(cy)), (max(1, int(ax)), max(1, int(ay))), 0, 0, 360, 1.0, -1)
    k = max(3, int(min(h, w) * 0.04) | 1)
    mask = cv2.GaussianBlur(mask, (k, k), 0)
    return np.clip(background + (1 - background) * mask, 0, 1).astype(np.float32)
