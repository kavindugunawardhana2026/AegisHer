"""API tests. Run with:  AEGIS_OFFLINE_TEST=1 pytest -q
(offline mode uses an untrained ResNet so no model weights are downloaded)."""
import hashlib
import io
import json
import os

os.environ.setdefault("AEGIS_OFFLINE_TEST", "1")

import numpy as np  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from PIL import Image  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)


def _png(w=320, h=240, exif_gps=False) -> bytes:
    rng = np.random.default_rng(0)
    arr = (rng.random((h, w, 3)) * 255).astype(np.uint8)
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    if exif_gps:
        exif = Image.Exif()
        exif[0x010F] = "TestCam"  # Make
        exif[0x0110] = "Model X"  # Model
        exif.get_ifd(0x8825)[1] = "N"  # GPSLatitudeRef
        img.save(buf, "JPEG", exif=exif)
    else:
        img.save(buf, "PNG")
    return buf.getvalue()


def test_health():
    assert client.get("/api/health").json()["status"] == "ok"


def test_cloak_changes_pixels_within_budget_and_strips_metadata():
    src = _png(exif_gps=True)
    r = client.post("/api/cloak", files={"file": ("me.jpg", src, "image/jpeg")}, data={"strength": "low"})
    assert r.status_code == 200, r.text
    assert r.headers["content-type"] == "image/png"
    m = json.loads(r.headers["x-aegis-metrics"])
    out = Image.open(io.BytesIO(r.content))
    assert not out.getexif()  # no EXIF/GPS in exported photo
    a = np.asarray(Image.open(io.BytesIO(src)).convert("RGB"), dtype=np.int16)
    b = np.asarray(out.convert("RGB"), dtype=np.int16)
    assert a.shape == b.shape
    diff = np.abs(a - b)
    assert diff.max() <= round(m["epsilon_255"]) + 1  # stays inside the L-inf budget
    assert diff.mean() > 0.2  # but did change the image
    assert m["psnr_db"] > 30
    assert m["metadata_stripped"] is True


def test_cloak_rejects_non_image():
    r = client.post("/api/cloak", files={"file": ("x.txt", b"hello", "text/plain")})
    assert r.status_code == 415


def test_evidence_hashes():
    data = _png(exif_gps=True)
    r = client.post("/api/evidence/analyze", files=[("files", ("shot.jpg", data, "image/jpeg"))])
    ev = r.json()["evidence"][0]
    assert ev["sha256"] == hashlib.sha256(data).hexdigest()
    assert len(ev["phash"]) == 16
    assert ev["exif"]["Make"] == "TestCam"
    assert ev["exif_has_gps"] is True


def test_report_pdf():
    incident = {
        "complainant": {"full_name": "Test User", "email": "test@example.com"},
        "incident_type": "deepfake",
        "date_first_seen": "2026-10-20",
        "description": "Someone posted a fake image of me.\nමගේ ඡායාරූපයක් වෙනස් කර පළ කර ඇත.",
        "urls": [{"url": "https://www.facebook.com/some.post/123", "notes": "public post"}, {"url": "t.me/badchannel"}],
    }
    files = [("files", ("a.png", _png(), "image/png")), ("files", ("b.jpg", _png(200, 300, True), "image/jpeg"))]
    r = client.post("/api/report", data={"incident": json.dumps(incident)}, files=files)
    assert r.status_code == 200, r.text
    assert r.content.startswith(b"%PDF")
    assert r.headers["x-report-sha256"] == hashlib.sha256(r.content).hexdigest()
    assert r.headers["x-report-id"].startswith("AH-")


def test_report_validation_error():
    r = client.post("/api/report", data={"incident": json.dumps({"incident_type": "nope"})})
    assert r.status_code == 422
