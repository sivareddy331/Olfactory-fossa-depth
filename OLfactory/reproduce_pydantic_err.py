
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AnalysisDepthResult(BaseModel):
    """Depth analysis result"""
    fossa_detected: bool
    x: Optional[int] = None
    y: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    area: Optional[float] = None
    perimeter: Optional[float] = None
    circularity: Optional[float] = None
    estimated_depth_cm: Optional[float] = None
    depth_status: Optional[str] = None
    confidence_score: Optional[float] = None
    image_quality_score: Optional[float] = None

class AnalysisClassification(BaseModel):
    """Classification result"""
    result: str
    confidence: float

class ImageAnalysisResponse(BaseModel):
    """Full image analysis response"""
    model_config = ConfigDict(protected_namespaces=())
    success: bool
    analysis: Optional[AnalysisDepthResult] = None
    classification: Optional[AnalysisClassification] = None
    processing_time: float
    model_version: str
    error: Optional[str] = None

# Test with a dict (should work)
print("Testing with dict...")
try:
    analysis_data = {
        "fossa_detected": True,
        "estimated_depth_cm": 0.5,
        "depth_status": "Type 1",
        "confidence_score": 80.0,
        "image_quality_score": 85.0
    }
    classification_data = {
        "result": "Type 1",
        "confidence": 80.0
    }
    response = ImageAnalysisResponse(
        success=True,
        analysis=analysis_data,
        classification=classification_data,
        processing_time=123.45,
        model_version="test"
    )
    print("Success with dict")
except Exception as e:
    print(f"Error with dict: {e}")

# Test with a list (should fail with the error seen in image)
print("\nTesting with list...")
try:
    analysis_data_list = [{
        "fossa_detected": True,
        "estimated_depth_cm": 0.5,
        "depth_status": "Type 1",
        "confidence_score": 80.0,
        "image_quality_score": 85.0
    }]
    response = ImageAnalysisResponse(
        success=True,
        analysis=analysis_data_list,
        classification=classification_data,
        processing_time=123.45,
        model_version="test"
    )
    print("Success with list (unexpected)")
except Exception as e:
    print(f"Error with list: {e}")
