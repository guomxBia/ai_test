import torch
import matplotlib.pyplot as plt
from utils import load_image_and_mask, colorize_mask, image_mask_to_tensors
from train import build_model, NUM_CLASSES, DEVICE

def main():
    image_np, mask_np = load_image_and_mask()
    img_t, _ = image_mask_to_tensors(image_np, mask_np)
    img_t = img_t.unsqueeze(0).to(DEVICE)

    model = build_model(NUM_CLASSES).to(DEVICE)
    model.load_state_dict(torch.load("model_weights.pth", map_location=DEVICE))
    model.eval()

    with torch.no_grad():
        out = model(img_t)["out"]
        pred = torch.argmax(out.squeeze(0), dim=0).cpu().numpy()

    pred_color = colorize_mask(pred, NUM_CLASSES)
    gt_color = colorize_mask(mask_np, NUM_CLASSES)

    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    for ax, img, title in zip(axes, [image_np, gt_color, pred_color],
                               ["Original Image", "Ground Truth Mask", "Predicted Classification"]):
        ax.imshow(img)
        ax.set_title(title)
        ax.axis("off")
    plt.tight_layout()
    plt.savefig("classification_result.png")
    plt.show()
    print("Saved classification_result.png")

if __name__ == "__main__":
    main()