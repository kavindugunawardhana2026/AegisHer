"""Surrogate models the cloak is optimised against.

The idea (as in Fawkes / LowKey / PhotoGuard): deepfake tools all start by
*encoding* a photo - a face-recognition embedding (face-swappers such as
InsightFace inswapper / SimSwap use ArcFace) or a latent (Stable Diffusion
editors use the VAE). If we push the photo's encoding far away from the true
one while changing pixels only slightly, the downstream tool works from a
wrong identity / wrong latent and its output breaks.

Each surrogate exposes:
    embed(x, faces) -> list[Tensor]   x: [1,3,H,W] RGB in 0..1
    similarity(a, b) -> Tensor scalar (cosine; 1.0 = identical encoding)
"""
from __future__ import annotations

import logging
import os
from pathlib import Path

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from torchvision.ops import roi_align

from .. import config
from .faces import Face

log = logging.getLogger(__name__)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def _cos(a: list[torch.Tensor], b: list[torch.Tensor]) -> torch.Tensor:
    sims = [F.cosine_similarity(x.flatten(1), y.flatten(1), dim=1).mean() for x, y in zip(a, b)]
    return torch.stack(sims).mean()


def _face_rois(faces: list[Face], h: int, w: int, margin: float = 0.25) -> torch.Tensor:
    """Square boxes around faces in pixel coords, shaped for roi_align."""
    rows = []
    for f in faces:
        cx, cy = (f.x0 + f.x1) / 2 * w, (f.y0 + f.y1) / 2 * h
        side = max((f.x1 - f.x0) * w, (f.y1 - f.y0) * h) * (1 + margin)
        rows.append([0, cx - side / 2, cy - side / 2, cx + side / 2, cy + side / 2])
    return torch.tensor(rows, dtype=torch.float32, device=DEVICE)


class Surrogate:
    name = "base"
    description = ""
    weight = 1.0
    needs_faces = False

    def embed(self, x: torch.Tensor, faces: list[Face]) -> list[torch.Tensor] | None:
        raise NotImplementedError

    def similarity(self, a, b) -> torch.Tensor:
        return _cos(a, b)


class ImageNetSurrogate(Surrogate):
    """Generic CNN features (always available). Disrupts the whole image and face crops."""

    name = "imagenet-resnet"
    description = "ResNet-50 multi-layer features (generic encoder proxy)"
    use_face_crops = True  # turned off when ArcFace already covers faces (saves time + RAM)

    def __init__(self):
        import torchvision

        if config.OFFLINE_TEST:
            self.model = torchvision.models.resnet18(weights=None)
            self.description = "ResNet-18 random weights (OFFLINE TEST MODE - not protective)"
        else:
            self.model = torchvision.models.resnet50(weights=torchvision.models.ResNet50_Weights.IMAGENET1K_V2)
        self.model.eval().to(DEVICE).requires_grad_(False)
        self.mean = torch.tensor([0.485, 0.456, 0.406], device=DEVICE).view(1, 3, 1, 1)
        self.std = torch.tensor([0.229, 0.224, 0.225], device=DEVICE).view(1, 3, 1, 1)

    def _feats(self, x: torch.Tensor) -> list[torch.Tensor]:
        m = self.model
        x = (x - self.mean) / self.std
        x = m.maxpool(m.relu(m.bn1(m.conv1(x))))
        l2 = m.layer2(m.layer1(x))
        l3 = m.layer3(l2)
        l4 = m.layer4(l3)
        return [l2, l3, l4]

    def embed(self, x, faces):
        out = self._feats(F.interpolate(x, size=(224, 224), mode="bilinear", align_corners=False))
        if faces and self.use_face_crops:
            crops = roi_align(x, _face_rois(faces, x.shape[2], x.shape[3]), output_size=(160, 160), aligned=True)
            out += self._feats(crops)
        return out


# ArcFace 112x112 alignment template (InsightFace standard).
_ARCFACE_DST = np.array(
    [[38.2946, 51.6963], [73.5318, 51.5014], [56.0252, 71.7366], [41.5493, 92.3655], [70.7299, 92.2041]],
    dtype=np.float32,
)


class ArcFaceSurrogate(Surrogate):
    """InsightFace ArcFace (w600k_r50) converted to PyTorch so we can take gradients.

    This is the identity encoder used by popular face-swap deepfake tools, so
    pushing it away is the most direct protection against face swaps.
    """

    name = "arcface"
    description = "InsightFace ArcFace R50 identity embedding (face-swap encoder)"
    needs_faces = True
    weight = 1.5

    def __init__(self):
        import onnx2torch  # type: ignore
        from insightface.app import FaceAnalysis  # type: ignore  # noqa: F401  (ensures model pack)

        root = Path(os.path.expanduser("~/.insightface/models/buffalo_l"))
        onnx_path = root / "w600k_r50.onnx"
        if not onnx_path.exists():
            FaceAnalysis(name="buffalo_l", allowed_modules=["recognition"], providers=["CPUExecutionProvider"])
        if not onnx_path.exists():
            raise FileNotFoundError(onnx_path)
        import onnx  # type: ignore

        # Pass an in-memory model: converting from a path uses a temp file that fails on Windows.
        self.model = onnx2torch.convert(onnx.load(str(onnx_path))).eval().to(DEVICE).requires_grad_(False)

    def _theta(self, f: Face, h: int, w: int) -> torch.Tensor:
        if f.kps:
            src = np.array(f.kps, np.float32) * np.array([w, h], np.float32)
            m, _ = cv2.estimateAffinePartial2D(src, _ARCFACE_DST, method=cv2.LMEDS)
        else:
            m = None
        if m is None:  # no landmarks: map a square face box to the 112 crop
            cx, cy = (f.x0 + f.x1) / 2 * w, (f.y0 + f.y1) / 2 * h
            side = max((f.x1 - f.x0) * w, (f.y1 - f.y0) * h) * 1.1
            s = 112 / side
            m = np.array([[s, 0, 56 - s * cx], [0, s, 56 - s * cy]], np.float64)
        minv = np.linalg.inv(np.vstack([m, [0, 0, 1]]))
        out_n2p = np.array([[56, 0, 55.5], [0, 56, 55.5], [0, 0, 1]])
        in_p2n = np.array([[2 / w, 0, 1 / w - 1], [0, 2 / h, 1 / h - 1], [0, 0, 1]])
        theta = (in_p2n @ minv @ out_n2p)[:2]
        return torch.tensor(theta, dtype=torch.float32, device=DEVICE)

    def embed(self, x, faces):
        if not faces:
            return None
        h, w = x.shape[2], x.shape[3]
        theta = torch.stack([self._theta(f, h, w) for f in faces])
        grid = F.affine_grid(theta, (len(faces), 3, 112, 112), align_corners=False)
        crops = F.grid_sample(x.expand(len(faces), -1, -1, -1), grid, align_corners=False)
        return [self.model((crops * 255 - 127.5) / 127.5)]


class SDVAESurrogate(Surrogate):
    """Stable Diffusion VAE encoder (PhotoGuard-style encoder attack against diffusion editing)."""

    name = "sd-vae"
    description = "Stable Diffusion VAE encoder (diffusion editors / img2img)"
    weight = 1.0

    def __init__(self):
        from diffusers import AutoencoderKL  # type: ignore

        model_id = os.getenv("AEGIS_VAE_MODEL", "stabilityai/sd-vae-ft-mse")
        self.vae = AutoencoderKL.from_pretrained(model_id).eval().to(DEVICE).requires_grad_(False)
        self.size = int(os.getenv("AEGIS_VAE_SIZE", "320"))

    def embed(self, x, faces):
        h, w = x.shape[2], x.shape[3]
        s = self.size / max(h, w)
        size = (max(64, int(h * s) // 8 * 8), max(64, int(w * s) // 8 * 8))
        x = F.interpolate(x, size=size, mode="bilinear", align_corners=False)
        return [self.vae.encode(x * 2 - 1).latent_dist.mean]


_REGISTRY = {
    "arcface": ArcFaceSurrogate,
    "sd-vae": SDVAESurrogate,
    "imagenet": ImageNetSurrogate,
}

_loaded: list[Surrogate] | None = None
_errors: dict[str, str] = {}


def load_surrogates() -> list[Surrogate]:
    global _loaded
    if _loaded is not None:
        return _loaded
    wanted = list(_REGISTRY) if "auto" in config.SURROGATES else config.SURROGATES
    if config.OFFLINE_TEST:
        wanted = ["imagenet"]
    loaded: list[Surrogate] = []
    for key in wanted:
        cls = _REGISTRY.get(key)
        if cls is None:
            _errors[key] = "unknown surrogate"
            continue
        try:
            loaded.append(cls())
            log.info("Loaded surrogate %s", key)
        except Exception as exc:
            _errors[key] = f"{type(exc).__name__}: {exc}"
            log.info("Surrogate %s not available: %s", key, _errors[key])
    if not loaded:
        raise RuntimeError(f"No surrogate models could be loaded: {_errors}")
    # The generic CNN matters less once specialised encoders are present.
    has_arcface = any(isinstance(s, ArcFaceSurrogate) for s in loaded)
    if len(loaded) > 1:
        for s in loaded:
            if isinstance(s, ImageNetSurrogate):
                s.weight = 0.5
                s.use_face_crops = not has_arcface
    _loaded = loaded
    return loaded


def surrogate_errors() -> dict[str, str]:
    return dict(_errors)
