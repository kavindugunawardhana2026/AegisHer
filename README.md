# AegisHer – Anti-Deepfake Cloaking & Cyber-Harassment Shield

AegisHer helps women and girls (Sri Lanka first) in two ways:

1. **Photo Shield (adversarial cloaking).** Before posting a photo, AegisHer adds small pixel
   changes that are hard to see. The face-recognition encoders that deepfake / face-swap tools rely
   on then read a different identity, so the fake comes out wrong. Location (GPS) and camera
   metadata are removed too.
2. **Evidence & takedown report.** Upload screenshots and paste links. AegisHer fingerprints every
   file (SHA-256, SHA-512, pHash, dHash, EXIF) and builds a PDF dossier with a takedown request,
   a chain-of-custody statement and where to submit it (SLCERT, Police CID, platforms).

```
AegisHer/
├── backend/   FastAPI + PyTorch cloaking engine + ReportLab PDF (Python 3.11)
├── web/       React + Tailwind web app (Vite): Photo Shield studio, report wizard, EN / සිංහල
├── mobile/    Flutter app source (share-sheet intake, report wizard, offline PDF viewer)
└── samples/   sample_report.pdf
```

## Run it

**Backend** (Python 3.11; use the venv already in `backend/.venv`, or create one):

```bash
cd backend
uv venv --python 3.11 .venv
uv pip install --python .venv/Scripts/python.exe -r requirements.txt
uv pip install --python .venv/Scripts/python.exe insightface onnxruntime onnx onnx2torch uharfbuzz
.venv/Scripts/python.exe -m uvicorn app.main:app --port 8000
```

On first use it downloads models (~400 MB) into `backend/.models/` (InsightFace `buffalo_l`,
torchvision ResNet-50). API docs: http://127.0.0.1:8000/docs

**Web app:**

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173. `/api` is proxied to the backend.

**Tests:**

```bash
cd backend
AEGIS_OFFLINE_TEST=1 .venv/Scripts/python.exe -m pytest -q
```

## API

| Method | Path | What it does |
|---|---|---|
| POST | `/api/cloak` | multipart `file`, `strength` = low/medium/high → shielded PNG; metrics in `X-Aegis-Metrics` |
| POST | `/api/evidence/analyze` | multipart `files[]` → hashes + metadata per file |
| POST | `/api/report` | multipart `incident` (JSON), `files[]`, `thumbnails` = blurred/full/none → PDF; `X-Report-Id`, `X-Report-SHA256`, `X-Manifest-SHA256` |
| GET | `/api/engine` | which models are loaded |
| GET | `/api/contacts` | where to report (edit `backend/app/contacts.py`) |

## How the cloak works

`backend/app/cloak/engine.py`: L∞-bounded **PGD** with **Expectation over Transformation**.

- **Targets (surrogates):** InsightFace **ArcFace R50** (the identity encoder used by popular
  face-swappers), converted to PyTorch with onnx2torch so gradients flow through it. Also an
  ImageNet **ResNet-50** for general feature disruption, and optionally the **Stable Diffusion VAE**
  encoder (PhotoGuard-style, against diffusion editing) if `diffusers` is installed.
- **Where:** SCRFD face detection with 5-point landmarks and ArcFace alignment done inside the
  graph (`affine_grid`). Full budget on faces, reduced on the background, and reduced on flat areas
  like skin and sky (texture-adaptive mask) so the noise stays hard to see.
- **Robustness:** random resize, blur and noise during optimisation, so it survives platform
  re-compression.
- **Output:** PNG with all metadata stripped, plus metrics: PSNR, and the encoder similarity before
  and after a JPEG q80 round-trip.

### Measured results (CPU, `scripts/evaluate_cloak.py`)

Identity similarity uses InsightFace's own ONNX pipeline: its own detector, alignment and
recognition, separate from the PyTorch copy we attack. 1.0 = same person; below ~0.2 = recognised
as a different person.

Single-face photo, 800×800:

| Strength | PSNR | Identity sim (PNG) | after JPEG 90 | after JPEG 75 | Time (CPU) |
|---|---|---|---|---|---|
| clean | – | 1.00 | 0.997 (re-encode baseline) | | |
| Light | 46.0 dB | 0.45 | 0.45 | 0.44 | ~20 s |
| **Balanced** | **41.0 dB** | **0.01** | **0.13** | **0.10** | ~25 s |
| Maximum | 37.4 dB | −0.13 | −0.06 | −0.23 | ~40 s |

**Limits.** These numbers are white-box: the same ArcFace weights the attack optimises against.
Other recognisers, future models, heavy edits or screenshot-of-a-screenshot can weaken the cloak.
The app says this to users and presents the cloak as one layer of protection.

**Speed.** On CPU each photo takes 20–60 s. The engine uses CUDA automatically when available. For
an NVIDIA GPU (e.g. RTX 50-series), install a CUDA build of torch:
`uv pip install --python .venv/Scripts/python.exe --index-url https://download.pytorch.org/whl/cu128 torch torchvision`

## Privacy

- Uploads stay in RAM: Starlette's 1 MB disk spool threshold is raised above the upload limit.
  Nothing is written to disk or logged, and responses are `Cache-Control: no-store`.
- Shielded photos have EXIF/GPS removed. Evidence reports never copy GPS coordinates; they only note
  that the original file had them.
- PDF thumbnails are blurred by default so the report doesn't spread the harmful image further.

## Configuration (env vars)

| Variable | Default | |
|---|---|---|
| `AEGIS_SURROGATES` | `auto` | comma list: `arcface,sd-vae,imagenet` |
| `AEGIS_MODEL_DIR` | `backend/.models` | where model weights are stored |
| `AEGIS_CORS_ORIGINS` | localhost:5173 | |
| `AEGIS_MAX_IMAGE_MB` / `AEGIS_MAX_TOTAL_MB` | 20 / 120 | upload limits |
| `AEGIS_MAX_CONCURRENT_CLOAKS` | 2 | |
| `AEGIS_PDF_FONT` / `AEGIS_PDF_FONT_BOLD` | Nirmala UI or Noto Sans Sinhala | Sinhala-capable TTF for the PDF |

On Linux servers install `fonts-noto` (Noto Sans Sinhala), or drop
`NotoSansSinhala-Regular.ttf` / `-Bold.ttf` into `backend/fonts/`.

## Before release

- Re-check the phone numbers and links in `backend/app/contacts.py` with SLCERT and the Police.
- Put the API behind HTTPS with rate limiting. The cloak endpoint is CPU/GPU heavy.
- Have a lawyer review the takedown wording for Sri Lankan law (e.g. Online Safety Act,
  Computer Crimes Act). The report deliberately cites no laws.
