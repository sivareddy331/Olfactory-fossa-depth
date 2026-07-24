import cv2
import numpy as np

def segment_olfactory_region(preprocessed_img):
    """
    Segment the olfactory fossa bone and cavity boundaries using adaptive thresholding
    and morphological operations to isolate the region of interest.
    """
    # Use thresholding to find bone structures (high intensity in CT/X-Ray)
    _, bone_mask = cv2.threshold(preprocessed_img, 200, 255, cv2.THRESH_BINARY)
    
    # Adaptive thresholding for tissue boundaries
    adaptive_mask = cv2.adaptiveThreshold(
        preprocessed_img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY_INV, 11, 2
    )
    
    # Combine or isolate olfactory region (typically near the top-middle third of the scan)
    h, w = preprocessed_img.shape
    roi_mask = np.zeros_like(preprocessed_img)
    # Define bounding box for olfactory fossa (middle horizontal, upper-middle vertical)
    roi_mask[int(h*0.25):int(h*0.65), int(w*0.25):int(w*0.75)] = 255
    
    segmented = cv2.bitwise_and(adaptive_mask, roi_mask)
    
    # Morphological closing to clean up small holes
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    segmented = cv2.morphologyEx(segmented, cv2.MORPH_CLOSE, kernel)
    
    return segmented
