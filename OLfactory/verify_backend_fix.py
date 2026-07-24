
import sys
import os

# Add backend dir to sys.path
sys.path.append(r'c:\xampp\htdocs\OLfactory_backend')

try:
    from schemas import ImageAnalysisResponse
    from analysis import router
    from ai_model import ai_processor
    print("Successfully imported backend components.")
    
    # Test a mock result
    mock_result = {
        "success": True,
        "analysis": [{
            "fossa_detected": True,
            "estimated_depth_cm": 0.5,
            "depth_status": "Type 1",
            "confidence_score": 80.0,
            "image_quality_score": 85.0
        }],
        "classification": [{
            "result": "Type 1",
            "confidence": 80.0
        }],
        "processing_time": 123.45,
        "model_version": "test"
    }
    
    # Simulate the logic in analyze_image
    analysis = mock_result.get('analysis')
    classification = mock_result.get('classification')
    
    if isinstance(analysis, list) and len(analysis) > 0:
        analysis = analysis[0]
    if isinstance(classification, list) and len(classification) > 0:
        classification = classification[0]
        
    response = ImageAnalysisResponse(
        success=True,
        analysis=analysis,
        classification=classification,
        processing_time=float(mock_result.get('processing_time', 0.0)),
        model_version=str(mock_result.get('model_version', 'Unknown'))
    )
    print("Schema validation successful with list-to-dict conversion.")
    
except Exception as e:
    print(f"Error during verification: {e}")
    import traceback
    traceback.print_exc()
