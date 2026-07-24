import sys
sys.path.insert(0, r"c:\xampp\htdocs\OLfactory_backend")
import os
os.chdir(r"c:\xampp\htdocs\OLfactory_backend")

from ai_model import ai_processor

print(f"AI Model Ready: {ai_processor.ai_ready}")
print(f"Device: {ai_processor.device}")

# Test with an image from the dataset
test_img = r"c:\xampp\htdocs\OLfactory_backend\dataset\21d1ff29-2153-44ae-8cfe-e28635afe216.jpg"
result = ai_processor.analyze_image(test_img)
print(f"\nTest Analysis Result:")
print(f"  Success: {result.get('success')}")
print(f"  Model Version: {result.get('model_version')}")
if result.get('analysis'):
    a = result['analysis']
    print(f"  Depth: {a.get('estimated_depth_cm')} cm")
    print(f"  Keros Type: {a.get('depth_status')}")
    print(f"  Confidence: {a.get('confidence_score')}%")
if result.get('classification'):
    c = result['classification']
    print(f"  Classification: {c.get('result')} ({c.get('confidence')}%)")
print(f"  Processing Time: {result.get('processing_time')} ms")
