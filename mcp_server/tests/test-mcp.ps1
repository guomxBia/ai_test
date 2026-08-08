'{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node arcgis-mcp-server.js

'{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_arcgis_docs","arguments":{"query":"geometryEngine.union"}}}' | node arcgis-mcp-server.js