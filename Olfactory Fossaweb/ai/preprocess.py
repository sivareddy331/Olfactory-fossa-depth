import cv2
import numpy as np

def preprocess_image(image_path, target_size=(512, 512)):
    """
    Read, resize, denoise, and enhance contrast of the input medical image.
    """
    # Read as grayscale
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError("Could not read image file.")
    
    # Resize
    resized = cv2.resize(img, target_size, interpolation=cv2.INTER_AREA)
    
    # Noise reduction using Gaussian Blur
    denoised = cv2.GaussianBlur(resized, (5, 5), 0)
    
    # Contrast enhancement using CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)
    
    return enhanced
