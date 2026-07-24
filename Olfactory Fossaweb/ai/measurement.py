import cv2
import numpy as np

def calculate_depths_and_annotate(original_img_path, landmarks, pixel_to_mm_ratio=0.08):
    """
    Measure left and right depths based on landmarks and output the annotated image.
    Draws circles around the olfactory fossa regions and measurement lines.
    pixel_to_mm_ratio: calibration factor to convert pixels to mm.
    """
    # Load original image in color for annotations
    img_color = cv2.imread(original_img_path)
    if img_color is None:
        raise ValueError("Could not read original image for annotation.")
    
    h, w, _ = img_color.shape
    # If the original image is not 512x512, resize it to match the landmarks coordinate system
    if (h, w) != (512, 512):
        img_color = cv2.resize(img_color, (512, 512))
        
    left_fe = landmarks["left_fe"]
    left_cp = landmarks["left_cp"]
    right_fe = landmarks["right_fe"]
    right_cp = landmarks["right_cp"]
    
    # Depths in pixels (vertical difference between Fovea Ethmoidalis and Cribriform Plate)
    left_pixel_depth = abs(left_cp[1] - left_fe[1])
    right_pixel_depth = abs(right_cp[1] - right_fe[1])
    
    # Convert to mm
    left_mm = round(left_pixel_depth * pixel_to_mm_ratio, 2)
    right_mm = round(right_pixel_depth * pixel_to_mm_ratio, 2)
    avg_mm = round((left_mm + right_mm) / 2.0, 2)
    
    # DRAWING ANNOTATIONS
    # Colors (B, G, R)
    color_circle = (0, 255, 255)    # Yellow for fossa circles
    color_fe = (0, 0, 255)          # Red for roof (FE)
    color_cp = (0, 255, 0)          # Green for floor (CP)
    color_line = (255, 255, 0)      # Cyan for measurement vertical line
    
    # --- Draw circles around each olfactory fossa region ---
    # The fossa center is midway between FE and CP vertically, at their X position
    left_fossa_center_x = left_fe[0]
    left_fossa_center_y = (left_fe[1] + left_cp[1]) // 2
    right_fossa_center_x = right_fe[0]
    right_fossa_center_y = (right_fe[1] + right_cp[1]) // 2
    
    # Circle radius based on depth (min 12px so it's always visible)
    left_radius = max(left_pixel_depth + 8, 12)
    right_radius = max(right_pixel_depth + 8, 12)
    
    # Draw the fossa circles (unfilled, thick border)
    cv2.circle(img_color, (left_fossa_center_x, left_fossa_center_y), left_radius, color_circle, 2)
    cv2.circle(img_color, (right_fossa_center_x, right_fossa_center_y), right_radius, color_circle, 2)
    
    # Draw landmark points (smaller dots inside the circles)
    cv2.circle(img_color, left_fe, 4, color_fe, -1)
    cv2.circle(img_color, left_cp, 4, color_cp, -1)
    cv2.circle(img_color, right_fe, 4, color_fe, -1)
    cv2.circle(img_color, right_cp, 4, color_cp, -1)
    
    # Draw horizontal reference lines for FE (roof)
    cv2.line(img_color, (left_fe[0] - 15, left_fe[1]), (left_fe[0] + 15, left_fe[1]), color_fe, 2)
    cv2.line(img_color, (right_fe[0] - 15, right_fe[1]), (right_fe[0] + 15, right_fe[1]), color_fe, 2)
    
    # Draw horizontal reference lines for CP (floor)
    cv2.line(img_color, (left_cp[0] - 15, left_cp[1]), (left_cp[0] + 15, left_cp[1]), color_cp, 2)
    cv2.line(img_color, (right_cp[0] - 15, right_cp[1]), (right_cp[0] + 15, right_cp[1]), color_cp, 2)
    
    # Draw vertical measurement lines
    cv2.line(img_color, (left_cp[0], left_fe[1]), left_cp, color_line, 2, cv2.LINE_AA)
    cv2.line(img_color, (right_cp[0], right_fe[1]), right_cp, color_line, 2, cv2.LINE_AA)
    
    # Add measurement text overlays
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(img_color, f"L: {left_mm} mm", (left_fe[0] - 50, left_fe[1] - 20), font, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
    cv2.putText(img_color, f"R: {right_mm} mm", (right_fe[0] - 10, right_fe[1] - 20), font, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
    
    return left_mm, right_mm, avg_mm, img_color
