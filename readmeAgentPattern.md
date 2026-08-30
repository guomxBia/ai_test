# AI Agent Models & Google ADK

A quick reference for common **AI agent patterns** and how they map to **Google Agent Development Kit (ADK)**.

## Agent Patterns

| Pattern                      | How It Works                                   | Google ADK                     |
| ---------------------------- | ---------------------------------------------- | ------------------------------ |
| **ReAct**                    | Reason → Action/Tool → Observe → repeat        | `LlmAgent` + Tools             |
| **Tool-Calling Agent**       | LLM decides which function/tool to invoke      | `LlmAgent` + Tools             |
| **Router Agent**             | Routes a request to the appropriate agent/tool | `LlmAgent` + sub-agents        |
| **Plan-and-Execute**         | Create a plan → execute steps → return result  | Agent/workflow composition     |
| **Sequential Workflow**      | Agent A → Agent B → Agent C                    | `SequentialAgent`              |
| **Parallel Workflow**        | Run multiple agents/tasks concurrently         | `ParallelAgent`                |
| **Loop / Iterative Agent**   | Repeat a process until a condition is met      | `LoopAgent`                    |
| **Reflection / Critic**      | Generate → critique → improve → repeat         | `LoopAgent` + `LlmAgent`       |
| **Supervisor / Manager**     | Main agent delegates to specialist agents      | Parent `LlmAgent` + sub-agents |
| **Hierarchical Multi-Agent** | Agents delegate work to other agents           | Agent composition              |
| **Human-in-the-Loop**        | Pause execution for human input/approval       | Workflow/tool design           |
| **Custom Agent**             | Developer implements custom orchestration      | `BaseAgent`                    |

---

## Google ADK Mental Model

```text
Google ADK
│
├── LLM-Driven Agents
│   │
│   └── LlmAgent
│       ├── Reasoning
│       ├── Tool calling
│       ├── Routing
│       └── Agent delegation
│
├── Workflow Agents
│   │
│   ├── SequentialAgent
│   ├── ParallelAgent
│   └── LoopAgent
│
└── Custom Agents
    │
    └── BaseAgent
```

---

## Example Multi-Agent Architecture

```text
                    Root LlmAgent
                  Router / Supervisor
                          │
           ┌──────────────┼──────────────┐
           │              │              │
           ▼              ▼              ▼
       RAG Agent    Research Agent    Data Agent
           │              │              │
           ▼              ▼              ▼
     Vector Search    Web Search        SQL
       / Chroma          / MCP        Database
```

The root agent determines which specialist should handle the request.

---

## Combining Workflow Patterns

ADK building blocks can also be composed.

```text
SequentialAgent
│
├── Research Agent
│      │
│      ├── Web Search
│      └── MCP Tools
│
├── Analysis Agent
│
├── Critic Agent
│
└── Writer Agent
```

Another example uses parallel research:

```text
                    ParallelAgent
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
         Web Agent    RAG Agent   GitHub Agent
             │           │           │
             └───────────┼───────────┘
                         ▼
                  Synthesis Agent
```

---

## Reflection Pattern

A `LoopAgent` can be used to implement iterative review/refinement.

```text
Generate
   │
   ▼
Critic Agent
   │
   ▼
Good Enough? ─── Yes ──→ Finish
   │
   No
   ▼
Improve
   │
   └──────────────→ Critic
```

---

## RAG + Agents + MCP

These technologies solve different problems and can be combined.

```text
                         Agent
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
             RAG        MCP Tools    Direct Tools
              │            │            │
              ▼            ▼            ▼
          Vector DB      GitHub       Database
           Chroma        Jira          APIs
          pgvector       Search        Services
```

### RAG

Retrieves relevant information from private/unstructured knowledge.

```text
Question
   ↓
Embedding
   ↓
Vector Search
   ↓
Relevant Documents
   ↓
LLM
   ↓
Answer
```

### Tools

Allow an agent to access data or perform actions.

Examples:

```text
search_documents()
search_web()
get_customer()
query_database()
create_ticket()
send_notification()
```

### MCP

Model Context Protocol provides a standardized way to expose external tools and resources to AI applications.

```text
Agent
  │
  ├── MCP → Search
  ├── MCP → GitHub
  ├── MCP → Jira
  └── MCP → RAG Service → Vector DB
```

---

## Choosing the Right Mechanism

| Requirement                            | Typical Solution  |
| -------------------------------------- | ----------------- |
| Private unstructured documents         | RAG               |
| Semantic document search               | Vector DB / RAG   |
| Current internet information           | Web Search        |
| Structured business data               | SQL / APIs        |
| Perform external actions               | Tools             |
| Standardized external tool integration | MCP               |
| Dynamic reasoning + tool selection     | `LlmAgent`        |
| Fixed processing pipeline              | `SequentialAgent` |
| Concurrent processing                  | `ParallelAgent`   |
| Iterative refinement                   | `LoopAgent`       |
| Custom orchestration                   | `BaseAgent`       |

---

## Key Concept

Do not treat **ReAct, RAG, MCP, and Google ADK** as competing technologies.

They operate at different layers:

```text
LLM
 │
 ▼
Agent Pattern
ReAct / Router / Supervisor / Reflection
 │
 ▼
Agent Framework
Google ADK
 │
 ▼
Tools
RAG / Search / SQL / APIs / MCP
 │
 ▼
Data & Services
Chroma / PostgreSQL / GitHub / Jira / Web
```

**Agent pattern** defines how the agent behaves.

**Google ADK** provides building blocks for implementing that behavior.

**Tools and MCP** connect the agent to external capabilities.

**RAG** retrieves relevant knowledge for the agent.
