# test-stdio-mcp.ps1
# Manual JSON-RPC smoke test for the LOCAL stdio MCP server
# (local_data/ files + local SQLite wells DB).
# NOTE: For the remote ArcGIS HTTP/SSE server, SSE can't be piped via stdin —
# use tests/mcp-smoke-test.js.

'{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node stdio-mcp-server.js

'{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"query_local_wells","arguments":{"limit":5}}}' | node stdio-mcp-server.js

'{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_local_directory","arguments":{}}}' | node stdio-mcp-server.js