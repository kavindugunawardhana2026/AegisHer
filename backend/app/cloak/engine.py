"""Adversarial cloaking: L-infinity PGD with Expectation-over-Transformation.

Pipeline
1. Fix EXIF orientation, drop all metadata (EXIF/GPS never leave the app).
2. Detect faces -> soft mask (full budget on faces, reduced on background).
3. Optimise a perturbation `delta` at a working resolution so that every
   surrogate encoder (ArcFace / SD-VAE / ResNet) sees an encoding that is as
   *dissimilar* as possible to the clean photo's encoding.
   Each step applies a random transform (resize, blur, noise) so the cloak
   survives the re-compression social networks apply (EOT).
4. Upsample `delta` to full resolution, add, clip, quantise.
5. Measure: PSNR (visual change) and encoder similarity before/after,
   including after a JPEG q=80 round-trip (approximates Instagram/FB).
"""
from __future__ import annotations

import io
import math
import random
import threading
import time
from dataclasses import dataclass

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image, ImageOps

from .. import config
from .faces import Face, detect_faces, detector_name, face_mask
from .surrogates import DEVICE, load_surrogates, surrogate_errors

if config.TORCH_THREADS:
    torch.set_num_threads(config.TORCH_THREADS)


@dataclass(frozen=True)
class Preset:
    epsilon: float  # max per-pixel change (0..1 scale)
    steps: int
    work_size: int  # longest side used during optimisation
    background: float  # budget multiplier outside faces


PRESETS = {
    "low": Preset(4 / 255, 30, 512, 0.5),
    "medium": Preset(8 / 255, 60, 512, 0.6),
    "high": Preset(12 / 255, 100, 640, 0.7),
}


@dataclass
class CloakResult:
    image: Image.Image
    metrics: dict


_lock = threading.Lock()  # guards lazy model loading


def engine_status() -> dict:
    with _lock:
        try:
            models = [{"name": s.name, "description": s.description, "weight": s.weight} for s in load_surrogates()]
        except RuntimeError as exc:
            models = []
            err = str(exc)
        else:
            err = None
    return {
        "device": str(DEVICE),
        "face_detector": detector_name(),
        "surrogates": models,
        "unavailable": surrogate_errors(),
        "offline_test_mode": config.OFFLINE_TEST,
        "presets": {k: {"epsilon_255": round(p.epsilon * 255, 1), "steps": p.steps} for k, p in PRESETS.items()},
        "error": err,
    }


def _to_tensor(arr: np.ndarray) -> torch.Tensor:
    return torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0).float().div(255).to(DEVICE)


def _to_uint8(t: torch.Tensor) -> np.ndarray:
    return (t.clamp(0, 1).squeeze(0).permute(1, 2, 0).cpu().numpy() * 255).round().astype(np.uint8)


def _resize_arr(arr: np.ndarray, max_side: int) -> np.ndarray:
    h, w = arr.shape[:2]
    s = max_side / max(h, w)
    if s >= 1:
        return arr
    return np.array(Image.fromarray(arr).resize((round(w * s), round(h * s)), Image.LANCZOS))


def _gaussian_blur(x: torch.Tensor, sigma: float) -> torch.Tensor:
    r = max(1, int(math.ceil(sigma * 2)))
    k = torch.arange(-r, r + 1, device=x.device, dtype=x.dtype)
    k = torch.exp(-(k**2) / (2 * sigma**2))
    k = (k / k.sum()).view(1, 1, 1, -1).repeat(3, 1, 1, 1)
    x = F.conv2d(F.pad(x, (r, r, 0, 0), mode="reflect"), k, groups=3)
    return F.conv2d(F.pad(x, (0, 0, r, r), mode="reflect"), k.transpose(2, 3), groups=3)


def _eot(x: torch.Tensor) -> torch.Tensor:
    """Random, differentiable approximation of what platforms do to uploads."""
    choice = random.random()
    if choice < 0.35:  # down/up-scale (platform resizing)
        h, w = x.shape[2:]
        s = random.uniform(0.6, 0.95)
        x = F.interpolate(x, size=(max(32, int(h * s)), max(32, int(w * s))), mode="bilinear", align_corners=False)
    elif choice < 0.55:  # mild blur (JPEG removes high frequencies)
        x = _gaussian_blur(x, random.uniform(0.4, 1.0))
    elif choice < 0.70:  # sensor-like noise
        x = (x + torch.randn_like(x) * random.uniform(0.005, 0.015)).clamp(0, 1)
    return x


def _psnr(a: np.ndarray, b: np.ndarray) -> float:
    mse = np.mean((a.astype(np.float64) - b.astype(np.float64)) ** 2)
    return float("inf") if mse == 0 else 10 * math.log10(255**2 / mse)


def _jpeg_roundtrip(arr: np.ndarray, quality: int = 80) -> np.ndarray:
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, "JPEG", quality=quality)
    return np.array(Image.open(io.BytesIO(buf.getvalue())).convert("RGB"))


@torch.no_grad()
def _similarities(surrogates, clean_embs, arr: np.ndarray, faces: list[Face], work_size: int) -> dict:
    x = _to_tensor(_resize_arr(arr, work_size))
    out = {}
    for s, ref in zip(surrogates, clean_embs):
        if ref is None:
            continue
        emb = s.embed(x, faces)
        if emb is not None:
            out[s.name] = round(float(s.similarity(emb, ref)), 4)
    return out


def cloak_image(img: Image.Image, strength: str = "medium", seed: int | None = None) -> CloakResult:
    preset = PRESETS.get(strength)
    if preset is None:
        raise ValueError(f"strength must be one of {list(PRESETS)}")
    t0 = time.perf_counter()
    if seed is not None:
        random.seed(seed)
        torch.manual_seed(seed)

    with _lock:
        surrogates = load_surrogates()

    img = ImageOps.exif_transpose(img).convert("RGB")
    full = np.array(img)  # H, W, 3 uint8 - metadata is gone from here on
    H, W = full.shape[:2]
    faces = detect_faces(full)

    work = _resize_arr(full, preset.work_size)
    h, w = work.shape[:2]
    x0 = _to_tensor(work)
    mask = torch.from_numpy(face_mask(faces, h, w, preset.background)).to(DEVICE)[None, None]

    with torch.no_grad():
        clean = [s.embed(x0, faces) for s in surrogates]
    active = [(s, e) for s, e in zip(surrogates, clean) if e is not None]

    eps = preset.epsilon
    alpha = eps / 4  # step size; PGD typically uses eps/4..eps/10 with many steps
    delta = (torch.rand_like(x0) * 2 - 1) * eps * 0.5
    delta.requires_grad_(True)
    loss_trace = []

    for step in range(preset.steps):
        x_adv = (x0 + delta * mask).clamp(0, 1)
        x_t = _eot(x_adv) if step % 4 else x_adv  # every 4th step on the untouched image
        loss = sum(s.weight * s.similarity(s.embed(x_t, faces), ref) for s, ref in active)
        loss.backward()
        with torch.no_grad():
            delta -= alpha * delta.grad.sign()
            delta.clamp_(-eps, eps)
            delta.copy_((x0 + delta).clamp(0, 1) - x0)
        delta.grad = None
        if step % 10 == 0 or step == preset.steps - 1:
            loss_trace.append(round(float(loss), 4))

    with torch.no_grad():
        d = (delta * mask).detach()
        if (h, w) != (H, W):
            d = F.interpolate(d, size=(H, W), mode="bicubic", align_corners=False)
        d = d.clamp(-eps, eps)
        out_arr = _to_uint8(_to_tensor(full) + d)

    sims_png = _similarities(surrogates, clean, out_arr, faces, preset.work_size)
    sims_jpeg = _similarities(surrogates, clean, _jpeg_roundtrip(out_arr), faces, preset.work_size)

    metrics = {
        "strength": strength,
        "epsilon_255": round(eps * 255, 1),
        "steps": preset.steps,
        "faces_detected": len(faces),
        "faces": [f.to_dict() for f in faces],
        "face_detector": detector_name(),
        "width": W,
        "height": H,
        "psnr_db": round(_psnr(full, out_arr), 2),
        # 1.0 = encoder sees the same thing as the clean photo; lower = better protection.
        "encoder_similarity": sims_png,
        "encoder_similarity_after_jpeg80": sims_jpeg,
        "loss_trace": loss_trace,
        "metadata_stripped": True,
        "seconds": round(time.perf_counter() - t0, 2),
        "device": str(DEVICE),
    }
    return CloakResult(Image.fromarray(out_arr), metrics)
