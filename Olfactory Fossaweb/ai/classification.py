def classify_keros(avg_depth):
    """
    Classify olfactory fossa depth into Keros Type I, II, or III.
    Keros I: 1 - 3 mm
    Keros II: 4 - 7 mm
    Keros III: 8 - 16 mm
    """
    # Calculate a simulated confidence score based on how close the depth is to boundaries
    confidence = 0.95
    
    if avg_depth <= 3.0:
        k_type = "Keros Type I"
        # Closer to boundary means slightly lower confidence, otherwise very high
        confidence = 0.98 - abs(3.0 - avg_depth) * 0.05
    elif avg_depth <= 7.0:
        k_type = "Keros Type II"
        confidence = 0.97 - min(abs(4.0 - avg_depth), abs(7.0 - avg_depth)) * 0.05
    else:
        k_type = "Keros Type III"
        confidence = 0.99 - min(abs(8.0 - avg_depth), 1.0) * 0.05
        
    # Clamp confidence
    confidence = max(0.85, min(0.99, confidence))
    
    return k_type, round(confidence * 100, 1)
