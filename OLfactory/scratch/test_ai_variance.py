import os
import sys

# Add backend to path
backend_dir = r"c:\xampp\htdocs\OLfactory_backend"
sys.path.append(backend_dir)

from ai_model import ai_processor
import cv2
import numpy as np

def test_prediction(name, img_path):
    print(f"\nTesting: {name}")
    result = ai_processor.analyze_image(img_path)
    if result["success"]:
        analysis = result["analysis"]
        print(f"  Depth: {analysis['estimated_depth_cm']*10} mm")
        print(f"  Type: {analysis['depth_status']}")
        print(f"  Confidence: {analysis['confidence_score']}%")
        print(f"  Model: {result['model_version']}")
    else:
        print(f"  Error: {result['error']}")

# Create two dummy images
img1_path = os.path.join(backend_dir, "test_noise1.png")
img2_path = os.path.join(backend_dir, "test_noise2.png")

# Noise image 1
noise1 = np.random.randint(0, 255, (224, 224), dtype=np.uint8)
cv2.imwrite(img1_path, noise1)

# Noise image 2 (different seed)
noise2 = np.random.randint(0, 100, (224, 224), dtype=np.uint8)
cv2.imwrite(img2_path, noise2)

test_prediction("Noise 1", img1_path)
test_prediction("Noise 2", img2_path)

# Clean up
os.remove(img1_path)
os.remove(img2_path)
