"""Runtime settings, read from environment variables."""
import os


def _csv(name: str, default: str) -> list[str]:
    return [v.strip() for v in os.getenv(name, default).split(",") if v.strip()]


# Which surrogate models the cloaking engine attacks.
# "auto" = every model whose packages/weights are available.
SURROGATES = _csv("AEGIS_SURROGATES", "auto")

# Set to 1 in tests/CI to use randomly initialised weights (no downloads).
OFFLINE_TEST = os.getenv("AEGIS_OFFLINE_TEST", "0") == "1"

CORS_ORIGINS = _csv("AEGIS_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")

MAX_IMAGE_BYTES = int(os.getenv("AEGIS_MAX_IMAGE_MB", "20")) * 1024 * 1024
MAX_EVIDENCE_FILES = int(os.getenv("AEGIS_MAX_EVIDENCE_FILES", "25"))
MAX_TOTAL_UPLOAD_BYTES = int(os.getenv("AEGIS_MAX_TOTAL_MB", "120")) * 1024 * 1024

# Only this many cloaking jobs run at once (they are CPU/GPU heavy).
MAX_CONCURRENT_CLOAKS = int(os.getenv("AEGIS_MAX_CONCURRENT_CLOAKS", "2"))

TORCH_THREADS = int(os.getenv("AEGIS_TORCH_THREADS", "0"))  # 0 = torch default
