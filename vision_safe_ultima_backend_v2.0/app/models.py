"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class DetectionModel(BaseModel):
    """Single detection result"""
    label: str = Field(..., description="Class name of detected object")
    confidence: float = Field(..., ge=0, le=1, description="Detection confidence score")
    bbox: tuple = Field(..., description="Bounding box [x1, y1, x2, y2]")
    
    class Config:
        json_schema_extra = {
            "example": {
                "label": "person_walking",
                "confidence": 0.95,
                "bbox": [10, 20, 100, 200]
            }
        }


class DetectionsResponse(BaseModel):
    """Detection results for a single category"""
    detections: List[DetectionModel] = Field(default_factory=list)


class RiskModel(BaseModel):
    """Risk assessment result"""
    level: str = Field(..., description="Risk level: LOW, HIGH, or CRITICAL")
    score: float = Field(..., ge=0, le=1, description="Risk score from 0 to 1")
    factors: List[str] = Field(default_factory=list, description="Factors contributing to risk")


class InferenceResponse(BaseModel):
    """Complete inference response"""
    safe: DetectionsResponse = Field(..., description="Safe activity detections")
    unsafe: DetectionsResponse = Field(..., description="Unsafe object detections")
    risk: RiskModel = Field(..., description="Overall risk assessment")
    inference_time_ms: float = Field(..., ge=0, description="Inference time in milliseconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "safe": {
                    "detections": [
                        {
                            "label": "person_walking",
                            "confidence": 0.95,
                            "bbox": [10, 20, 100, 200]
                        }
                    ]
                },
                "unsafe": {
                    "detections": [
                        {
                            "label": "fire",
                            "confidence": 0.87,
                            "bbox": [150, 100, 300, 250]
                        }
                    ]
                },
                "risk": {
                    "level": "CRITICAL",
                    "score": 1.0,
                    "factors": ["🔥 Fire Detected"]
                },
                "inference_time_ms": 45.3
            }
        }


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service status")
    version: str = Field(..., description="API version")
    ml_service_ready: bool = Field(..., description="Whether ML service is initialized")
    device: str = Field(..., description="ML device being used")
    db_status: Optional[str] = Field("unknown", description="Status of the database connection (e.g., 'ok', 'disconnected')")
    db_error: Optional[str] = Field(None, description="Error message if database connection is not 'ok'")
