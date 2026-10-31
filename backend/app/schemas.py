from __future__ import annotations

from datetime import date
from typing import Literal
from urllib.parse import urlparse

from pydantic import BaseModel, Field, field_validator

from .contacts import PLATFORM_DOMAINS

IncidentType = Literal[
    "deepfake",
    "non_consensual_image_sharing",
    "sextortion",
    "impersonation_fake_profile",
    "harassment_threats",
    "doxxing",
    "hacked_account",
    "other",
]

INCIDENT_LABELS = {
    "deepfake": "AI-generated / manipulated image or video (deepfake)",
    "non_consensual_image_sharing": "Non-consensual sharing of private images",
    "sextortion": "Sextortion / blackmail with images",
    "impersonation_fake_profile": "Impersonation / fake profile",
    "harassment_threats": "Harassment, abuse or threats",
    "doxxing": "Publishing personal information (doxxing)",
    "hacked_account": "Hacked / taken-over account",
    "other": "Other",
}


def platform_for(url: str) -> str:
    host = (urlparse(url).hostname or "").lower()
    for domain, name in PLATFORM_DOMAINS.items():
        if host == domain or host.endswith("." + domain):
            return name
    return host or "Unknown"


class Complainant(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    email: str | None = Field(default=None, max_length=200)
    phone: str | None = Field(default=None, max_length=40)
    nic: str | None = Field(default=None, max_length=20, description="National ID (optional)")
    address: str | None = Field(default=None, max_length=300)
    on_behalf_of: str | None = Field(default=None, max_length=200, description="If reporting for someone else")


class OffendingUrl(BaseModel):
    url: str = Field(max_length=2000)
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("url")
    @classmethod
    def _http(cls, v: str) -> str:
        v = v.strip()
        if not v.lower().startswith(("http://", "https://")):
            v = "https://" + v
        if not urlparse(v).hostname:
            raise ValueError("not a valid URL")
        return v


class Incident(BaseModel):
    complainant: Complainant
    incident_type: IncidentType
    date_first_seen: date | None = None
    description: str = Field(min_length=1, max_length=6000)
    perpetrator: str | None = Field(default=None, max_length=1000, description="Known accounts / names, if any")
    urls: list[OffendingUrl] = Field(default_factory=list, max_length=50)
    requested_actions: list[str] = Field(
        default_factory=lambda: [
            "Remove / disable access to the listed content",
            "Preserve account and content records for law-enforcement requests",
            "Prevent re-upload of matching images (hash matching)",
        ],
        max_length=10,
    )
