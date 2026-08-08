# GIS Agent Demo – ArcGIS + ADK + MCP

This project is a GIS demo application that combines:

- A **Vite + ArcGIS JavaScript** front end for interactive maps.
- A **Node.js + Express** backend with **Google ADK** agents.
- **MCP servers** and an **HTTP ArcGIS features server** to query external GIS services.
- A **SQLite** database for local wells data.

It is designed as a small, agentic GIS system to explore how AI agents, MCP servers, and map services work together.

---

## High-Level Architecture

The system is composed of five main roles:

1. **Agent Host**  
2. **Agent**  
3. **MCP Client / HTTP Client**  
4. **MCP Server / ArcGIS HTTP Server**  
5. **AI Model (LLM)**

These roles are implemented across two projects:

- `server/` – main Node/Express backend + ADK agents + SQLite.
- `mcp_server/` (or `arcgis-docs/`) – MCP servers and ArcGIS HTTP features server.

### Agent Host

The **agent host** orchestrates agents and tools:

- In the `server/` project, the host is the Node backend:
  - Loads configuration and environment (`.env`, `GIS_CLIENT`).
  - Starts the Express app (`index.js`) and wires routes (`routes.js`).
  - Selects which agent to use via `agent.js` (`mock` vs `arcgis`).

- In the MCP config/YAML, the host:
  - Starts MCP servers (e.g., `node arcgis-mcp-server.js`).
  - Registers MCP servers under `mcpServers`.
  - Makes MCP tools available to external agents (e.g., in an IDE or desktop app).

**Responsibilities of the agent host:**

- Start/stop MCP servers and other services.
- Discover tools from MCP servers (`tools/list`) and register them with agents/models.
- Route tool calls from agents/models to the right MCP server.
- Manage sessions, config, auth, and logging.

---

### Agent

An **agent** is the “thinking” component that decides what to do to answer the user.

In this project, agents are implemented using **Google ADK**:

- `libs/mockClient.js` – a mock GIS/SAP agent:
  - Exposes `get_sap_asset_location` as a `FunctionTool`.
  - Returns a fixed SAP asset location (PUMP‑101) and status.

- `libs/arcgisClient.js` – an ArcGIS agent:
  - Exposes `query_power_plants_us_eia` as a `FunctionTool`.
  - Uses `arcgisHttpMcpClient` to query an ArcGIS feature layer over HTTP.
  - Summarizes power plants (name, fuel, coordinates) and returns a `firstLocation` for the map.

- `agent.js` – agent integrator:
  - Chooses between `mockClient` and `arcgisClient` using `GIS_CLIENT` env:
    - `GIS_CLIENT=mock` → SAP mock agent.
    - `GIS_CLIENT=arcgis` → ArcGIS feature-layer agent.
  - Exposes `getRunner`, `getEnsureSession`, `getAppName`, `getAgent` for routes.

**Responsibilities of an agent:**

- Understand user intent (e.g., “Where is SAP asset PUMP‑101?”, “Find power plants in Michigan…”).
- Plan which tools to use (SAP mock tool, ArcGIS tools, local DB).
- Call tools via MCP/HTTP clients and interpret results.
- Produce a human-readable answer plus structured data (e.g., `location` for map).
- Maintain conversation/session state using ADK’s `Runner` and `InMemorySessionService`.

---

### MCP Client / HTTP Client

The **MCP client** (or HTTP client) is the piece that talks to MCP or HTTP servers on behalf of agents/hosts.

Originally, this was:

- `ArcgisMcpClient` – using `child_process.spawn` and stdio to send JSON-RPC (`tools/list`, `tools/call`) to a local MCP server.

To decouple file paths and allow remote servers, the project now uses:

- `arcgisHttpMcpClient.js` – an **HTTP client**:
  - Calls an ArcGIS HTTP server at `ARCGIS_MCP_BASE_URL` (default `http://localhost:4000`).
  - Provides methods:
    - `queryPowerPlants({ state, plantNameLike, maxFeatures })`
    - `queryNpsParks(...)`
    - `queryBiaOffices(...)`
  - Returns JSON `{ where, count, features }`.

**Responsibilities of MCP/HTTP clients:**

- Connect to MCP/HTTP servers.
- Discover tools (MCP: `tools/list`) and/or call HTTP endpoints.
- Execute tools/queries with the correct arguments.
- Return results to the agent or host for further reasoning.

---

### MCP Server / ArcGIS HTTP Server

An **MCP server** exposes tools in a standard way for agents and hosts; the ArcGIS HTTP server exposes those same queries over REST for non-MCP clients.

Examples:

- `stdio-mcp-server.js` – MCP stdio server:
  - Uses `@modelcontextprotocol/sdk/server`.
  - Defines tools:
    - `query_power_plants_us_eia`
    - `query_nps_parks`
    - `query_bia_agency_offices`
  - Implements `tools/list` and `tools/call` handlers.
  - Calls ArcGIS REST feature services with SQL `where` clauses and returns JSON text.

- `http-mcp-server.js` – ArcGIS HTTP features server:
  - Uses Express and `node-fetch`.
  - Endpoints:
    - `GET /powerplants?state=Michigan&maxFeatures=5`
    - `GET /nps-parks?...`
    - `GET /bia-offices?...`
  - Returns `{ where, count, features }` for HTTP clients like `arcgisHttpMcpClient`.

**Responsibilities of MCP / HTTP servers:**

- Define tools (name, description, input schema).
- Implement each tool’s logic (ArcGIS REST query, DB query, etc.).
- Respond to `tools/list` and `tools/call` (MCP) or HTTP requests.
- Abstract external services so agents can call them via a clean interface.

---

### AI Model (LLM)

The **AI model** (LLM) is the core language and reasoning engine.

In this project:

- **Google Gemini 2.5** via ADK (`LlmAgent`) in `mockClient.js` and `arcgisClient.js`.
- The model:
  - Reads user prompts and agent instructions.
  - Decides when to call tools (provided by ADK as `FunctionTool`s).
  - Generates natural-language responses based on tool results and context.

**Responsibilities of the AI model:**

- Understand and interpret user language.
- Select tools when available (via ADK’s tool abstractions or MCP function declarations).
- Reason over tool results and produce helpful answers.
- Maintain conversational coherence over multiple turns.

---

## Backend Structure (`server/`)

Key files:

- `index.js` – lean entrypoint:
  - Loads `.env`.
  - Creates Express app.
  - Applies CORS and JSON middleware.
  - Mounts routes: `app.use("/", router)`.

- `routes.js`:
  - `POST /api/chat`:
    - Uses `getRunner`, `getEnsureSession`, `getAppName` from `agent.js`.
    - Runs the ADK agent stream.
    - Collects `finalResponseText` and tries to parse `firstLocation` from tool results.
    - Returns JSON `{ success, result, location }` where `location` is either:
      - A real plant location from ArcGIS, or
      - A fallback SAP point (PUMP‑101).
  - `GET /api/loadwells`:
    - Uses `getWells` from `dbtables.js`.
    - Returns well points from SQLite.

- `libs/mockClient.js` – SAP mock agent.
- `libs/arcgisClient.js` – ArcGIS feature-layer agent using `arcgisHttpMcpClient`.
- `agent.js` – agent integrator (`GIS_CLIENT=mock` or `arcgis`).
- `dbtables.js` – SQLite setup and `wells` table helper.

---

## Frontend Structure

- Vite + ArcGIS JS:
  - `mapviewer.js` – initializes map and handles graphics.
  - `chat.js` – chat UI, sends prompts to `/api/chat`, displays results, and triggers map updates.
  - `main.js` – coordinates map and chat components.

The typical flow:

1. User types a question in the chat UI (e.g., “Find 5 power plants in Michigan…”).
2. Frontend sends `POST /api/chat`.
3. Backend:
   - Agent interprets the question.
   - Calls `query_power_plants_us_eia` via `arcgisHttpMcpClient` → `http-mcp-server`.
   - Summarizes plants and picks a `firstLocation`.
4. Backend returns `{ result, location }`.
5. Frontend displays `result` and uses `location` to zoom the map to a plant.

---

## Running the System

### Backend (server)

```bash
cd server
npm install

# Mock SAP agent
npm run dev       # GIS_CLIENT=mock

# ArcGIS feature agent
npm run dev:arcgis   # GIS_CLIENT=arcgis
```

### ArcGIS HTTP server

```bash
cd mcp_server   # or arcgis-docs/http project
npm install
node http-mcp-server.js    # runs on http://localhost:4000 by default
```

Ensure `ARCGIS_MCP_BASE_URL` in `server/.env` matches the HTTP server URL.

---

## Agent Responsibilities Summary

- **Agent Host**: Orchestrates everything, starts MCP servers, routes tool calls, manages config/sessions.
- **Agent**: Understands user goals, plans, chooses tools (MCP/HTTP/DB), interprets results, and produces answers.
- **MCP Client / HTTP Client**: Talks to MCP/HTTP servers, discovers tools, executes them, returns results.
- **MCP Server / HTTP Server**: Exposes tools/endpoints, implements GIS/DB logic, abstracts external services.
- **AI Model (LLM)**: Understands language, decides when to use tools, reasons over results, and generates responses.

This README reflects the current state of your GIS demo and can be expanded as you add more tools (NPS parks, BIA offices), more agents, or more MCP servers.