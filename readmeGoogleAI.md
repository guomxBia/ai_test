# Unified Google GenAI SDK Cheat Sheet & Boilerplate

A clean, production-ready reference guide and boilerplate for configuring `@google/genai`—the unified SDK for both **Google AI Studio (Developer API)** and **Google Cloud (Vertex AI)**.

---

## 📌 Overview

The `@google/genai` library unifies Google's AI offerings under a single client SDK. Depending on how you instantiate the `GoogleGenAI` class, your application seamlessly routes requests to either:

1. **Google AI Studio (Gemini Developer API)** – Fast setup, lightweight authentication via API keys, ideal for rapid prototyping and standalone services.
2. **Google Cloud (Vertex AI)** – Enterprise-grade AI infrastructure with Google Cloud IAM service account authentication, regional compliance, data residency, and enterprise SLAs.

---

## 🚀 Installation

```bash
npm install @google/genai
```

---

## 💡 Initialization Patterns

### 1. Google AI Studio (Developer API)

Use this pattern when authenticating via an API key (e.g., standard developer projects or prototyping).

```javascript
import { GoogleGenAI } from "@google/genai";

// Initializes client targeting Google AI Studio endpoint
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
```

### 2. Google Cloud (Vertex AI)

Use this pattern when deploying inside Google Cloud environments (Cloud Run, GKE, Compute Engine) or using GCP Service Account credentials.

```javascript
import { GoogleGenAI } from "@google/genai";

// Initializes client targeting Google Cloud Vertex AI infrastructure
const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GCP_PROJECT_ID || "your-gcp-project-id",
  location: process.env.GCP_LOCATION || "us-central1",
});
```

---

## 🛠 Complete Code Example: Unified Function / Tool Router

Below is a dual-mode function handler pattern that automatically switches between AI Studio and Vertex AI based on environment configurations, maintaining a single clean interface for function/tool routing.

```javascript
import { GoogleGenAI } from "@google/genai";

/**
 * Initializes the unified Gemini client dynamically based on environment configuration.
 * @returns {GoogleGenAI} Instantiated GenAI client.
 */
function createGeminiClient() {
  const isVertex = process.env.USE_VERTEX_AI === "true";

  if (isVertex) {
    return new GoogleGenAI({
      vertexai: true,
      project: process.env.GCP_PROJECT_ID,
      location: process.env.GCP_LOCATION || "us-central1",
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY environment variable for Google AI Studio.");
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
}

/**
 * Executes a tool selection or text generation prompt using @google/genai.
 *
 * @param {Object} options
 * @param {string} options.prompt - The input user prompt.
 * @param {Array} [options.functionDeclarations] - Optional list of tool declarations.
 * @param {string} [options.model] - Target Gemini model.
 * @returns {Promise<Object>} Formatted result object with tool_call or text payload.
 */
export async function geminiGenerateToolCall({ prompt, functionDeclarations = [], model }) {
  const ai = createGeminiClient();
  const modelToUse = model || process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const config = {
    systemInstruction: "You are a helpful assistant evaluating incoming requests and choosing tools.",
  };

  if (functionDeclarations.length > 0) {
    config.tools = [{ functionDeclarations }];
  }

  const response = await ai.models.generateContent({
    model: modelToUse,
    contents: prompt,
    config,
  });

  const functionCall = response.functionCalls?.[0];

  if (functionCall) {
    const { name, args = {} } = functionCall;
    console.log(`[Gemini SDK] Selected tool: "${name}" with args:`, args);

    return {
      type: "tool_call",
      name,
      args,
      source: "gemini",
      model: modelToUse,
    };
  }

  return {
    type: "text",
    text: response.text ?? "",
    source: "gemini",
    model: modelToUse,
  };
}
```

---

## ⚖️ Direct Comparison: AI Studio vs. Vertex AI

| Feature / Criteria | Google AI Studio (`apiKey`) | Google Cloud Vertex AI (`vertexai: true`) |
| :--- | :--- | :--- |
| **Authentication** | Simple API key (`GEMINI_API_KEY`) | GCP IAM / Service Account ADC (Application Default Credentials) |
| **Setup Friction** | Zero GCP project setup required | Requires active GCP project, billing, and enabled Vertex AI API |
| **Enterprise SLA** | standard developer tier | Production enterprise SLA with Cloud support contracts |
| **Data Governance** | Standard consumer privacy policies | Enterprise VPC-SC isolation, data residency, customer-managed keys |
| **Ecosystem Hooks** | AI Studio web builder integration | BigQuery, Vertex Vector Search, Model Monitoring, Cloud Logging |

---

## 📄 License

MIT