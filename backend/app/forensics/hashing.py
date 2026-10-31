"""Evidence fingerprinting.

SHA-256  - cryptographic hash of the exact bytes received. Any change, even one
           bit, gives a different value: proves the file was not altered later.
pHash    - perceptual hash of what the picture *looks like*. Survives resizing
           and re-compression, so platforms can find re-uploads / copies.
dHash    - second perceptual hash (gradient based) for extra matching confidence.
"""
from __future__ import annotations

import hashlib
import io
import json
from datetime import datetime, timezone

import imagehash
from PIL import ExifTags, Image, ImageOps

Image.MAX_IMAGE_PIXELS = 80_000_000  # refuse decompression bombs

_EXIF_KEEP = {
    "DateTime", "DateTimeOriginal", "DateTimeDigitized", "Make", "Model",
    "Software", "LensModel", "OffsetTime", "OffsetTimeOriginal", "ImageDescription", "Artist",
}


def _exif(img: Image.Image) -> tuple[dict, bool]:
    try:
        raw = img.getexif()
    except Exception:
        return {}, False
    out: dict[str, str] = {}
    tags = dict(raw.items())
    try:  # DateTimeOriginal etc. live in the Exif sub-IFD
        tags.update(raw.get_ifd(ExifTags.IFD.Exif))
    except Exception:
        pass
    for tag_id, value in tags.items():
        name = ExifTags.TAGS.get(tag_id, str(tag_id))
        if name in _EXIF_KEEP:
            if isinstance(value, bytes):
                value = value.decode("utf-8", "replace")
            out[name] = str(value).strip("\x00 ")[:200]
    has_gps = False
    try:
        has_gps = bool(raw.get_ifd(ExifTags.IFD.GPSInfo))
    except Exception:
        pass
    return out, has_gps


def analyze_evidence(data: bytes, filename: str, content_type: str | None, index: int) -> dict:
    received = datetime.now(timezone.utc)
    item = {
        "exhibit": f"E-{index:02d}",
        "filename": filename or f"evidence_{index}",
        "content_type": content_type or "application/octet-stream",
        "size_bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "sha512": hashlib.sha512(data).hexdigest(),
        "received_utc": received.isoformat(timespec="seconds"),
        "is_image": False,
    }
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
        exif, has_gps = _exif(img)
        view = ImageOps.exif_transpose(img)
        item.update(
            is_image=True,
            image_format=img.format,
            width=view.width,
            height=view.height,
            phash=str(imagehash.phash(view)),
            dhash=str(imagehash.dhash(view)),
            exif=exif,
            # GPS coordinates are NOT copied into the report (victim privacy);
            # we only record that they existed in the original file.
            exif_has_gps=has_gps,
        )
    except Exception as exc:
        item["image_error"] = f"Not a readable image ({type(exc).__name__})"
    return item


def canonical_json(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def manifest_hash(manifest: dict) -> str:
    return hashlib.sha256(canonical_json(manifest)).hexdigest()
