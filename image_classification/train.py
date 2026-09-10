import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import models
from torch.utils.data import Dataset, DataLoader
from utils import load_image_and_mask, extract_patches, image_mask_to_tensors

NUM_CLASSES = 4
PATCH_SIZE = 128
STRIDE = 64
EPOCHS = 30
LR = 1e-4
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

class PatchDataset(Dataset):
    def __init__(self, image_patches, mask_patches):
        self.image_patches = image_patches
        self.mask_patches = mask_patches

    def __len__(self):
        return len(self.image_patches)

    def __getitem__(self, idx):
        return image_mask_to_tensors(self.image_patches[idx], self.mask_patches[idx])

def build_model(num_classes=NUM_CLASSES):
    model = models.segmentation.deeplabv3_resnet50(weights="DEFAULT")
    model.classifier[4] = nn.Conv2d(256, num_classes, kernel_size=1)
    if model.aux_classifier is not None:
        model.aux_classifier[4] = nn.Conv2d(256, num_classes, kernel_size=1)
    return model

def main():
    image_np, mask_np = load_image_and_mask()
    image_patches, mask_patches = extract_patches(image_np, mask_np, PATCH_SIZE, STRIDE)
    print(f"Extracted {len(image_patches)} patches")

    loader = DataLoader(PatchDataset(image_patches, mask_patches), batch_size=4, shuffle=True)

    model = build_model().to(DEVICE)
    model.train()
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LR)

    for epoch in range(EPOCHS):
        total_loss = 0.0
        for imgs, masks in loader:
            imgs, masks = imgs.to(DEVICE), masks.to(DEVICE)
            optimizer.zero_grad()
            out = model(imgs)["out"]
            loss = criterion(out, masks)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        print(f"Epoch {epoch+1}/{EPOCHS} - loss: {total_loss/len(loader):.4f}")

    torch.save(model.state_dict(), "model_weights.pth")
    print("Saved model_weights.pth")

if __name__ == "__main__":
    main()