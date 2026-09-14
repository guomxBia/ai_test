# Neural Network Architecture Families

Quick reference for major architecture types, grouped by core mechanism.

## AI / ML / DL Hierarchy

```
AI (broadest: any intelligent behavior, incl. rule-based systems)
 └─ Machine Learning (learns patterns from data)
     └─ Deep Learning (multi-layer neural networks)
         ├─ CNN, Transformer, RNN, GNN, GAN, Diffusion, ... (below)
```

## Architecture Reference Table

| Architecture | Core Mechanism | Best Known For | Example Models |
|---|---|---|---|
| **CNN** | Sliding filters, local spatial patterns | Images, video | ResNet, DeepLabV3, YOLO, ConvNeXt |
| **Transformer** | Self-attention (every element sees every other) | Text; also images/audio | GPT, Claude, BERT, ViT |
| **RNN** | Sequential state, step-by-step | Sequences (older approach) | Vanilla RNN |
| **LSTM / GRU** | Gated memory, fixes RNN forgetting | Speech, time series, early NLP | LSTM, GRU |
| **GNN** | Message-passing between graph nodes | Molecules, social networks, recommendations | GCN, GraphSAGE, GAT |
| **Autoencoder** | Compress → reconstruct | Compression, denoising, anomaly detection | Vanilla AE, VAE |
| **GAN** | Generator vs. discriminator, adversarial | Realistic image/video generation | StyleGAN, CycleGAN |
| **Diffusion** | Denoise random noise step-by-step | Image/video/audio generation | Stable Diffusion, DALL-E, Sora |
| **MLP** | Fully connected, no spatial/sequential bias | Tabular data, simple baselines | Basic feedforward nets |
| **SNN** | Event-driven, mimics biological neurons | Neuromorphic/low-power hardware | Loihi-based models |
| **Mamba / SSM** | Linear-time sequence modeling | Long-sequence, efficient LLMs | Mamba, S4 |

## Key Relationships

- **Sequence modeling evolution:** RNN → LSTM/GRU → Transformer (each fixes the prior's weakness: memory, then speed/long-range context)
- **Generation rivalry:** GANs (dominant ~2014–2020) → Diffusion models (dominant since, more stable training)
- **Attention's challenger:** Mamba/SSMs scale *linearly* with sequence length vs. Transformer's *quadratic* attention cost — still mostly experimental/hybrid in production
- **Vision ↔ Text crossover:** ViT applies Transformers to images (patches = tokens); ConvNeXt applies Transformer-era training tricks to CNNs
- **Hybrids are common:** CLIP (CNN/ViT + Transformer), AlphaFold (attention + geometric modules)

## Rule of Thumb

| Your data looks like... | Reach for... |
|---|---|
| Images/video (spatial grid) | CNN or ViT |
| Text/language (long-range dependencies) | Transformer |
| Time series / sequences | LSTM, Transformer, or Mamba (for very long sequences) |
| Graphs (molecules, networks) | GNN |
| Need to generate new realistic content | Diffusion (or GAN) |
| Tabular data | MLP, or classical ML (XGBoost, etc.) |