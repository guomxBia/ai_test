# When Do You Actually Need an Agent?

A quick decision guide for this project (and similar tool-calling apps):
when to route a request through an LLM agent, and when to skip straight to
the tool/API call.

---

## The core question

> Does turning this request into an action require **understanding
> language**, or just **extracting a value**?

- **Extracting a value** → skip the LLM. Use a form, dropdown, regex, or a
  direct function/API call.
- **Understanding language** → an agent earns its keep.

---

## Skip the LLM when...

- **The mapping from input → parameters is simple and well-defined.**
  Example from this project: `"Find power plants in Michigan"` → `{ state:
  "Michigan" }`. A regex or a state-name dropdown does this instantly, for
  free, with zero failure modes.
- **The user already knows exactly what they want and can just say it
  structurally.** A search box + filters is faster and more predictable
  than typing a sentence for the LLM to parse.
- **There's only one possible data source / tool.** If a request can only
  ever mean "call `query_power_plants_us_eia`," there's nothing to decide —
  routing logic is a `switch` statement, not a reasoning problem.
- **Latency, cost, or rate limits matter.** Every LLM call adds a network
  round-trip, a $ cost, and exposure to provider rate limits (see: hitting
  Gemini's free-tier 5 req/min cap after a handful of chat turns). A direct
  API/tool call has none of that.
- **You need deterministic, reproducible output.** Same input should always
  produce the same result — e.g. billing, compliance, anything audited.
  LLM output can vary between calls even with the same prompt.
- **A simpler tool already works and users aren't asking for more.**
  Don't add an agent speculatively "in case it's useful later" — add it
  when a real request outgrows the simple version.

**In this project:** `/api/test-powerplants`, `/api/test-local-wells`, and
`/api/test-local-files` in `routes.js` already prove this — they call
`arcgisHttpMcpClient` / `LocalToolsStdioMcpClient` directly, no agent involved,
and work fine for straightforward, single-source queries.

---

## Use an agent when...

- **The request could mean different things, and figuring out which
  requires judgment.** "Show me the local wells" vs. "Find power plants in
  Michigan" route to two entirely different transports (stdio vs.
  HTTP/SSE) with no explicit instruction from the user about which to use.
  This is exactly what `combinedAgent.js` does well — it picks the right
  tool based on phrasing, not a menu selection.
- **The request is compound or multi-step.** "Show me power plants near
  national parks in the Upper Peninsula that aren't coal" needs to be
  decomposed into multiple tool calls and combined — that's reasoning, not
  parameter extraction.
- **Context from earlier turns matters.** "Now do the same for Ohio" only
  makes sense if something remembers what "the same" refers to.
  Conversation memory is an LLM/agent-shaped problem.
- **The output needs to synthesize across multiple sources into one
  coherent answer.** Turning several tool results into a single readable
  summary is language generation, which is what LLMs are actually good at.
- **The input is genuinely open-ended natural language**, and you can't
  enumerate all the ways someone might phrase a request in a fixed set of
  form fields.

---

## Quick test

Ask: **"Could a dropdown, search box, or regex handle this?"**

- Yes → build that. It'll be faster, cheaper, and more reliable than an
  agent, and users will not notice or care that "AI" wasn't involved.
- No, because the request requires judgment, routing between sources, or
  free-form language understanding → that's a legitimate case for an
  agent.

---

## A practical middle ground

You don't have to pick one mode for the whole app. In this project:

- Keep the **agent path** (`combinedAgent.js` / `/api/chat`) for
  cross-source routing and ambiguous/compound questions — where it
  actually adds value over a fixed UI.
- Let **simple, structured queries** (state filter, name search) bypass
  the LLM entirely and call `FederalGisHttpMcpClient` /
  `LocalToolsStdioMcpClient` directly — the plumbing for this already exists
  via the test routes in `routes.js`.

This keeps the "wow, it understood what I meant" moments for where they're
earned, without paying LLM latency/cost/rate-limit tax on requests that
never needed language understanding in the first place.

---

## Red flags that you've overengineered with AI

- You've hit a provider rate limit during ordinary testing (see: `429` /
  quota exceeded in this project's own logs) for what's functionally a
  single filtered lookup.
- The LLM's job on most turns is just "extract this one field from this
  one sentence."
- You can already predict, for 90% of real usage, exactly which tool will
  be called — the "decision" isn't actually in doubt.
- Users would be equally happy (or happier) with a form, and no one has
  asked for free-form input.