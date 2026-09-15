# Deep Learning Model Fine-Tuning Strategies

A practical guide comparing three distinct fine-tuning paradigms for deep vision backbones (e.g., ResNet-50 / DeepLabV3): **Full Fine-Tuning**, **LoRA (Low-Rank Adaptation)**, and **Backbone Freezing (Head-Only Training)**.

---

## Overview of Strategies

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Training Strategies                           │
├─────────────────────────┬──────────────────────────┬───────────────────┤
│ 1. Full Fine-Tuning     │ 2. LoRA Adaptation       │ 3. Freeze Backbone│
│ (All Layers Trainable)  │ (Frozen Base + Adapters) │ (Head-Only Tuning)│
│                         │                          │                   │
│  [ Backbone ] (Train)   │  [ Backbone ] (Frozen)   │ [Backbone](Frozen)│
│       ↓                 │     + [ΔW LoRA] (Train)  │       ↓           │
│  [Classifier] (Train)   │  [Classifier] (Train)    │ [Classifier](Train│
│                         │                          │                   │
│ Weight Checkpoint:      │ Weight Checkpoint:       │ Weight Checkpoint:│
│ ~160 MB (full model)    │ ~2–10 MB (adapter delta) │ ~5–10 MB (head)   │
└─────────────────────────┴──────────────────────────┴───────────────────┘
```

---

## 1. Full Fine-Tuning (End-to-End)

In full fine-tuning, every parameter in the network — both the feature extraction backbone and the classification head — remains trainable. Gradients and optimizer states are maintained across the entire network architecture.

### Key Characteristics

- **Adaptability**: High. Low-level convolutional filters (edges, textures, spatial features) and high-level semantic representations both adapt to target data.
- **Domain Fit**: Essential when working with target data that differs drastically from standard ImageNet distributions (e.g., satellite/aerial imagery, medical CT/MRI scans, multispectral data).
- **Storage Footprint**: Full model checkpoint must be stored (e.g., ~160 MB for ResNet-50 / DeepLabV3).

### Trade-offs

- ✅ **Pros**: Highest theoretical upper bound on accuracy for out-of-domain datasets.
- ❌ **Cons**: High GPU memory consumption; slower training throughput; prone to overfitting on small datasets; requires storing large artifacts per checkpoint.

---

## 2. Low-Rank Adaptation (LoRA)

LoRA freezes pre-trained backbone weights and injects trainable rank-decomposition matrices into targeted layers (e.g., attention projections or convolution kernels). Only these auxiliary matrices are optimized during training.

### Key Characteristics

- **Adaptability**: Strong adaptation across deep intermediate layers without modifying base weights.
- **Domain Fit**: Robust for fine-tuning on specialized datasets while preserving pre-trained representations.
- **Storage Footprint**: Minimal delta weight checkpoints (~2 MB to 10 MB).

### Core Formula

```
W = W₀ + ΔW = W₀ + B·A,  where A ∈ ℝ^(r×k), B ∈ ℝ^(d×r), r ≪ min(d, k)
```

### Workflow Example (Hugging Face PEFT / Custom)

```python
from peft import LoraConfig, get_peft_model

# 1. Define LoRA configuration
config = LoraConfig(
    r=8,
    lora_alpha=16,
    target_modules=["conv2", "fc"],
    lora_dropout=0.05,
    bias="none",
)

# 2. Wrap existing base model
lora_model = get_peft_model(base_model, config)

# 3. Save only adapter weights (~5 MB)
lora_model.save_pretrained("./lora_adapters")
```

---

## 3. Backbone Freezing (Head-Only Training)

The feature extraction backbone is locked (`requires_grad = False`). Gradients are computed and backpropagated strictly through the task-specific classification head.

### Key Characteristics

- **Adaptability**: None for feature extraction; representations remain fixed to pre-trained weights.
- **Domain Fit**: Ideal when downstream images visually align with pre-training distributions (e.g., natural photography, common objects, vehicle datasets).
- **Memory & Speed**: Up to 50–70% reduction in training VRAM since intermediate activations do not need backward caching.

### Workflow Example (PyTorch)

```python
import torch

# 1. Freeze backbone parameters
for param in model.backbone.parameters():
    param.requires_grad = False

# 2. Train only classifier head
# ... standard training loop ...

# 3. Save ONLY classifier state dictionary (~5-10 MB)
torch.save(model.classifier.state_dict(), "classifier_only.pth")
```

### Loading for Inference

```python
# Initialize base architecture
model = load_base_model()  # 160 MB base weights

# Load custom trained head
model.classifier.load_state_dict(torch.load("classifier_only.pth"))
model.eval()
```

---

## Strategy Comparison Matrix

| Feature / Metric | Full Fine-Tuning | Backbone Freezing | LoRA Adaptation |
|---|---|---|---|
| **Feature Extraction Adaptation** | High (all layers learn domain features) | None (frozen to pre-trained weights) | Medium–High (adapts low-rank deltas) |
| **Domain Shift Resilience** | Superior (ideal for aerial, medical, IR) | Moderate (relies on pre-trained distribution) | High (adapts features with minimal drift) |
| **GPU VRAM Consumption** | High (gradients & states for all layers) | Very Low (50–70% reduction) | Low (modest gradient memory overhead) |
| **Training Speed** | Baseline / Slower | Significantly Faster | Fast (comparable to head-only) |
| **Overfitting Risk** | High on small sample sizes | Minimal (few trainable parameters) | Low (constrained rank parameterization) |
| **Saved Artifact Size** | Full model checkpoint (~160 MB) | Head checkpoint (~5–10 MB) | Adapter delta (~2–10 MB) |
| **Inference Serving** | Direct single-model load | Load base + inject head weights | Load base + merge adapter weights |

---

## Decision Framework

Use the following guidelines to select the appropriate training mode:

1. **Choose Full Fine-Tuning if:**
   - Your imagery has high domain divergence from standard pre-training sets (e.g., satellite, multispectral, microscopic).
   - Sufficient training data and GPU VRAM are available to prevent catastrophic forgetting and overfitting.

2. **Choose Backbone Freezing if:**
   - Training resources (VRAM and compute time) are heavily constrained.
   - Target classes are standard objects visually consistent with the pre-trained domain.

3. **Choose LoRA Adaptation if:**
   - You need strong domain adaptation with minimal storage overhead.
   - You want to maintain multiple lightweight, swappable task-specific adapters over a single shared frozen base model.