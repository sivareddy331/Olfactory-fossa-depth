import cv2
import numpy as np
import sys
sys.path.insert(0, r'c:\programs\Olfactory Fossaweb')
from ai.preprocess import preprocess_image

# Load and preprocess
img_path = r'c:\programs\Olfactory Fossaweb\uploads\orig_3521667d-5ac8-4b60-9849-9c511ca8a13f.png'
preprocessed = preprocess_image(img_path)
h, w = preprocessed.shape
center_x = w // 2
print(f"Image size: {w}x{h}, center_x={center_x}")

# The olfactory fossa region: look at rows around 30-38% height
# and columns from 40-60% width (between the orbits, around the nose top)
for y_pct in [0.30, 0.32, 0.34, 0.36, 0.38]:
    y = int(h * y_pct)
    row = preprocessed[y, :]
    # Print intensities around the center
    vals = [(x, int(row[x])) for x in range(int(w*0.35), int(w*0.65), 5)]
    print(f"\nY={y} ({y_pct*100:.0f}%):")
    for x, v in vals:
        marker = " <-- BRIGHT" if v > 120 else ""
        print(f"  X={x}: {v}{marker}")

# Find the crista galli (bright vertical bone at center)
print("\n\n--- Crista Galli Detection (center column intensities) ---")
for y in range(int(h*0.28), int(h*0.42)):
    val = preprocessed[y, center_x]
    marker = " <-- BONE" if val > 100 else ""
    print(f"Y={y}: intensity={val}{marker}")
