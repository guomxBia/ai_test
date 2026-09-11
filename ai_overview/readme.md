# LLM Pipeline: From Training to Agentic Application

A map of the full stack — from raw model training down to a deployed agent — showing where each major tool/framework sits and how the tracks diverge and reconverge.

```
[ PHASE 1: TRAINING / FINE-TUNING ]
   │
   ├── Core Frameworks
   │       PyTorch
   │       JAX
   │       TensorFlow / Keras
   │
   └── Training / Scaling Layers
           DeepSpeed
           Megatron-Core
           Hugging Face Accelerate / Transformers
           PyTorch FSDP
                    │
                    ▼
        Model weights
        (SafeTensors / PyTorch checkpoints)
                    │
                    ▼
[ PHASE 2: CONVERSION / OPTIMIZATION ]
   │
   ├── Convert → GGUF → Quantize
   │       optimized for the llama.cpp ecosystem
   │
   └── Export → ONNX
           portable ML computation graph + weights
                    │
                    ▼
[ PHASE 3: INFERENCE RUNTIME / ENGINE ]
   │
   ├── LLM-specialized
   │       llama.cpp → consumes GGUF
   │
   └── General-purpose ML
           ONNX Runtime (+ ONNX Runtime GenAI) → consumes ONNX
           vision / speech / NLP / LLM / etc.
                    │
                    ▼
[ PHASE 4: APPLICATION / SERVING LAYER ]
   │
   ├── Higher-level local AI tools
   │       Ollama
   │       LM Studio
   │       Jan
   │
   ├── API server
   │       REST / OpenAI-compatible endpoint
   │
   └── In-process application
           C# / C++ / Node.js / Java / etc.
                    │
                    ▼
[ PHASE 5: AGENTIC APPLICATION ]
   LLM
    + Tools / function calling
    + Retrieval / RAG
    + Memory / application state
    + Planning / workflow logic
    + UI
```

---

## Phase 1 — Training / Fine-Tuning

**Core frameworks** do the actual gradient computation:
- **PyTorch** — de facto standard, dynamic graphs, most published models/tutorials use it.
- **JAX** — functional, TPU-native, used heavily by Google DeepMind for large-scale training.
- **TensorFlow / Keras** — mostly legacy or production-pipeline territory now; Keras 3 can run on PyTorch/JAX backends.

**Scaling layers** make the core frameworks work when a model is too large for one GPU:
- **DeepSpeed** (Microsoft) — ZeRO optimizer sharding.
- **Megatron-Core** (NVIDIA) — tensor/pipeline parallelism, used to train many large open LLMs.
- **Hugging Face Accelerate / Transformers** — high-level training loop + multi-GPU orchestration, most common entry point for fine-tuning.
- **PyTorch FSDP** — PyTorch's native fully-sharded data parallel training.

**Output:** model weights, typically as **SafeTensors** (safe, fast, now preferred over pickle-based `.bin` checkpoints) or raw PyTorch checkpoints.

---

## Phase 2 — Conversion / Optimization

The trained weights don't run efficiently as-is — they need to be converted for a target inference engine. **This is a fork, not a sequence** — you pick one path per deployment target, not both.

**Path A: GGUF (for llama.cpp)**
1. Convert HF/PyTorch weights → GGUF (fp16) using `convert_hf_to_gguf.py`
2. Quantize separately using `llama-quantize` (e.g. down to Q4_K_M, Q5_K_M, etc.)

These are two distinct steps — a common trip-up is expecting one script to do both.

**Path B: ONNX (for ONNX Runtime)**
- Export via `torch.onnx.export()` or Hugging Face's `optimum` library
- Produces a portable computation graph + weights, usable by any ONNX-compatible runtime, not just LLM engines

---

## Phase 3 — Inference Runtime / Engine

- **llama.cpp** — specialist engine, built from scratch for autoregressive transformer inference. Consumes GGUF. Maximally optimized for this one workload.
- **ONNX Runtime (+ ONNX Runtime GenAI)** — generalist engine, executes any ONNX graph — vision, speech, classical ML, and (via the GenAI extension) LLMs with tokenization + KV-cache + generation loop built in.

Both are true "engines" — the actual compute happens here, not in Phase 4.

---

## Phase 4 — Application / Serving Layer

Wrappers around Phase 3 engines, adding UX, management, and access patterns:

- **Higher-level local AI tools** — Ollama, LM Studio, Jan — add model pulling, CLI/GUI, auto-unload, chat templates on top of an engine (Ollama and LM Studio wrap llama.cpp; Jan's engine is Cortex).
- **API server** — REST/OpenAI-compatible endpoint, either via a wrapper's built-in server or the engine's own (e.g. llama.cpp ships `llama-server` natively).
- **In-process application** — direct language bindings with no network hop: `node-llama-cpp`, `llama-cpp-python`, `onnxruntime-node`, `Microsoft.ML.OnnxRuntime` (C#), etc.

---

## Phase 5 — Agentic Application

The LLM (served via any Phase 4 path) becomes one component in a larger system:

- **Tools / function calling** — LLM can invoke external functions/APIs
- **Retrieval / RAG** — inject relevant external knowledge into context at query time
- **Memory / application state** — persist context across turns/sessions beyond the raw chat history
- **Planning / workflow logic** — multi-step reasoning, task decomposition, orchestration (ReAct-style loops, LangGraph, etc.)
- **UI** — the surface the end user actually interacts with

---

## Key takeaway

This isn't one pipeline — it's **two parallel deployment tracks (GGUF/llama.cpp vs. ONNX/ONNX Runtime) that both terminate in the same Phase 4/5 application patterns.** The choice made in Phase 2 constrains which engine you use in Phase 3, but everything above that (serving, agentic logic, UI) looks the same regardless of which track you took.