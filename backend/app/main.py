"""AegisHer API.

Privacy rule: user photos and evidence are processed in RAM and never written
to disk or logged. Starlette normally spools uploads >1 MB to a temp file, so
we raise that threshold above our upload limit.
"""
from __future__ import annotations

import asyncio
import hashlib
import io
import json
import logging

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from PIL import Image, UnidentifiedImageError
from pydantic import ValidationError
from starlette.formparsers import MultiPartParser

from . import config
from .cloak import cloak_image, engine_status
from .contacts import AUTHORITIES, PLATFORMS
from .forensics.hashing import analyze_evidence
from .forensics.report import TOOL_VERSION, build_report
from .schemas import Incident

MultiPartParser.spool_max_size = config.MAX_TOTAL_UPLOAD_BYTES + 1024 * 1024  # keep uploads in RAM

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("aegisher")

app = FastAPI(title="AegisHer API", version="0.1.0",
              description="Anti-deepfake photo cloaking and cyber-harassment evidence reports.")
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    expose_headers=["X-Aegis-Metrics", "X-Report-Id", "X-Report-SHA256", "X-Manifest-SHA256", "Content-Disposition"],
)

_cloak_slots = asyncio.Semaphore(config.MAX_CONCURRENT_CLOAKS)


@app.middleware("http")
async def privacy_headers(request: Request, call_next):
    length = request.headers.get("content-length")
    if length and length.isdigit() and int(length) > config.MAX_TOTAL_UPLOAD_BYTES:
        return JSONResponse({"detail": "Upload too large"}, status_code=413)
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


async def _read_limited(f: UploadFile, limit: int) -> bytes:
    data = await f.read(limit + 1)
    if len(data) > limit:
        raise HTTPException(413, f"{f.filename}: file larger than {limit // (1024 * 1024)} MB")
    return data


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": TOOL_VERSION}


@app.get("/api/engine")
async def engine():
    """Which models the cloak attacks on this server (loads them on first call)."""
    return await run_in_threadpool(engine_status)


@app.get("/api/contacts")
async def contacts():
    return {"authorities": AUTHORITIES, "platforms": PLATFORMS}


@app.post("/api/cloak")
async def cloak(
    file: UploadFile = File(...),
    strength: str = Form("medium"),
    output_format: str = Form("png"),
):
    """Return the cloaked photo. Metrics come back as JSON in the X-Aegis-Metrics header."""
    if output_format not in ("png", "jpeg"):
        raise HTTPException(422, "output_format must be png or jpeg")
    data = await _read_limited(file, config.MAX_IMAGE_BYTES)
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(415, "Not a supported image file")
    if img.width * img.height > 40_000_000:
        raise HTTPException(413, "Image resolution too large (max 40 MP)")

    async with _cloak_slots:
        try:
            result = await run_in_threadpool(cloak_image, img, strength)
        except ValueError as exc:
            raise HTTPException(422, str(exc))

    buf = io.BytesIO()
    if output_format == "png":
        result.image.save(buf, "PNG", optimize=False, compress_level=6)
        media, ext = "image/png", "png"
    else:
        result.image.save(buf, "JPEG", quality=95, subsampling=0)
        media, ext = "image/jpeg", "jpg"
    stem = (file.filename or "photo").rsplit(".", 1)[0][:60].encode("ascii", "ignore").decode() or "photo"
    return Response(
        buf.getvalue(),
        media_type=media,
        headers={
            "X-Aegis-Metrics": json.dumps(result.metrics),
            "Content-Disposition": f'attachment; filename="{stem}_aegis.{ext}"',
        },
    )


async def _collect_evidence(files: list[UploadFile]) -> tuple[list[dict], list[bytes]]:
    if len(files) > config.MAX_EVIDENCE_FILES:
        raise HTTPException(413, f"At most {config.MAX_EVIDENCE_FILES} evidence files")
    items, blobs, total = [], [], 0
    for i, f in enumerate(files, 1):
        data = await _read_limited(f, config.MAX_IMAGE_BYTES)
        total += len(data)
        if total > config.MAX_TOTAL_UPLOAD_BYTES:
            raise HTTPException(413, "Total upload too large")
        items.append(await run_in_threadpool(analyze_evidence, data, f.filename, f.content_type, i))
        blobs.append(data)
    return items, blobs


@app.post("/api/evidence/analyze")
async def evidence_analyze(files: list[UploadFile] = File(...)):
    """Hash + inspect evidence files (preview step of the wizard)."""
    items, _ = await _collect_evidence(files)
    return {"evidence": items}


@app.post("/api/report")
async def report(
    incident: str = Form(..., description="Incident JSON (see schemas.Incident)"),
    files: list[UploadFile] = File(default=[]),
    thumbnails: str = Form("blurred"),
):
    if thumbnails not in ("blurred", "full", "none"):
        raise HTTPException(422, "thumbnails must be blurred, full or none")
    try:
        inc = Incident.model_validate_json(incident)
    except ValidationError as exc:
        raise HTTPException(422, json.loads(exc.json(include_url=False)))
    items, blobs = await _collect_evidence(files)
    pdf, manifest, mhash = await run_in_threadpool(build_report, inc, items, blobs, thumbnails)
    rid = manifest["report_id"]
    return Response(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{rid}.pdf"',
            "X-Report-Id": rid,
            "X-Report-SHA256": hashlib.sha256(pdf).hexdigest(),
            "X-Manifest-SHA256": mhash,
        },
    )
