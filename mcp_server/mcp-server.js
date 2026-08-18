// mcp_server/mcp-server.js
//
// MCP subsystem.
//
// Responsibilities:
// - Create MCP Server instances.
// - Register MCP protocol handlers.
// - Handle tools/list.
// - Handle tools/call.
// - Manage MCP SSE transports and sessions.
// - Expose MCP HTTP routes to the main web server.
//
// Everything specifically related to MCP belongs here.

import express from "express";

import {
  Server,
} from "@modelcontextprotocol/sdk/server/index.js";

import {
  SSEServerTransport,
} from "@modelcontextprotocol/sdk/server/sse.js";

import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
  executeTool,
  getToolDefinitions,
} from "./tool-registry.js";

/**
 * Active MCP SSE transports.
 *
 * key   = MCP session ID
 * value = SSEServerTransport
 */
const activeTransports = new Map();

/**
 * Create and configure an MCP Server instance.
 *
 * This function owns the MCP protocol layer but knows nothing about
 * ArcGIS, USGS, Census, databases, etc.
 *
 * Those responsibilities are delegated to tool-registry.js.
 */
function createMcpServer() {
  const server = new Server(
    {
      name: "federal-gis-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  /**
   * MCP: tools/list
   *
   * Return every tool currently registered with the application.
   */
  server.setRequestHandler(
    ListToolsRequestSchema,
    async () => ({
      tools: getToolDefinitions(),
    })
  );

  /**
   * MCP: tools/call
   *
   * Execute a registered MCP tool.
   */
  server.setRequestHandler(
    CallToolRequestSchema,
    async (request) => {
      const {
        name,
        arguments: args = {},
      } = request.params;

      console.log(
        `[mcp] Tool called: ${name}`
      );

      try {
        /**
         * The registry locates the appropriate module/tool handler.
         */
        const result =
          await executeTool(name, args);

        /**
         * Individual tools return ordinary JavaScript values.
         *
         * The MCP layer is responsible for translating those values
         * into the MCP content format.
         */
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                result,
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        console.error(
          `[mcp] Tool "${name}" failed:`,
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : "Unexpected tool failure.";

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: message,
              }),
            },
          ],

          isError: true,
        };
      }
    }
  );

  return server;
}

/**
 * Create the Express router containing all MCP HTTP endpoints.
 *
 * The main HTTP server only needs to mount this router.
 *
 * It does not need to understand SSEServerTransport, MCP sessions,
 * tools/list, tools/call, or any other MCP implementation details.
 */
export function createMcpRouter() {
  const router = express.Router();

  /**
   * Establish an MCP SSE connection.
   */
  router.get("/sse", async (req, res) => {
    console.log(
      "[mcp] New SSE client connection."
    );

    /**
     * Tell the MCP client that subsequent client-to-server messages
     * should be sent to /messages.
     */
    const transport =
      new SSEServerTransport(
        "/messages",
        res
      );

    /**
     * Store the transport by its generated MCP session ID.
     */
    activeTransports.set(
      transport.sessionId,
      transport
    );

    /**
     * Clean up the transport when the client disconnects.
     */
    transport.onclose = () => {
      console.log(
        `[mcp] SSE connection closed: ${transport.sessionId}`
      );

      activeTransports.delete(
        transport.sessionId
      );
    };

    /**
     * Create an MCP protocol server for this client connection.
     */
    const mcpServer = createMcpServer();

    try {
      await mcpServer.connect(transport);
    } catch (error) {
      activeTransports.delete( transport.sessionId );

      console.error("[mcp] Failed to connect SSE transport:",error);

      if (!res.headersSent) {  res.status(500).end();   }
    }
  });

  /**
   * Receive MCP messages from an existing SSE client.
   */
  router.post(
    "/messages",
    async (req, res) => {
      const sessionId = req.query.sessionId;

      if (typeof sessionId !== "string" || !sessionId ) {
        return res.status(400).json({
          error:"Missing MCP sessionId.",
        });
      }

      /**
       * Locate the SSE transport associated with this client.
       */
      const transport =
        activeTransports.get(
          sessionId
        );

      if (!transport) {
        return res.status(400).json({
          error:
            "MCP session not found or expired.",
        });
      }

      try {
        await transport.handlePostMessage(
          req,
          res,
          req.body
        );
      } catch (error) {
        console.error(
          `[mcp] Failed to process message for session ${sessionId}:`,
          error
        );

        if (!res.headersSent) {
          return res.status(500).json({
            error:
              "Failed to process MCP message.",
          });
        }
      }
    }
  );

  return router;
}