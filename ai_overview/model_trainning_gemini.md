# Training Strategies for ResNet-50 / DeepLabV3

This document summarizes three approaches for fine-tuning the model, along with their trade-offs in performance, memory, and saved file size.

---

## 1. Full Fine-Tuning

Train **all** layers of the model, including the backbone and the classifier head.

```python
model = deeplabv3_resnet50(pretrained=True)
# All parameters remain trainable by default
```

**Save the full model:**
```python
torch.save(model.state_dict(), "full_model.pth")  # ~160 MB
```

**Load for inference:**
```python
model = deeplabv3_resnet50(pretrained=False)
model.load_state_dict(torch.load("full_model.pth"))
```

**Best for:** Custom imagery that differs significantly from ImageNet (e.g., aerial/satellite, multi-spectral, medical scans).

---

## 2. LoRA (Low-Rank Adaptation)

Freeze the entire base model and inject small trainable adapter matrices into selected layers. Only the adapters are trained and saved.

```python
from peft import LoraConfig, get_peft_model

base_model = deeplabv3_resnet50(pretrained=True)
for param in base_model.parameters():
    param.requires_grad = False

lora_config = LoraConfig(
    r=8,                    # rank of the adapter matrices
    lora_alpha=16,
    target_modules=["conv1", "layer4"],  # example target layers
    lora_dropout=0.1,
)
model = get_peft_model(base_model, lora_config)
```

**Save only the adapter weights:**
```python
model.save_pretrained("lora_adapter")  # ~2–10 MB
```

**Load for inference:**
```python
base_model = deeplabv3_resnet50(pretrained=True)
model = PeftModel.from_pretrained(base_model, "lora_adapter")
```

**Best for:** Storage-constrained deployment, multiple task-specific adapters sharing one frozen base model, rapid experimentation.

---

## 3. Freeze the Backbone (Head-Only Training)

Freeze the ResNet-50 backbone and train only the classifier head. Reduces training memory; final file size only shrinks if you deliberately save just the head.

```python
model = deeplabv3_resnet50(pretrained=True)
for param in model.backbone.parameters():
    param.requires_grad = False
# model.classifier remains trainable
```

**Save only the classifier head:**
```python
torch.save(model.classifier.state_dict(), "classifier_only.pth")  # ~5–10 MB
```

**Load for inference:**
```python
model = deeplabv3_resnet50(pretrained=True)  # load base first
model.classifier.load_state_dict(torch.load("classifier_only.pth"))
```

> ⚠️ Note: If you call `torch.save(model.state_dict(), ...)` without isolating the classifier, it still writes the full ~160 MB, since `state_dict()` includes frozen (non-trainable) parameters too. Freezing affects *what gets gradients*, not *what gets saved* — you must explicitly save a sub-module to shrink the file.

**Best for:** Target objects visually similar to ImageNet classes (e.g., common pets, everyday road objects); fast iteration with limited GPU memory.

---

## Comparison Table

| Feature / Aspect | Full Fine-Tuning | LoRA | Freeze Backbone |
|---|---|---|---|
| **Feature Adaptation** | High — low-level features (edges, textures, spectral patterns) adapt to target domain | Moderate — small adapters let the model shift behavior without touching frozen weights | None — backbone stays rigid, using generic ImageNet features |
| **Domain Shift Fitness** | Superior for custom imagery (aerial, satellite, multi-spectral, medical) | Good middle ground — can adapt meaningfully with far fewer parameters | Moderate — best when target data resembles ImageNet photos |
| **GPU VRAM Usage** | Highest — activations & gradients stored for all 50 layers | Low — gradients only for small adapter matrices | Low (50–70% lower) — gradients only for classifier head |
| **Training Speed** | Slowest per epoch | Fast | Fastest per epoch |
| **Risk of Overfitting** | Higher on small datasets (many trainable params) | Low — very few trainable params | Low — only a few thousand trainable params |
| **Saved Model File Size** | ~160 MB | ~2–10 MB (adapter only) | ~5–10 MB (if saving classifier only; full state_dict still ~160 MB) |
| **Inference Setup** | Load single file directly | Load base model + apply adapter | Load base model + load head weights into `model.classifier` |
| **Best Use Case** | Large domain gap, sufficient data/compute | Multiple lightweight task variants, storage-constrained deployment | Quick iteration, target domain close to ImageNet, limited GPU memory |

---

## Quick Decision Guide

- **Data very different from ImageNet + have compute →** Full Fine-Tuning
- **Need tiny, swappable, storage-efficient weights →** LoRA
- **Data similar to ImageNet + want fast/cheap training →** Freeze Backbone (head-only)