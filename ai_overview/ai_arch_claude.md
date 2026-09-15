# Backpropagation vs. Architecture (CNN, etc.)

## Key Distinction

| Concept | What it is | Answers the question |
|---|---|---|
| **Architecture** (CNN, RNN, Transformer...) | How the network is structured | "What shape is the network?" |
| **Backpropagation (BP)** | Algorithm for computing gradients & updating weights | "How does the network learn?" |

**Backpropagation is not part of the CNN family — it's the general training algorithm that CNNs (and nearly all neural networks) use.**

## Timeline

| Year | Event |
|---|---|
| 1986 | Rumelhart, Hinton & Williams popularize backpropagation — architecture-agnostic |
| 1989 | LeCun applies **CNN + backprop** to handwritten digit recognition |
| 1998 | LeCun formalizes **LeNet-5**, the modern CNN blueprint — still trained via backprop |
| 1996 | CNNs already exist and already use backprop — no separate/distinct "1996 BP algorithm" |

## Who Uses Backprop?

| Architecture | Trained via Backprop? |
|---|---|
| MLP | ✅ |
| CNN | ✅ |
| RNN / LSTM | ✅ (variant: backprop through time) |
| Transformer | ✅ |
| GAN | ✅ (through both generator & discriminator) |

## Bottom Line

> CNN uses backpropagation to train. Backpropagation belongs to no single architecture — it's the shared learning mechanism underneath almost all deep learning, from 1986 to today's LLMs.