# GIS AI Agent Demo — ArcGIS + Google ADK + MCP

This project is a GIS demo application that combines:

- A Vite + ArcGIS JavaScript frontend for interactive maps (`client/`)
- A Node.js + Express backend that runs Google ADK agents (`server/`)
- Two MCP servers using different transports:
  - **stdio** for local-only tools such as sandboxed files and a local SQLite database
  - **HTTP/SSE** for remote ArcGIS feature-layer tools
- A SQLite database containing local wells data

It is a small agentic GIS system for exploring how AI agents, MCP transports, map services, and local data sources work together.

> **Transport rule:** stdio is for a local MCP server spawned by the backend process. HTTP/SSE is for the separately running remote ArcGIS MCP server.

## Architecture

The system has four main pieces:

1. **Frontend (`client/`)** — ArcGIS map and chat UI
2. **Backend / Agent Host (`server/`)** — Express API, ADK agents, agent selection, local SQLite access, and local MCP client
3. **Remote MCP Server (`server_mcp/`)** — ArcGIS feature-layer tools exposed over HTTP/SSE
4. **Local MCP Server (`server/stdio_mcp/`)** — local-only file and SQLite tools exposed over stdio

```text
client/
  Vite + ArcGIS JS map and chat UI
        |
        | POST /api/chat
        v
server/
  Express API + Google ADK agents
        |
        |-----------------------------|
        |                             |
        v                             v
Local stdio MCP client          Remote HTTP/SSE MCP client
spawns local child process      connects to localhost:6060
        |                             |
        v                             v
server/stdio_mcp/              server_mcp/
local files + SQLite           ArcGIS feature layers
```

Repository layout:

```text
client/
  index.html          # Resizable map/chat layout
  main.js             # Frontend startup and wiring
  mapviewer.js        # ArcGIS MapView and map marker helpers
  chat.js             # Chat request/response handling
  config.js           # API_BASE_URL

server/
  index.js            # Express entrypoint and graceful shutdown
  routes.js           # API routes
  config.js           # ACTIVE_CLIENT, ports, backend configuration
  agents/             # Google ADK agent modules
  clients/            # MCP client wrappers
  db/                 # SQLite wells helper
  stdio_mcp/          # Local-only stdio MCP server and tests

server_mcp/
  http-mcp-server.js  # Remote ArcGIS MCP server over HTTP/SSE
  arcgis/             # ArcGIS tool registration and implementations
  tests/              # HTTP/SSE MCP smoke-test client and scripts
```

## Agent Modes

`ACTIVE_CLIENT` in `server/config.js` selects the active agent.

| `ACTIVE_CLIENT` value | Agent module | Available tools |
|---|---|---|
| `"mock"` | `agents/sapMockAgent.js` | `get_sap_asset_location` with a hardcoded `PUMP-101` location |
| `"arcgis-http"` | `agents/arcgisHttpAgent.js` | Remote ArcGIS tool: `query_power_plants_us_eia` |
| `"local-tools"` | `agents/localToolsAgent.js` | `read_local_file`, `list_local_directory`, `get_server_time`, `query_local_wells` |
| `"combined"` | `agents/combinedAgent.js` | Tools from both local stdio and remote HTTP/SSE MCP servers |
| `"arcgis-stdio"` | Experimental/commented mode | Not part of the normal setup |

`server/agents/agentRegistry.js` lazy-loads and caches the active agent module. It exposes `getRunner`, `getEnsureSession`, `getAppName`, and `getAgent` to `routes.js`.

The **combined** agent is the main demonstration: one Gemini-driven `LlmAgent` can choose from tools served through two different MCP transports. For example:

- “Show power plants in Michigan” → remote ArcGIS HTTP/SSE tool
- “What wells do we have locally?” → local stdio SQLite tool
- “List local files” → local stdio filesystem tool

## Remote ArcGIS MCP Server

`server_mcp/http-mcp-server.js` runs an Express-based MCP server over HTTP/SSE. It is not a set of ordinary REST GET endpoints.

The remote server exposes:

- `GET /sse` — event stream connection
- `POST /messages` — MCP request messages

It registers these ArcGIS tools:

| Tool | Description |
|---|---|
| `query_power_plants_us_eia` | Queries the EIA power-plants layer, optionally filtering by state and partial plant name |
| `query_nps_parks` | Queries National Park Service units, optionally filtering by unit name |
| `query_bia_agency_offices` | Queries BIA Agency/Regional Offices, optionally filtering by agency name and region |

Each tool builds a SQL-style `WHERE` clause, calls the relevant ArcGIS REST `/query` endpoint, and returns JSON shaped like:

```json
{
  "where": "...",
  "count": 5,
  "features": []
}
```

Feature-layer URLs are configured in `server_mcp/config.js`:

- `POWER_PLANTS_URL`
- `NPS_PARKS_URL`
- `BIA_OFFICES_URL`

The remote MCP server defaults to `http://localhost:6060`. The backend refers to it through `HTTP_MCP_BASE_URL`.

### Remote MCP tests

`server_mcp/tests/` includes:

- `FederalGisHttpMcpClient.js` — test-only HTTP/SSE client wrapper
- A smoke-test script such as `gis-mcp-client.js` or `mcp-smoke-test.js`

The smoke test connects, lists the remote tools, and calls `query_power_plants_us_eia` with a sample state and limit.

## Local Stdio MCP Server

`server/stdio_mcp/server.js` is a local-only MCP server. The backend starts it as a child process through the official MCP SDK’s `StdioClientTransport`.

There is no HTTP endpoint and no network hop for this server. It communicates with the backend through JSON-RPC over the child process’s stdin/stdout.

### Local tools

| Tool | Description |
|---|---|
| `read_local_file` | Reads a UTF-8 file from the sandboxed `server/stdio_mcp/local_data/` folder |
| `list_local_directory` | Lists the direct contents of the `local_data/` sandbox |
| `get_server_time` | Returns server date/time; useful for testing the MCP connection |
| `query_local_wells` | Returns a bounded list of wells from the local SQLite database |

### Security and limits

The stdio server includes several safeguards:

- File access is restricted to `server/stdio_mcp/local_data/`
- Absolute paths and directory traversal are rejected
- Canonical path checks help prevent symlinks from escaping the sandbox
- `query_local_wells` validates `limit` as an integer from 1 to 100
- Directory listings return only direct entries
- The server writes logs to `stderr` with `console.error()`; `stdout` is reserved for MCP protocol traffic

### Shared stdio client

`server/clients/localToolsClient.js` exports one shared client instance:

```js
import { LocalToolsStdioMcpClient } from "./LocalToolsStdioMcpClient.js";

export const localToolsClient = new LocalToolsStdioMcpClient({
  requestTimeoutMs: 20_000,
});
```

This avoids spawning a new Node child process for every request. The local server’s current tools are read-only and do not maintain per-user state, so they can be used through a shared client.

Do **not** close `localToolsClient` inside individual Express routes. It is closed once when the backend receives `SIGTERM` or `SIGINT` during graceful shutdown.

### Local stdio tests

`server/stdio_mcp/` includes:

- `test-stdio-mcp.ps1` — sends raw JSON-RPC `tools/list` and `tools/call` requests to the server through stdin
- `test-mcp.yaml` — Continue IDE configuration for registering both the local stdio server and the remote HTTP/SSE server

The Continue configuration starts `local-gis-tools` locally with stdio. It connects to `federal-gis-http` at `http://localhost:6060/sse`; the remote HTTP/SSE server must already be running.

## Backend

### `server/index.js`

The Express entrypoint:

- Loads environment variables from `.env`
- Enables CORS and JSON body parsing
- Mounts `routes.js`
- Starts the backend on the configured port, normally `8080`
- Handles `SIGTERM` and `SIGINT` gracefully
- Stops the HTTP server first, then closes `localToolsClient`, which shuts down its child MCP process

### `server/routes.js`

| Endpoint | Purpose |
|---|---|
| `POST /api/chat` | Runs the active ADK agent against the user prompt |
| `GET /api/loadwells` | Returns all wells from the local SQLite database |
| `GET /api/test-powerplants` | Direct HTTP/SSE ArcGIS MCP smoke test, bypassing the agent |
| `GET /api/test-local-wells` | Direct stdio `query_local_wells` smoke test, bypassing the agent |
| `GET /api/test-local-files` | Direct stdio `list_local_directory` smoke test, bypassing the agent |

`POST /api/chat` collects streamed ADK text and attempts to extract a `firstLocation` from tool results. It checks:

- JSON surfaced in `part.text`
- `part.data.firstLocation`
- `part.functionResponse.response.firstLocation`

If no location is returned, it uses a default `PUMP-101` location for the map.

### MCP clients

The backend has two different MCP clients:

| Client | Transport | Purpose |
|---|---|---|
| `FederalGisHttpMcpClient.js` | HTTP/SSE | Connects to the remote ArcGIS MCP server |
| `LocalToolsStdioMcpClient.js` | stdio | Spawns and communicates with the local stdio MCP server |

`FederalGisHttpMcpClient.js` uses the official MCP SDK `Client` and `SSEClientTransport`. It exposes `connect`, `listTools`, `callTool`, and `close`, plus helper methods:

- `queryPowerPlants`
- `queryNpsParks`
- `queryBiaOffices`

The production client calls the correct BIA tool name: `query_bia_agency_offices`.

`LocalToolsStdioMcpClient.js` uses the official MCP SDK `Client` and `StdioClientTransport`. It owns the local child-process lifecycle and exposes:

- `connect`
- `listTools`
- `callTool`
- `close`

### SQLite wells data

`server/db/dbtables.js` contains SQLite setup and the `getWells()` helper used by:

- `GET /api/loadwells`
- The `query_local_wells` local MCP tool

## Frontend

The frontend uses Vite and `@arcgis/core`.

| File | Purpose |
|---|---|
| `index.html` | Resizable split layout: ArcGIS map on the left and chat on the right |
| `mapviewer.js` | Creates the `MapView`, adds markers, zooms to returned locations, and clears graphics |
| `chat.js` | Sends prompts to `POST {API_BASE_URL}/api/chat`, displays text, and forwards locations to the map |
| `main.js` | Wires map and chat modules together on page load |
| `config.js` | Defines `API_BASE_URL`, normally `http://localhost:8080` |

Application flow:

```text
User prompt
  -> frontend POST /api/chat
  -> backend active ADK agent
  -> local stdio tool and/or remote HTTP/SSE ArcGIS tool
  -> backend response: { result, location }
  -> frontend displays text and updates the map
```

## Running the System

### 1. Start the remote ArcGIS MCP server

```bash
cd server_mcp
npm install
node http-mcp-server.js
```

The server normally runs at `http://localhost:6060`.

It must be running before using either:

```js
ACTIVE_CLIENT = "arcgis-http"
```

or:

```js
ACTIVE_CLIENT = "combined"
```

### 2. Start the backend agent host

```bash
cd server
npm install
```

Set `ACTIVE_CLIENT` in `server/config.js` to one of:

```js
"mock"
"arcgis-http"
"local-tools"
"combined"
```

Then run:

```bash
npm start
```

For development with automatic restart:

```bash
npm run dev
```

The backend normally runs at `http://localhost:8080`.

When local tools are used, the backend starts `server/stdio_mcp/server.js` automatically through the shared local stdio client. Do not manually start the local stdio server for normal backend use.

### 3. Start the frontend

```bash
cd client
npm install
npm run dev
```

### 4. Manual and IDE testing

Test the local stdio MCP server with raw JSON-RPC:

```powershell
cd server/stdio_mcp
./test-stdio-mcp.ps1
```

Test the remote HTTP/SSE MCP server:

```bash
cd server_mcp/tests
node gis-mcp-client.js
```

If the smoke-test script has been renamed, run its current equivalent, for example:

```bash
node mcp-smoke-test.js
```

### 5. Start all projects in Windows Terminal

From the repository root:

```powershell
./startDev.ps1
```

`startDev.ps1` opens three tabs—`client`, `server`, and `server_mcp`—and runs `npm run dev` in each project.

## Configuration Notes

- `server/config.js` contains the backend `PORT`, `ACTIVE_CLIENT`, `HTTP_MCP_BASE_URL`, and related configuration.
- `server_mcp/config.js` contains the remote MCP server port and ArcGIS feature-layer URLs.
- `client/config.js` contains the frontend `API_BASE_URL`.
- The default/fallback agent for an unrecognized `ACTIVE_CLIENT` value is `agents/sapMockAgent.js`, which is useful when developing the UI without either MCP server.

## Development Notes

- `server_mcp/package.json`
  - `npm run dev` uses `node --watch http-mcp-server.js`
  - `npm start` uses `node http-mcp-server.js`
- Do not write normal logs to stdout in `server.js`; stdout carries MCP protocol messages.
- Do not close the shared `localToolsClient` from routes. Close it only during backend shutdown.
- For high-volume, multi-host, or externally exposed deployments, move shared MCP capabilities to an authenticated network transport such as Streamable HTTP instead of relying on a local stdio child process.

## License

Demo/learning project. Add your preferred license before distribution.
