# AI Agent Ecosystem: Products vs. SDKs

## The core pattern

Most vendors follow a two-layer model, similar to how **ArcGIS Pro** (the application) pairs with the **ArcGIS Pro SDK** (used to extend/customize it):

- **The Application** — a ready-to-use agentic tool (e.g., a coding CLI)
- **The SDK** — the underlying framework/harness exposed so developers can build their own custom agents

## Anthropic

- **Claude Code** (the application) — terminal-based agentic coding tool
- **Claude Agent SDK** — not just "a tool to customize Claude Code." Anthropic extracted the general-purpose agent harness/scaffolding underneath Claude Code and exposed it as a standalone SDK, so you can build *any* agent (coding or otherwise), not just tweak Claude Code specifically.

## Google

- **Gemini CLI** (the application) — Google's direct Claude Code equivalent, a terminal-based agentic coding tool
- **Google ADK (Agent Development Kit)** — the general-purpose framework for building agents, analogous to Claude Agent SDK

## OpenAI

- **Codex / Codex CLI** (the application) — OpenAI's direct Claude Code analog
- **OpenAI Agents SDK** — general framework for building custom agents, not specific to Codex

## Perplexity

The analogy breaks down here. Perplexity's core product is a search/answer engine, not a coding assistant.

- No dedicated agentic coding CLI comparable to Claude Code, Codex, or Gemini CLI
- No public "agent SDK" in the same category
- They do offer API access (Sonar API) for building on top of search — more "search-as-a-service" than an agent-building toolkit

*Note: this space moves fast; worth a web search for anything shipped recently.*

---

## Orchestration: Claude Agent SDK vs. ADK / OpenAI Agents SDK

**Claude Agent SDK** is essentially the harness that runs Claude Code, exposed as a library. A lot of what you'd normally build yourself comes included:

- The agentic loop (plan → use tools → check results → iterate)
- Context/token management with automatic compaction
- File and bash tool integration
- Permissions

You mostly write the task, tools, and system prompt — the loop itself is handled for you. It does support subagents and hooks for branching out, but the default mode is "one capable agent working autonomously," matching how Claude Code behaves.

**Google ADK** and **OpenAI Agents SDK** are lower-level by design. They give you primitives (agents, tools, sessions) and expect you to wire up control flow yourself:

- **ADK** leans toward explicit workflow structure — `SequentialAgent`, `ParallelAgent`, `LoopAgent`, custom orchestrator agents — so multi-step or multi-agent pipelines are something you architect deliberately.
- **OpenAI Agents SDK** is lighter than ADK but still puts orchestration in your hands via handoffs between agents, guardrails, and session state you manage.

### Which one fits "a lot of orchestration"?

- If "orchestration" means **complex multi-agent pipelines** — explicit branching, parallel agents, custom routing logic, fine-grained control over agent handoffs — that's the strength of **ADK or Agents SDK**, not Claude Agent SDK.
- If "orchestration" means **getting one agent to reliably use tools and iterate until a task is done** — **Claude Agent SDK** will feel much easier, precisely because it removes that burden.

Claude Agent SDK's "less orchestration" is a feature when the app's value is one agent autonomously completing a task (coding, research, ops work). It's a limitation if the app's core value is a specific, controlled multi-agent graph you want to design yourself.

---

## Package reference

```markdown
1) Claude (Anthropic)
   @anthropic-ai/sdk            (client)
   @anthropic-ai/claude-agent-sdk  (agent)

   @modelcontextprotocol/sdk    (MCP)

2) Google
   @google/genai                (client)
   @google/adk                  (agent)

3) Vercel
   server side: ai; @ai-sdk/google  (client and agent)
   client side: ai; @ai-sdk/react
```