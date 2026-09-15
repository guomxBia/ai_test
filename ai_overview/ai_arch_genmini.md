# AI, Machine Learning, and Deep Learning: Taxonomy & Architecture Guide

A structured technical guide clarifying the conceptual hierarchy of Artificial Intelligence, the broader ecosystem of Machine Learning models, the core architectural divergence between Convolutional Neural Networks (CNNs) and Transformers, and the foundational role of optimization algorithms like Backpropagation (BP).

---

## 1. The Core Hierarchy: Concentric Domains

A common misconception is that Machine Learning and AI are mutually exclusive categories, or that modern LLMs represent "AI" while vision models represent "only ML." In computer science, they exist in a strict subset hierarchy:

```
┌─────────────────────────────────────────────────────────────────┐
│ Artificial Intelligence (AI)                                    │
│  Any technique enabling computers to mimic human intelligence   │
│  (Includes expert systems, symbolic logic, search algorithms)   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Machine Learning (ML)                                    │  │
│   │  Algorithms that learn patterns directly from data        │ │
│   │  (Classical: Random Forest, SVM, XGBoost, k-Means)        │ │
│   │                                                           │ │
│   │   ┌─────────────────────────────────────────────────┐    │ │
│   │   │ Deep Learning (DL)                              │     │ │
│   │   │  Neural networks with many stacked layers        │    │ │
│   │   │                                                  │    │ │
│   │   │   • Computer Vision (CV):                        │    │ │
│   │   │     ResNet-50, DeepLabV3, YOLO, ViT              │    │ │
│   │   │                                                  │    │ │
│   │   │   • Natural Language Processing (NLP) / LLMs:    │    │ │
│   │   │     GPT-4, LLaMA, Claude, BERT, T5               │    │ │
│   │   │                                                  │    │ │
│   │   │   • Generative Modeling:                         │    │ │
│   │   │     Stable Diffusion, Midjourney, Diffusion      │    │ │
│   │   └─────────────────────────────────────────────────┘    │ │
│   └────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

- **All Machine Learning is AI, but not all AI is Machine Learning** (e.g., pathfinding, chess engines using minimax with alpha-beta pruning, and rule-based expert systems are AI, but not ML).
- **All Deep Learning is Machine Learning** (and therefore also AI).
- **Both Computer Vision models (ResNet, DeepLabV3) and LLMs are Deep Learning**, meaning both belong to Machine Learning and both belong to AI.

---

## 2. Architectures vs. Learning Algorithms: Where Does Backpropagation (BP) Fit?

To understand how the Backpropagation (BP) algorithm relates to CNNs and AI, it is essential to distinguish between **Network Architectures** and **Optimization Algorithms**:

```
┌───────────────────────────────────────────────────────────────────────┐
│                       MACHINE LEARNING / AI                           │
│                                                                        │
│   MODEL ARCHITECTURES (The Structure)   OPTIMIZATION ALGORITHM (Engine)│
│   • Multilayer Perceptrons (MLP)        ┌────────────────────────────┐│
│   • Convolutional Networks (CNN)  ◄─────┤ Backpropagation (BP)       ││
│   • Recurrent Networks (RNN/LSTM) ◄─────┤ (Calculates exact gradients││
│   • Transformers (LLMs / ViT)     ◄─────┤  via the Calculus Chain    ││
│                                         │  Rule)                     ││
│                                         └────────────────────────────┘│
└───────────────────────────────────────────────────────────────────────┘
```

### A. Does Backpropagation "Belong" to CNNs?

**No.** BP does not belong to CNNs — instead, **CNNs use Backpropagation**.

Backpropagation is a universal training algorithm for artificial neural networks. It calculates the partial derivatives of the loss function with respect to every weight parameter (`∂L/∂W`) using the chain rule of calculus.

It applies equally to:
- Standard Multi-Layer Perceptrons (MLPs)
- Recurrent Neural Networks (RNNs, via Backpropagation Through Time / BPTT)
- Convolutional Neural Networks (CNNs)
- Modern Transformers (LLMs)

### B. Historical Milestones & The 1990s Era

| Period | Milestone |
|---|---|
| **1970–1974** | Mathematical foundations: reverse-accumulation automatic differentiation discovered by Seppo Linnainmaa (1970), applied to neural networks by Paul Werbos (1974) |
| **1986** | The breakthrough: Rumelhart, Hinton & Williams publish *"Learning representations by back-propagating errors"*, demonstrating BP could train multi-layer networks to learn internal representations |
| **1989 & 1998** | Applying BP to CNNs: Yann LeCun applies backpropagation to convolutional architectures for handwritten zip code recognition (1989) and checks — the famous **LeNet-5** (1998) |
| **1995–1996** | Mid-1990s context: neural networks (Connectionism) struggle through the late "AI Winter." In 1995, Cortes & Vapnik introduce **Support Vector Machines (SVMs)**, which temporarily overshadow BP-trained networks with convex optimization guarantees. Despite this, LeCun, Bengio, and Hinton persist with BP-trained CNNs through the 1990s, setting the stage for the 2012 deep learning revolution (AlexNet) |

### C. Did BP in 1996 Belong to AI?

**Yes, absolutely.** Backpropagation was, and remains, the core learning engine of Connectionist AI (neural network-based AI) and Machine Learning.

---

## 3. Where ResNet-50 and DeepLabV3 Fit

Both belong to **Computer Vision (CV)**, powered by Deep Learning:

- **ResNet-50** (Residual Network, 50 layers): a CNN architecture for image classification and visual feature extraction. Introduced residual skip connections (`y = F(x, {Wᵢ}) + x`) to solve the vanishing gradient problem in very deep networks.
- **DeepLabV3**: a semantic segmentation architecture that assigns a category to every pixel in an image, using atrous (dilated) convolutions and Atrous Spatial Pyramid Pooling (ASPP) for multi-scale context without losing spatial resolution.

Because these models learn weights via backpropagation over large datasets (e.g., ImageNet, COCO), they are Deep Learning models — placing them squarely inside Machine Learning and Artificial Intelligence.

---

## 4. Where LLMs Fit

LLMs belong to **NLP and Generative Modeling**, powered by Deep Learning:

- **Transformer Architecture**: Modern LLMs (LLaMA, GPT, Gemini, Mistral) are deep neural networks based on multi-head self-attention (Vaswani et al., 2017).
- **Learning Mechanism**: Like ResNet, LLMs train via gradient descent and backpropagation on vast datasets — optimizing next-token cross-entropy loss instead of image classification loss.
- **Relationship to ML**: LLMs are not fundamentally distinct from Machine Learning — they are scaled-up deep neural sequence models.

---

## 5. Deep Architectural Dive: CNNs vs. Transformers

```
       CONVOLUTIONAL (CNN)                    TRANSFORMER (ATTENTION)
    [Local Spatial Kernels]                 [Global Pairwise Attention]
      ┌───┬───┬───┐                           Token 1 ──┐   ┌── Token 1
      │ k │ k │ k │                                     ▼   ▼
      ├───┼───┼───┤                           Token 2 ──►(Q·Kᵀ)◄── Token 2
      │ k │ k │ k │                                     ▲   ▲
      └───┴───┴───┘                           Token 3 ──┘   └── Token 3
   Sliding across 2D Grids                  Every token attends to every
 (Translation Invariance + Locality)          other token dynamically
```

### A. Convolutional Architectures (ResNet-50, DeepLabV3)

- **Input Structure**: Continuous 3D/4D spatial tensors, shape `(B, C, H, W)` — Batch, Channels (e.g., RGB), Height, Width.
- **Core Operation** — Discrete 2D Convolution:
  ```
  (I * K)(i, j) = ΣmΣn I(i−m, j−n) · K(m, n)
  ```
- **Inductive Biases**:
  - **Locality**: nearby pixels are strongly correlated; filters look at small patches (e.g., 3×3 or 7×7) at a time
  - **Translation Equivariance**: a feature (edge, eye, wheel) is recognized regardless of position in the image
  - **Receptive Field**: narrow in early layers, grows hierarchically with depth; global context only achieved deep in the network

### B. Transformer Architectures (LLMs & Vision Transformers)

- **Input Structure**: 2D/3D sequential embeddings, shape `(B, N, D)` — Batch, Sequence Length (N tokens), Embedding Dimension (D).
- **Core Operation** — Scaled Dot-Product Self-Attention:
  ```
  Attention(Q, K, V) = softmax(QKᵀ / √dₖ) · V
  ```
  where Query (Q), Key (K), and Value (V) are linear projections of the input tokens.
- **Inductive Biases**:
  - **Extremely weak inductive bias**: no inherent assumption of locality or order — requires explicit Positional Encodings
  - **Dynamic global receptive field**: from the first layer, any token can directly attend to any other token across the entire context window

### C. The Convergence: Vision Transformers (ViT)

Transformers are no longer restricted to text. ViT applies pure Transformer architectures directly to images:

1. An image of shape `(H, W, C)` is sliced into a grid of non-overlapping patches (e.g., 16×16 pixels).
2. Each patch is flattened into a 1D vector and linearly projected into an embedding — acting exactly like a "word token."
3. The sequence of patch tokens is processed by standard Transformer encoder blocks with self-attention.
4. **Outcome**: ViT outperforms CNNs when trained on massive datasets (hundreds of millions of images), since its low inductive bias lets it learn broader patterns unconstrained by fixed 3×3/5×5 convolutional filters.

---

## 6. Architectural Comparison Matrix

| Dimension | Convolutional Networks (CNNs) | Transformer Architectures |
|---|---|---|
| **Exemplar Models** | ResNet-50, DeepLabV3, ConvNeXt, YOLO | GPT-4, LLaMA-3, BERT, ViT, Swin |
| **Primary Native Data** | Grid/tensor data (images, audio spectrograms) | Sequential tokens (text, code, DNA, patches) |
| **Computational Mechanism** | Fixed-weight sliding spatial kernels (3×3, 5×5) | Pairwise dot-product attention (softmax(QKᵀ/√d)·V) |
| **Receptive Field Growth** | Linear/gradual (requires deep stacking or dilation) | Instantaneous/global (all-to-all from Layer 1) |
| **Inductive Bias** | High (hardcoded spatial locality & translation equivariance) | Low (learns arbitrary pairwise relationships from scratch) |
| **Data Efficiency** | High on small-to-moderate datasets | Low on small datasets; excels exponentially at massive scale |
| **Computational Complexity** | Linear with image resolution: `O(H·W)` | Quadratic with sequence length: `O(N²)` (unless using FlashAttention/linear variants) |

---

## 7. The Broader Landscape of Machine Learning Models

### A. Classical Supervised Learning

Used extensively for tabular data, forecasting, and low-latency prediction:

- **Tree-Based Ensembles**
  - *Random Forest*: ensemble of decision trees via bagging to reduce variance
  - *Gradient Boosted Decision Trees (GBDT)*: XGBoost, LightGBM, CatBoost — sequentially minimize residual errors; often superior to neural networks on tabular data
- **Linear & Kernel Models**
  - *Support Vector Machines (SVM)*: finds optimal hyperplanes in high-dimensional feature spaces
  - *Ridge / Lasso Regression*: linear models with L2/L1 regularization
  - *Logistic Regression*: probabilistic linear classifier

### B. Unsupervised & Dimensionality Reduction

Discover latent structure without labeled targets:

- **Clustering**: k-Means, DBSCAN, Hierarchical Clustering, Gaussian Mixture Models (GMM)
- **Dimensionality Reduction**: PCA, t-SNE, UMAP
- **Anomaly Detection**: Isolation Forests, One-Class SVM

### C. Deep Learning Architectural Families

- **CNNs**: ResNet, EfficientNet, ConvNeXt (images, video, audio spectrograms)
- **Recurrent Architectures**: LSTM, GRU, Mamba/State-Space Models (sequential data, time series)
- **Transformers**: BERT (encoder-only), GPT/LLaMA (decoder-only), T5 (encoder-decoder), ViT
- **Diffusion & Generative Models**: Stable Diffusion, DALL-E, VAEs, GANs

---

## 8. Model Taxonomy Reference Matrix

| Model / Technique | Primary Domain | Core Family | Is It ML? | Is It AI? | Primary Use Case |
|---|---|---|---|---|---|
| **Backpropagation (BP)** | General neural optimization | Optimization algorithm | Yes | Yes | Computing gradients to update neural network weights |
| **ResNet-50** | Computer Vision | Deep Learning (CNN) | Yes | Yes | Image classification, feature extraction backbone |
| **DeepLabV3** | Computer Vision | Deep Learning (CNN + ASPP) | Yes | Yes | Semantic pixel-level segmentation |
| **XGBoost / LightGBM** | Tabular / Structured | Classical ML (GBDT) | Yes | Yes | Risk scoring, fraud detection, tabular prediction |
| **Random Forest** | Tabular / Multi-modal | Classical ML (Ensemble Trees) | Yes | Yes | Classification, regression, feature importance |
| **Support Vector Machine (SVM)** | Text / Tabular | Classical ML (Kernel methods) | Yes | Yes | High-dimensional classification |
| **LLaMA / GPT-4** | Language / Multimodal | Deep Learning (Transformer) | Yes | Yes | Text generation, reasoning, code synthesis |
| **Vision Transformer (ViT)** | Computer Vision | Deep Learning (Transformer) | Yes | Yes | Patch-based image classification & representation |
| **Stable Diffusion** | Computer Vision / Art | Deep Learning (Latent Diffusion) | Yes | Yes | Text-to-image generation |
| **A\* Search / Minimax** | Search & Planning | Symbolic / Heuristic AI | No (Rule/Search) | Yes | Pathfinding, game playing (non-learning) |

---

## 9. Summary & Key Takeaways

1. **AI ⊃ ML ⊃ Deep Learning**: ResNet, DeepLabV3, and LLMs all belong to both Machine Learning and AI.
2. **Backpropagation is an algorithm, not an architecture**: BP does not belong exclusively to CNNs — it's the fundamental calculus-based optimization technique used to train MLPs, CNNs, RNNs, and Transformers alike.
3. **CNNs rely on strong spatial priors**: by enforcing local sliding kernels, models like ResNet-50 excel at processing grid-based pixel tensors with high parameter efficiency and translation invariance.
4. **Transformers rely on global pairwise attention**: by dropping spatial assumptions, models like GPT and ViT let every element (word token or image patch) interact with every other element, scaling dramatically with data and compute.
5. **The modalities are converging**: Vision Transformers (ViT) and multimodal LLMs now apply the Transformer attention mechanism directly to visual patch tokens, merging vision and language under a unified architectural paradigm.