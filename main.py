from enum import Enum
from typing import List

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Construction Intelligence API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


# ---------- Data contract (what the real AI layer must return) ----------

class Severity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Violation(BaseModel):
    type: str = Field(..., description="e.g. missing_hardhat, no_harness, unsafe_scaffolding")
    description: str
    severity: Severity
    confidence: float = Field(..., ge=0, le=1)
    location: str = Field(..., description="Where in the image, e.g. 'left foreground'")


class SafetyAnalysis(BaseModel):
    filename: str
    summary: str
    overall_risk: Severity
    compliance_score: int = Field(..., ge=0, le=100)
    workers_detected: int = Field(..., ge=0)
    violations: List[Violation]
    compliant_items: List[str]
    recommendations: List[str]


# ---------- Endpoints ----------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze-safety", response_model=SafetyAnalysis)
async def analyze_safety(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(415, "Upload a JPEG, PNG or WebP image.")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(400, "The uploaded file is empty.")
    if len(image_bytes) > MAX_BYTES:
        raise HTTPException(413, "Image is larger than 10 MB.")

    # TODO: replace this mock with a multimodal LLM call using `image_bytes`
    # and parse its JSON output into SafetyAnalysis.
    return SafetyAnalysis(
        filename=file.filename or "upload",
        summary="Three workers on an active scaffold. One is missing a hardhat and the "
                "upper platform has no guardrail.",
        overall_risk=Severity.high,
        compliance_score=62,
        workers_detected=3,
        violations=[
            Violation(
                type="missing_hardhat",
                description="Worker in the foreground is not wearing a hardhat.",
                severity=Severity.high,
                confidence=0.91,
                location="left foreground",
            ),
            Violation(
                type="missing_guardrail",
                description="Top scaffold platform has no guardrail on the open edge.",
                severity=Severity.critical,
                confidence=0.84,
                location="upper right",
            ),
        ],
        compliant_items=["High-visibility vests worn by all workers", "Safety boots visible"],
        recommendations=[
            "Stop work on the upper platform until a guardrail is installed.",
            "Enforce hardhat use in all active zones.",
        ],
    )
