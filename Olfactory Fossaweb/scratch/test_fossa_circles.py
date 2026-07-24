import sys
import cv2
sys.path.insert(0, r'c:\programs\Olfactory Fossaweb')
import importlib
import ai.landmark
import ai.measurement
importlib.reload(ai.landmark)
importlib.reload(ai.measurement)
from ai.landmark import detect_landmarks
from ai.preprocess import preprocess_image
from ai.segmentation import segment_olfactory_region
from ai.measurement import calculate_depths_and_annotate

img_path = r'c:\programs\Olfactory Fossaweb\uploads\orig_3521667d-5ac8-4b60-9849-9c511ca8a13f.png'
out_path = r'C:\Users\sivar\.gemini\antigravity-ide\brain\31a5626b-037b-4b9a-98c8-3bc0ff99a281\fossa_test.png'

preprocessed = preprocess_image(img_path)
segmented = segment_olfactory_region(preprocessed)
landmarks = detect_landmarks(preprocessed, segmented)
left_mm, right_mm, avg_mm, annotated = calculate_depths_and_annotate(img_path, landmarks)
cv2.imwrite(out_path, annotated)
print(f"Landmarks: {landmarks}")
print(f"L={left_mm}mm R={right_mm}mm Avg={avg_mm}mm")
print(f"Saved to {out_path}")
