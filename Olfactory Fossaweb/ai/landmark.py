import numpy as np

def detect_landmarks(preprocessed_img, segmented_img):
    """
    Detect landmark coordinates for Left/Right Fovea Ethmoidalis (roof)
    and Left/Right Cribriform Plate (floor) of the olfactory fossa.

    Anatomy reference (coronal CT view):
      - The olfactory fossae are the two depressions on either side of the
        crista galli, at the very top of the nasal cavity (roof of the nose).
      - Fovea Ethmoidalis (FE): The lateral roof bone forming the top edge.
      - Cribriform Plate (CP): The thin floor bone of each fossa.
      - The depth is the vertical distance from FE (top) to CP (bottom).

    Returns a dictionary of point coordinates: {landmark_name: (x, y)}
    """
    h, w = preprocessed_img.shape
    center_x = w // 2

    # --- Step 1: Find the crista galli (bright vertical bone at midline) ---
    # The crista galli is a vertical bone spike at the center, and the
    # olfactory fossae are immediately on either side of it.
    # Search for the top of the crista galli bone (first bright peak at center)
    crista_y = None
    for y in range(int(h * 0.28), int(h * 0.45)):
        val = preprocessed_img[y, center_x]
        if val > 90:
            crista_y = y
            break
    if crista_y is None:
        crista_y = int(h * 0.33)  # fallback

    # --- Step 2: Position the fossa markers symmetrically around the crista ---
    # Each fossa is a small depression just lateral to the crista galli,
    # at the top of the nose between the orbits.
    # FE (roof) sits at the same Y-level as the top of the crista galli.
    # CP (floor) sits slightly below.
    fossa_offset = int(w * 0.05)  # ~25px lateral offset from center

    left_x_fe = center_x - fossa_offset
    right_x_fe = center_x + fossa_offset
    left_x_cp = center_x - fossa_offset
    right_x_cp = center_x + fossa_offset

    # FE Y: search for the bone peak (roof) in each fossa column
    y_search_min = max(crista_y - 10, int(h * 0.28))
    y_search_max = min(crista_y + 25, int(h * 0.42))

    def find_bone_peak(x_col, start_y, end_y):
        """Find the Y coordinate of the brightest bone pixel in a column."""
        col_vals = preprocessed_img[start_y:end_y, x_col].astype(np.float64)
        if len(col_vals) == 0:
            return start_y + (end_y - start_y) // 2
        peak_idx = np.argmax(col_vals)
        peak_val = col_vals[peak_idx]
        median_val = np.median(col_vals)
        if peak_val > median_val + 15:
            return start_y + int(peak_idx)
        return start_y + (end_y - start_y) // 2

    left_y_fe = find_bone_peak(left_x_fe, y_search_min, y_search_max)
    right_y_fe = find_bone_peak(right_x_fe, y_search_min, y_search_max)

    # CP Y: search below FE for the next bone peak (floor of fossa)
    cp_search_start_left = min(left_y_fe + 5, y_search_max - 5)
    cp_search_start_right = min(right_y_fe + 5, y_search_max - 5)
    cp_y_max = min(crista_y + 40, int(h * 0.45))

    left_y_cp = find_bone_peak(left_x_cp, cp_search_start_left, cp_y_max)
    right_y_cp = find_bone_peak(right_x_cp, cp_search_start_right, cp_y_max)

    # Safety: ensure CP is always at or below FE level
    if left_y_cp < left_y_fe:
        left_y_cp = left_y_fe + 10
    if right_y_cp < right_y_fe:
        right_y_cp = right_y_fe + 10

    return {
        "left_fe": (left_x_fe, left_y_fe),
        "left_cp": (left_x_cp, left_y_cp),
        "right_fe": (right_x_fe, right_y_fe),
        "right_cp": (right_x_cp, right_y_cp)
    }
