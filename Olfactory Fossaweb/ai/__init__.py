import os
import cv2
from .preprocess import preprocess_image
from .segmentation import segment_olfactory_region
from .landmark import detect_landmarks
from .measurement import calculate_depths_and_annotate
from .classification import classify_keros
from .risk import assess_surgical_risk

def run_analysis_pipeline(input_image_path, output_annotated_path):
    """
    Executes the complete Olfactory Fossa Depth Analysis Pipeline:
    1. Preprocesses the image (contrast enhancement, resizing, noise removal).
    2. Segments the olfactory fossa region.
    3. Detects anatomical landmarks.
    4. Computes measurements and saves annotated image.
    5. Classifies using Keros types.
    6. Generates risk assessment.
    
    Returns:
        dict: Analysis results containing left_depth, right_depth, average_depth,
              keros_type, risk_level, risk_explanation, confidence_score.
    """
    # 1. Preprocess
    preprocessed = preprocess_image(input_image_path)
    
    # 2. Segment
    segmented = segment_olfactory_region(preprocessed)
    
    # 3. Detect landmarks
    landmarks = detect_landmarks(preprocessed, segmented)
    
    # 4. Measure and annotate
    left_depth, right_depth, avg_depth, annotated_img = calculate_depths_and_annotate(input_image_path, landmarks)
    
    # Save processed image to target path
    cv2.imwrite(output_annotated_path, annotated_img)
    
    # 5. Classify Keros
    keros_type, confidence = classify_keros(avg_depth)
    
    # 6. Surgical Risk Assessment
    risk_level, explanation = assess_surgical_risk(keros_type, avg_depth)
    
    return {
        "left_depth": left_depth,
        "right_depth": right_depth,
        "average_depth": avg_depth,
        "keros_type": keros_type,
        "risk_level": risk_level,
        "risk_explanation": explanation,
        "confidence_score": confidence
    }
