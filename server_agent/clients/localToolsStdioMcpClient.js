// server/clients/localToolsStdioMcpClient.js
//
// MCP stdio client for a local-only MCP server.
//
// This client starts server.js as a child process through the
// official @modelcontextprotocol/sdk transport. Use this when the MCP server
// runs on the same machine/container as this Node.js application.
//
// For a remote/shared production MCP server, use Streamable HTTP instead.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class LocalToolsStdioMcpClient {
  constructor({
    command = process.execPath,
    args = [
      path.join(__dirname, "..", "stdio_mcp", "server.js"),
    ],
    cwd = process.cwd(),
    env = process.env,
    requestTimeoutMs = 15_000,
    clientName = "local-tools-client",
    clientVersion = "1.0.0",
  } = {}) {
    this.command = command;
    this.args = args;
    this.cwd = cwd;
    this.env = env;
    this.requestTimeoutMs = requestTimeoutMs;

    this.transport = new StdioClientTransport({
      command: this.command,
      args: this.args,
      cwd: this.cwd,
      env: this.env,
      stderr: "inherit",
    });

    this.client = new Client({
      name: clientName,
      version: clientVersion,
    });

    this.connected = false;
    this.connecting = null;
    this.closing = false;
  }

  async connect() {
    if (this.connected) {
      return;
    }

    if (this.connecting) {
      return this.connecting;
    }

    if (this.closing) {
      throw new Error(
        "Cannot connect LocalToolsStdioMcpClient while it is closing."
      );
    }

    this.connecting = (async () => {
      try {
        await this.client.connect(this.transport);
        this.connected = true;
      } catch (error) {
        this.connected = false;
        throw new Error(
          `Failed to connect to local MCP server: ${this.#errorMessage(error)}`,
          { cause: error }
        );
      } finally {
        this.connecting = null;
      }
    })();

    return this.connecting;
  }

  async listTools({ timeoutMs = this.requestTimeoutMs } = {}) {
    await this.connect();

    const response = await this.#withTimeout(
      this.client.listTools(),
      timeoutMs,
      "MCP tools/list"
    );

    return response.tools ?? [];
  }

  async callTool(
    name,
    args = {},
    { timeoutMs = this.requestTimeoutMs } = {}
  ) {
    if (!name || typeof name !== "string") {
      throw new TypeError("callTool(name, args): name must be a non-empty string.");
    }

    await this.connect();

    try {
      return await this.#withTimeout(
        this.client.callTool({
          name,
          arguments: args,
        }),
        timeoutMs,
        `MCP tools/call for "${name}"`
      );
    } catch (error) {
      throw new Error(
        `MCP tool "${name}" failed: ${this.#errorMessage(error)}`,
        { cause: error }
      );
    }
  }

  async close() {
    if (this.closing) {
      return;
    }

    if (!this.connected && !this.connecting) {
      return;
    }

    this.closing = true;

    try {
      if (this.connecting) {
        try {
          await this.connecting;
        } catch {
          // The connection was unsuccessful, so there may be nothing to close.
        }
      }

      if (this.connected) {
        await this.client.close();
      }
    } finally {
      this.connected = false;
      this.connecting = null;
      this.closing = false;
    }
  }

  async [Symbol.asyncDispose]() {
    await this.close();
  }

  #withTimeout(promise, timeoutMs, operationName) {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      return promise;
    }

    let timeoutId;

    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new Error(
            `${operationName} timed out after ${timeoutMs} ms.`
          )
        );
      }, timeoutMs);
    });

    return Promise.race([promise, timeout]).finally(() => {
      clearTimeout(timeoutId);
    });
  }

  #errorMessage(error) {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}