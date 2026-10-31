"""Takedown dossier PDF (ReportLab).

Everything is built in memory. The PDF contains:
- incident summary, complainant details, description
- offending URLs (labelled by platform)
- evidence register: SHA-256 / SHA-512 / pHash / dHash / EXIF per exhibit
- a formal takedown request, chain-of-custody statement and manifest hash
- an annex listing where to submit it (SLCERT, Police, platforms)
"""
from __future__ import annotations

import io
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image as PILImage
from PIL import ImageFilter, ImageOps
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from ..contacts import AUTHORITIES, PLATFORMS
from ..schemas import INCIDENT_LABELS, Incident, platform_for
from .hashing import manifest_hash

TOOL_VERSION = "AegisHer 0.1.0"
SL_TZ = timezone(timedelta(hours=5, minutes=30), "Asia/Colombo")  # Sri Lanka has no DST

INK = colors.HexColor("#1f1630")
ACCENT = colors.HexColor("#7c3aed")
MUTED = colors.HexColor("#6b6280")
RULE = colors.HexColor("#ddd6ee")
SOFT = colors.HexColor("#f5f1fc")

# ---------------------------------------------------------------- fonts ---
_FONT_CANDIDATES = [
    (os.getenv("AEGIS_PDF_FONT"), 0, os.getenv("AEGIS_PDF_FONT_BOLD"), 0),
    (str(Path(__file__).resolve().parents[2] / "fonts" / "NotoSansSinhala-Regular.ttf"), 0,
     str(Path(__file__).resolve().parents[2] / "fonts" / "NotoSansSinhala-Bold.ttf"), 0),
    ("C:/Windows/Fonts/Nirmala.ttc", 0, "C:/Windows/Fonts/Nirmala.ttc", 1),
    ("/usr/share/fonts/truetype/noto/NotoSansSinhala-Regular.ttf", 0,
     "/usr/share/fonts/truetype/noto/NotoSansSinhala-Bold.ttf", 0),
]


def _register_fonts() -> tuple[str, str]:
    """Register a Unicode font that covers Sinhala (shaped via uharfbuzz)."""
    for reg, reg_i, bold, bold_i in _FONT_CANDIDATES:
        if not reg or not Path(reg).exists():
            continue
        try:
            pdfmetrics.registerFont(TTFont("AegisBody", reg, subfontIndex=reg_i))
            if bold and Path(bold).exists():
                pdfmetrics.registerFont(TTFont("AegisBold", bold, subfontIndex=bold_i))
            else:
                pdfmetrics.registerFont(TTFont("AegisBold", reg, subfontIndex=reg_i))
            pdfmetrics.registerFontFamily("AegisBody", normal="AegisBody", bold="AegisBold",
                                          italic="AegisBody", boldItalic="AegisBold")
            return "AegisBody", "AegisBold"
        except Exception:
            continue
    return "Helvetica", "Helvetica-Bold"


BODY, BOLD = _register_fonts()
MONO = "Courier"


def _styles():
    ss = getSampleStyleSheet()
    s = {
        "title": ParagraphStyle("t", parent=ss["Title"], fontName=BOLD, fontSize=17, leading=21,
                                textColor=INK, alignment=TA_LEFT, spaceAfter=2),
        "brand": ParagraphStyle("b", fontName=BOLD, fontSize=9, textColor=ACCENT, leading=11),
        "h": ParagraphStyle("h", fontName=BOLD, fontSize=11.5, leading=15, textColor=ACCENT,
                            spaceBefore=10, spaceAfter=4),
        "body": ParagraphStyle("p", fontName=BODY, fontSize=9.5, leading=13.5, textColor=INK),
        "small": ParagraphStyle("s", fontName=BODY, fontSize=8, leading=10.5, textColor=MUTED),
        "cell": ParagraphStyle("c", fontName=BODY, fontSize=8.5, leading=11, textColor=INK),
        "cellb": ParagraphStyle("cb", fontName=BOLD, fontSize=8.5, leading=11, textColor=INK),
        "mono": ParagraphStyle("m", fontName=MONO, fontSize=7.4, leading=9.2, textColor=INK),
    }
    for st in s.values():
        st.shaping = 1  # HarfBuzz shaping: needed for Sinhala/Tamil vowel signs and conjuncts
    return s


def _p(text, style) -> Paragraph:
    return Paragraph(escape(str(text)).replace("\n", "<br/>"), style)


def _hex_lines(h: str, width: int = 32) -> str:
    return "<br/>".join(h[i:i + width] for i in range(0, len(h), width))


def _kv_table(rows, s, col=(42 * mm, None)):
    data = [[_p(k, s["cellb"]), v if not isinstance(v, str) else _p(v, s["cell"])] for k, v in rows]
    t = Table(data, colWidths=[col[0], (A4[0] - 36 * mm) - col[0]])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE),
        ("BACKGROUND", (0, 0), (0, -1), SOFT),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
    ]))
    return t


def _qr(payload: str, size=30 * mm) -> Drawing:
    w = QrCodeWidget(payload)
    b = w.getBounds()
    d = Drawing(size, size, transform=[size / (b[2] - b[0]), 0, 0, size / (b[3] - b[1]), 0, 0])
    d.add(w)
    return d


def _thumbnail(data: bytes, mode: str, box=(52 * mm, 52 * mm)) -> Image | None:
    if mode == "none":
        return None
    try:
        im = ImageOps.exif_transpose(PILImage.open(io.BytesIO(data))).convert("RGB")
    except Exception:
        return None
    im.thumbnail((700, 700))
    if mode == "blurred":
        im = im.filter(ImageFilter.GaussianBlur(radius=max(im.size) / 28))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=82)
    buf.seek(0)
    ratio = min(box[0] / im.width, box[1] / im.height)
    return Image(buf, width=im.width * ratio, height=im.height * ratio)


class _NumberedCanvas(rl_canvas.Canvas):
    """Adds 'Page X of Y' + report id footer on every page."""

    footer_left = ""

    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)
        self._pages = []

    def showPage(self):
        self._pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._pages)
        for state in self._pages:
            self.__dict__.update(state)
            self.setFont(BODY, 7.5)
            self.setFillColor(MUTED)
            self.drawString(18 * mm, 10 * mm, self.footer_left)
            self.drawRightString(A4[0] - 18 * mm, 10 * mm, f"Page {self._pageNumber} of {total}")
            self.setStrokeColor(RULE)
            self.line(18 * mm, 13.5 * mm, A4[0] - 18 * mm, 13.5 * mm)
            super().showPage()
        super().save()


def build_report(incident: Incident, evidence: list[dict], blobs: list[bytes],
                 thumbnails: str = "blurred") -> tuple[bytes, dict, str]:
    """Return (pdf_bytes, manifest, manifest_sha256)."""
    s = _styles()
    now = datetime.now(timezone.utc)
    report_id = f"AH-{now:%Y%m%d}-{uuid.uuid4().hex[:8].upper()}"

    manifest = {
        "report_id": report_id,
        "generated_utc": now.isoformat(timespec="seconds"),
        "tool": TOOL_VERSION,
        "incident": incident.model_dump(mode="json"),
        "evidence": evidence,
    }
    mhash = manifest_hash(manifest)

    c = incident.complainant
    platforms = sorted({platform_for(u.url) for u in incident.urls})
    story = []

    # ---- header
    head = Table(
        [[[Paragraph("AEGISHER · EVIDENCE DOSSIER", s["brand"]),
           Paragraph("Cyber-Harassment Incident Report &amp; Takedown Request", s["title"]),
           _p(f"Report ID: {report_id}", s["body"]),
           _p(f"Generated: {now:%Y-%m-%d %H:%M:%S} UTC  ·  {now.astimezone(SL_TZ):%Y-%m-%d %H:%M} Sri Lanka time", s["small"])],
          _qr(f"{report_id}|manifest-sha256:{mhash}")]],
        colWidths=[(A4[0] - 36 * mm) - 34 * mm, 34 * mm],
    )
    head.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("ALIGN", (1, 0), (1, 0), "RIGHT")]))
    story += [head, Spacer(1, 4)]
    story.append(_p(
        "Prepared by the complainant with the AegisHer tool. This is not an official document of any authority; "
        "it is a structured record of the complaint and of the digital evidence, with cryptographic fingerprints "
        "that allow the recipient to verify the evidence has not been altered.", s["small"]))

    # ---- 1. summary
    story.append(Paragraph("1. Summary", s["h"]))
    story.append(_kv_table([
        ("Incident type", INCIDENT_LABELS.get(incident.incident_type, incident.incident_type)),
        ("First noticed", incident.date_first_seen.isoformat() if incident.date_first_seen else "Not stated"),
        ("Platforms involved", ", ".join(platforms) if platforms else "Not stated"),
        ("Offending URLs", str(len(incident.urls))),
        ("Evidence files", str(len(evidence))),
    ], s))

    # ---- 2. complainant
    story.append(Paragraph("2. Complainant", s["h"]))
    rows = [("Full name", c.full_name)]
    for label, val in (("Reporting on behalf of", c.on_behalf_of), ("Email", c.email), ("Phone", c.phone),
                       ("NIC", c.nic), ("Address", c.address)):
        if val:
            rows.append((label, val))
    story.append(_kv_table(rows, s))

    # ---- 3. description
    story.append(Paragraph("3. Description of the incident", s["h"]))
    story.append(_p(incident.description, s["body"]))
    if incident.perpetrator:
        story.append(Spacer(1, 4))
        story.append(_kv_table([("Suspected account(s) / person(s)", incident.perpetrator)], s, col=(52 * mm, None)))

    # ---- 4. URLs
    story.append(Paragraph("4. Offending content (URLs)", s["h"]))
    if incident.urls:
        data = [[_p("#", s["cellb"]), _p("Platform", s["cellb"]), _p("URL", s["cellb"]), _p("Notes", s["cellb"])]]
        for i, u in enumerate(incident.urls, 1):
            data.append([_p(i, s["cell"]), _p(platform_for(u.url), s["cell"]),
                         Paragraph(escape(u.url), s["mono"]), _p(u.notes or "", s["cell"])])
        t = Table(data, colWidths=[8 * mm, 28 * mm, 92 * mm, None], repeatRows=1)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), SOFT), ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE),
        ]))
        story.append(t)
    else:
        story.append(_p("No URLs supplied.", s["body"]))

    # ---- 5. evidence register
    story.append(Paragraph("5. Digital evidence register", s["h"]))
    story.append(_p(
        "Each file was fingerprinted on receipt, before any processing. SHA-256/SHA-512 identify the exact bytes; "
        "pHash/dHash are perceptual hashes that match visually identical copies even after resizing or re-compression. "
        + ("Thumbnails are blurred to avoid re-distributing harmful imagery." if thumbnails == "blurred" else ""),
        s["small"]))
    story.append(Spacer(1, 4))
    for ev, blob in zip(evidence, blobs):
        rows = [
            ("File", ev["filename"]),
            ("Type / size", f"{ev.get('image_format') or ev['content_type']} · {ev['size_bytes']:,} bytes"
             + (f" · {ev['width']}×{ev['height']} px" if ev.get("width") else "")),
            ("Received (UTC)", ev["received_utc"]),
            ("SHA-256", Paragraph(_hex_lines(ev["sha256"]), s["mono"])),
            ("SHA-512", Paragraph(_hex_lines(ev["sha512"]), s["mono"])),
        ]
        if ev.get("phash"):
            rows.append(("pHash / dHash", Paragraph(f"{ev['phash']} / {ev['dhash']}", s["mono"])))
        exif = ev.get("exif") or {}
        if exif:
            rows.append(("EXIF", "; ".join(f"{k}: {v}" for k, v in exif.items())))
        if ev.get("exif_has_gps"):
            rows.append(("Location data", "Original file contains GPS data (withheld from this report; available on request)."))
        detail = Table([[_p(k, s["cellb"]), v if not isinstance(v, str) else _p(v, s["cell"])] for k, v in rows],
                       colWidths=[26 * mm, 70 * mm])
        detail.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LINEBELOW", (0, 0), (-1, -1), 0.3, RULE),
                                    ("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))
        thumb = _thumbnail(blob, thumbnails) if ev.get("is_image") else None
        block = Table(
            [[Paragraph(f"<b>Exhibit {ev['exhibit']}</b>", s["body"]), ""], [thumb or _p("(no preview)", s["small"]), detail]],
            colWidths=[(A4[0] - 36 * mm) - 98 * mm, 98 * mm],
        )
        block.setStyle(TableStyle([
            ("SPAN", (0, 0), (1, 0)), ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BOX", (0, 0), (-1, -1), 0.6, RULE), ("BACKGROUND", (0, 0), (-1, 0), SOFT),
        ]))
        story += [KeepTogether(block), Spacer(1, 6)]
    if not evidence:
        story.append(_p("No evidence files supplied.", s["body"]))

    # ---- 6. request
    story.append(Paragraph("6. Takedown and preservation request", s["h"]))
    story.append(_p(
        f"I, {c.full_name}, report that the content listed above was published or shared without my consent and "
        "causes me harm. I request that the receiving platform or authority:", s["body"]))
    for a in incident.requested_actions:
        story.append(_p(f"•  {a}", s["body"]))
    story.append(Spacer(1, 3))
    story.append(_p(
        "Please quote the Report ID in any correspondence. The perceptual hashes in Section 5 may be used to "
        "locate and block identical or near-identical copies.", s["body"]))

    # ---- 7. integrity
    story.append(Paragraph("7. Integrity and chain of custody", s["h"]))
    story.append(_kv_table([
        ("Manifest SHA-256", Paragraph(_hex_lines(mhash), s["mono"])),
        ("Hashing tool", f"{TOOL_VERSION} (Python hashlib, ImageHash)"),
        ("Handling", "Files were processed in memory only and were not stored by the AegisHer service. "
                     "The complainant retains the original files."),
        ("How to verify", "Compute SHA-256 of the original file (e.g. 'certutil -hashfile FILE SHA256' on "
                          "Windows, 'sha256sum FILE' on Linux/macOS) and compare with Section 5."),
    ], s))

    # ---- 8. declaration
    story.append(Paragraph("8. Declaration", s["h"]))
    story.append(_p("I declare that the information in this report is true and correct to the best of my knowledge.",
                    s["body"]))
    story.append(Spacer(1, 18))
    sig = Table([["_______________________________", "_______________________"],
                 [_p("Signature of complainant", s["small"]), _p("Date", s["small"])]],
                colWidths=[95 * mm, None])
    story.append(sig)

    # ---- annex
    story += [PageBreak(), Paragraph("Annex A - Where to submit this report", s["h"])]
    story.append(_p("Sri Lanka", s["cellb"]))
    for a in AUTHORITIES:
        bits = [a["how"]]
        for k in ("phone", "email", "link"):
            if a.get(k):
                bits.append(a[k])
        story.append(_p(f"•  {a['name']}: " + " · ".join(bits), s["body"]))
    story.append(Spacer(1, 6))
    story.append(_p("Platforms", s["cellb"]))
    for p in PLATFORMS:
        story.append(_p(f"•  {p['name']}: {p['link']}", s["body"]))
    story.append(Spacer(1, 8))
    story.append(_p("Contact details change; check the official website before submitting. "
                    "Keep the original files - do not edit, crop or re-save them.", s["small"]))

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=16 * mm,
                            bottomMargin=18 * mm, title=f"AegisHer report {report_id}", author=c.full_name,
                            subject="Cyber-harassment incident report", creator=TOOL_VERSION)

    class _Canvas(_NumberedCanvas):
        footer_left = f"{report_id}  ·  manifest {mhash[:16]}…  ·  CONFIDENTIAL"

    doc.build(story, canvasmaker=_Canvas)
    return buf.getvalue(), manifest, mhash
