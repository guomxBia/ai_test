// arcgisStdioMcpClient.js
//C:\Users\Mingxin.Guo\Projects\test\adk\server\clients\arcgisStdioMcpClient.js
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Compute __filename and __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class arcgisStdioMcpClient {
  constructor(
    command = "node",
    // Adjust the relative path to where your MCP server file actually lives
    args = [path.join(__dirname, "..", "stdio_mcp", "stdio-mcp-server.js")]
  ) {
    this.proc = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.nextId = 1;
    this.pending = new Map();

    this.proc.stdout.on("data", (data) => {
      const lines = data.toString().split("\n").filter((l) => l.trim().length > 0);
      for (const line of lines) {
        try {
          const msg = JSON.parse(line);
          if (msg.id && this.pending.has(msg.id)) {
            const { resolve } = this.pending.get(msg.id);
            this.pending.delete(msg.id);
            resolve(msg);
          } else {
            console.log("[MCP] Unmatched message:", msg);
          }
        } catch (err) {
          console.error("[MCP] Failed to parse:", err, line);
        }
      }
    });

    this.proc.stderr.on("data", (data) => {
      console.error("[MCP Server]", data.toString());
    });

    this.proc.on("close", (code) => {
      console.log(`[MCP Server] exited with code ${code}`);
    });
    this.proc.on("error", (err) => {
     console.error("[MCP Stdio Client] Failed to spawn:", err);
    });
  }
  

  sendRequest(method, params = {}) {
    const id = this.nextId++;
    const request = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };
    const json = JSON.stringify(request) + "\n";
    this.proc.stdin.write(json);
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`MCP request timeout for id=${id}`));
        }
      }, 15000);
    });
  }

  async listTools() {
    const response = await this.sendRequest("tools/list", {});
    return response.result?.tools || response.tools || [];
  }

  async callTool(name, args) {
    const response = await this.sendRequest("tools/call", {
      name,
      arguments: args,
    });
    const payload = response.result || response;
    return payload;
  }

  close() {
    if (this.proc) {
      this.proc.kill();
    }
  }
}