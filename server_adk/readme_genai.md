Here is a complete `README.md` file that summarizes the differences, along with the `package.json` you need for your ADK demo project. 

You can copy and paste this directly into your project.

---

# `README.md`

# Google AI SDKs: `@google/genai` vs. `@google/adk`

This document outlines the distinct differences between Google's two primary Gen AI Node.js packages and clarifies when to use each.

**Key Takeaway:** Use `@google/genai` to simply add AI features to a standalone app. Use `@google/adk` to build powerful, integrated custom Agents that live inside Google's enterprise platforms.

## 🤖 `@google/genai`: The Raw Model Client
This is the official, general-purpose SDK for directly interacting with Gemini models.
*   **Use Case:** You are building a standalone application (React app, Node.js script, Discord bot) and need to send a prompt to Gemini and get text or JSON back.
*   **How it works:** It requires a standard API key, makes direct HTTP calls to the Gemini API, and returns raw text streams or structured data. It requires no special hosting or agent infrastructure.

## 🏢 `@google/adk`: The Enterprise Agent Builder
The Agent Development Kit (ADK) is specialized tooling for creating autonomous, stateful custom agents that plug directly into **Gemini Enterprise** or **Vertex AI Agent Engine**.
*   **Use Case:** You want to build a custom enterprise agent that has secure access to your company's databases, knows the identity of the user talking to it, and renders rich UI components directly inside the Gemini Enterprise chat interface.
*   **How it works:** It acts as an orchestration layer. It handles complex Agent-to-Agent (A2A) communication protocols, manages automatic tool execution loops, and supports A2UI (Agent-to-Agent User Interface) for rendering visual cards and tables. It handles model interactions natively, meaning you do **not** need `@google/genai` alongside it.

## 📊 Quick Comparison

| Feature | `@google/genai` | `@google/adk` |
|---|---|---|
| **Primary Goal** | Direct LLM prompt/response access | Build integrated enterprise agents |
| **Ecosystem** | Any Standalone App, Script, or Server | Gemini Enterprise, Vertex AI Agent Engine |
| **Rich UI Rendering** | No (Markdown text only) | Yes (A2UI interactive components) |
| **Tool/Function Loop**| Manual (You code the execution loop) | Automatic (Managed by the Agent engine) |
| **User Identity** | None by default | Inherits user context from Gemini Enterprise |

---

## 🛠️ ADK Demo: `package.json`

Here is a production-ready `package.json` designed for an ADK-powered enterprise agent demo. This setup uses Express to serve the agent endpoints and SQLite to simulate an enterprise database.

```json
{
  "name": "google-adk-enterprise-demo",
  "version": "1.0.0",
  "type": "module",
  "description": "A custom ADK agent serving rich UI components and internal data to Gemini Enterprise",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "keywords": [
    "google",
    "adk",
    "agent",
    "gemini-enterprise",
    "demo"
  ],
  "author": "Your Name",
  "license": "ISC",
  "dependencies": {
    "@google/adk": "^1.4.0",
    "@modelcontextprotocol/sdk": "^1.30.0",
    "better-sqlite3": "^13.0.2",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "zod": "^4.4.3"
  }
}
```

### Key Dependencies Explained:
*   **`@google/adk`**: Handles the communication, authentication, and A2UI rendering protocols between your server and the Gemini Enterprise interface.
*   **`express`**: Exposes the necessary REST endpoints so the Agent Runtime can communicate with your custom agent logic.
*   **`better-sqlite3`**: Simulates a local, on-premise enterprise database so your demo agent can fetch and return real structured data (like customer records or inventory).
*   **`@modelcontextprotocol/sdk`**: Provides the standard protocol (MCP) for securely connecting your AI agent to those local data sources.
*   **`zod`**: Strictly validates the schemas for your agent's custom tools, ensuring the LLM passes the exact correct parameters before executing database queries.