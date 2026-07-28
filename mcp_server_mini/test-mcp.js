// test-mcp.js
import { spawn } from 'child_process';

const serverProcess = spawn('node', ['arcgis-mcp-server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let responseCount = 0;

// Test 1: List tools
const listToolsRequest = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
}) + '\n';

// Test 2: Call the tool
const callToolRequest = JSON.stringify({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
        name: "search_arcgis_docs",
        arguments: {
            query: "geometryEngine.union"
        }
    }
}) + '\n';

// Handle server output
serverProcess.stdout.on('data', (data) => {
    responseCount++;
    console.log(`\n✅ Server Response #${responseCount}:`);
    console.log(data.toString());
    
    // Close after receiving 2 responses
    if (responseCount >= 2) {
        console.log('\n🎉 All tests complete! Closing...');
        setTimeout(() => {
            serverProcess.kill();
            process.exit(0);
        }, 500);
    }
});

serverProcess.stderr.on('data', (data) => {
    console.error('📝 Server Log:', data.toString());
});

serverProcess.on('error', (err) => {
    console.error('❌ Server Error:', err);
    process.exit(1);
});

serverProcess.on('close', (code) => {
    console.log(`\n🛑 Server exited with code ${code}`);
    process.exit(code);
});

// Wait for server to start, then send requests
console.log('⏳ Waiting for server to initialize...\n');

setTimeout(() => {
    console.log('📤 Sending tools/list request...');
    serverProcess.stdin.write(listToolsRequest);
}, 1000);

setTimeout(() => {
    console.log('📤 Sending tools/call request...');
    serverProcess.stdin.write(callToolRequest);
}, 2000);

// Timeout if no response after 10 seconds
setTimeout(() => {
    if (responseCount === 0) {
        console.error('\n⏱️ Timeout: No response from server after 10 seconds');
        serverProcess.kill();
        process.exit(1);
    }
}, 10000);