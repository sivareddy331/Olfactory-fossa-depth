import os
import csv
import shutil
import random

# Directories
BACKEND_DIR = r"c:\xampp\htdocs\OLfactory_backend"
UPLOADS_DIR = os.path.join(BACKEND_DIR, "uploads")
DATASET_DIR = os.path.join(BACKEND_DIR, "dataset")

if not os.path.exists(DATASET_DIR):
    os.makedirs(DATASET_DIR)

# Get images from uploads
images = [f for f in os.listdir(UPLOADS_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]

if not images:
    print("No images found in uploads to create dummy dataset.")
else:
    data = []
    sample_images = random.sample(images, min(len(images), 12))

    for img_name in sample_images:
        src = os.path.join(UPLOADS_DIR, img_name)
        dst = os.path.join(DATASET_DIR, img_name)
        shutil.copy(src, dst)

        depth_mm = round(random.uniform(2.0, 15.0), 2)
        if depth_mm <= 3.0:
            keros_type = 1
        elif depth_mm <= 7.0:
            keros_type = 2
        else:
            keros_type = 3

        data.append([img_name, depth_mm, keros_type])

    csv_path = os.path.join(BACKEND_DIR, "data.csv")
    with open(csv_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['image_path', 'depth_mm', 'keros_type'])
        writer.writerows(data)

    print(f"Created {csv_path} with {len(data)} entries.")
    print(f"Copied images to {DATASET_DIR}")
    for row in data:
        print(f"  {row[0]}  depth={row[1]}mm  keros={row[2]}")
