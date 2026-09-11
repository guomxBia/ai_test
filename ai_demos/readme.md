# Image Classification — Modern Proof-of-Concept

## Goal
This project is a modern re-implementation of the core idea from my original thesis:
classifying an image into land-cover categories using a neural network. The original
work (1996) used a custom C program with a small 3-input / 2-hidden-layer / 7-output
MLP, trained on hand-computed median spectral vectors due to hardware memory limits.

This version reproduces the same underlying concept — pixel-wise land-cover
classification — using modern machine learning practices: a pretrained deep
learning segmentation model instead of a hand-built MLP, and spatial/textural
context instead of isolated pixel color values.

## Scope of This Proof-of-Concept
To keep the demo simple and fast to reproduce, the original suburban house scene
(house, garage, lawn, driveway, street — 6–7 classes) has been reduced to a
**4-class farm field scene**, using a single aerial image:

| Class ID | Category         |
|----------|------------------|
| 0        | Crop Field Left  |
| 1        | Green Field      |
| 2        | Road             |
| 3        | Crop Field Right |

This is intentionally a small, single-image proof-of-concept — not a robust,
general-purpose classifier. The goal is to demonstrate that the modern pipeline
works end-to-end, the same way the 7-median-vector dataset in the original thesis
was a minimal proof-of-concept for its era.

## Data
- `data/four_classes.jpg` — original RGB aerial image (input).
- `data/semantic_mask.png` — ground-truth label mask, same dimensions as the
  image, where each pixel value is a class ID (0–3) as defined above.
- `data/classes.txt` — plain-text mapping of class ID → class name.

Labeling was done ahead of time (mask already provided), so no interactive
annotation tool (CVAT/Label Studio) is needed for this proof-of-concept.

## Method
This is a **semantic segmentation** task: every pixel in the image is assigned
one of the 4 class labels, producing a full classified map.

1. Load a **pretrained DeepLabV3 (ResNet-50 backbone)** segmentation model.
2. Replace its final classification head with a new layer outputting 4 channels
   (one per class) instead of its original class count.
3. Fine-tune this adapted model on the single labeled image (optionally split
   into smaller patches to give the model more training samples).
4. Run inference on the full image, take the argmax class per pixel, and
   generate a color-coded classified map.
5. Compare the predicted map against `semantic_mask.png` as a sanity check.

## Modern vs. Original Thesis Approach

| Original (1996, C)                          | Modern (this project)                          |
|----------------------------------------------|-------------------------------------------------|
| 3 spectral bands, single-pixel input          | RGB + surrounding texture/shape via CNN         |
| 7 hand-computed median vectors as training set| 1 labeled image (optionally patch-split)        |
| Custom 3→8→10→7 MLP, random init each run     | Pretrained DeepLabV3-ResNet50, fine-tuned       |
| Manual monitoring + restart on stagnation     | Adam optimizer, rarely stalls                   |
| Hours to converge                             | Seconds to minutes                              |
| One-hot output, hard 0.9/0.1 thresholds       | Softmax probabilities, argmax per pixel         |

## Environment
Developed and run entirely in **GitHub Codespaces** (no local Python install
required). See `requirements.txt` for dependencies.

## Project Structure
```
image_classification/
├── data/
│   ├── four_classes.jpg
│   ├── semantic_mask.png
│   └── classes.txt
├── train.py       # fine-tunes DeepLabV3 on the 4 classes
├── predict.py     # runs inference, outputs color-coded classified map
├── utils.py       # shared helpers (mask handling, colorizing, patching)
├── requirements.txt
└── README.md
```

## Status
🚧 Proof-of-concept in progress — see `train.py` / `predict.py` for current state.