Yes. That's an important addition: **both can use MCP and RAG**, although RAG is generally an application pattern rather than something exclusive to either framework.

A concise section for the README could be:

## MCP & RAG

Both **Google ADK** and **Vercel AI SDK** can integrate with **MCP** and implement **RAG**.

| Capability          | Vercel AI SDK | Google ADK |
| ------------------- | ------------: | ---------: |
| MCP servers / tools |             ✅ |          ✅ |
| Custom tools / APIs |             ✅ |          ✅ |
| RAG                 |             ✅ |          ✅ |
| Embeddings          |             ✅ |          ✅ |
| Vector databases    |             ✅ |          ✅ |
| Agent + RAG         |             ✅ |          ✅ |
| Agent + MCP         |             ✅ |          ✅ |

### MCP

Both frameworks can expose MCP capabilities to an agent:

```text
Agent
  ↓
MCP Client
  ↓
MCP Server
  ├── Tools
  ├── Resources
  └── External Systems
```

MCP therefore reduces framework lock-in: the same external capability can potentially be consumed by agents built with either framework.

### RAG

Both can implement the standard RAG pipeline:

```text
User Question
     ↓
Agent / Application
     ↓
Embedding / Search
     ↓
Vector DB / Knowledge Base
     ↓
Relevant Documents
     ↓
LLM
     ↓
Grounded Response
```

RAG can also simply become another agent tool:

```text
Agent
 ├── searchKnowledgeBase()   ← RAG
 ├── MCP tools
 ├── databaseQuery()
 ├── webSearch()
 └── other application tools
```

So **MCP and RAG are not major differentiators between Google ADK and Vercel AI SDK**. The more important distinction remains their architectural starting point:

> **Google ADK:** Agent → orchestration → tools/models
> **Vercel AI SDK:** Model calls → tools/streaming → agents → interactive AI application
