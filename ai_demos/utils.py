import numpy as np
from PIL import Image
import torch

CLASS_COLORS = {
    0: (34, 139, 34),    # Crop Field Left
    1: (154, 205, 50),   # Green Field
    2: (128, 128, 128),  # Road
    3: (85, 107, 47),    # Crop Field Right
}

def load_classes(path="data/classes.txt"):
    classes = {}
    with open(path, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            sep = "=" if "=" in line else ":"
            idx, name = line.split(sep)
            classes[int(idx.strip())] = name.strip()
    return classes

def load_image_and_mask(image_path="data/four_classes.jpg", mask_path="data/semantic_mask.png"):
    image = Image.open(image_path).convert("RGB")
    mask = Image.open(mask_path).convert("L")
    return np.array(image), np.array(mask)

def colorize_mask(mask_np, num_classes=4):
    h, w = mask_np.shape
    color_mask = np.zeros((h, w, 3), dtype=np.uint8)
    for class_id, color in CLASS_COLORS.items():
        color_mask[mask_np == class_id] = color
    return color_mask

def image_mask_to_tensors(image_np, mask_np):
    image_t = torch.from_numpy(image_np).permute(2, 0, 1).float() / 255.0
    mask_t = torch.from_numpy(mask_np).long()
    return image_t, mask_t

def extract_patches(image_np, mask_np, patch_size=128, stride=64):
    h, w = mask_np.shape
    image_patches, mask_patches = [], []
    for y in range(0, h - patch_size + 1, stride):
        for x in range(0, w - patch_size + 1, stride):
            image_patches.append(image_np[y:y+patch_size, x:x+patch_size])
            mask_patches.append(mask_np[y:y+patch_size, x:x+patch_size])
    return image_patches, mask_patches