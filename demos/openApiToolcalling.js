/**
 * Example of using the OpenAI API SDK (Node/Browser) with the
 * Native Tool Calling (Function Calling) feature to produce structured 
 * arguments for an downstream API endpoint.
 */


const OpenAI = require('openai');

// Initialize the official OpenAI API SDK client using environment variables
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 1. Define the tool/function your backend API exposes
const tools = [{ type: 'function', function: { 
    name: 'createTask', 
    description: 'Creates a new task with a title and priority.', 
    parameters: { type: 'object', 
                  properties: 
                              { title: { type: 'string' }, 
                                priority: { type: 'string', enum: ['high', 'low'] }
                              } 
                } 
                                            }
             }];

// 2. Call the LLM to get the structured API request (Tool Call)
// Assume 'accessToken' is the manually retrieved user token (due to null ID_TOKEN)
const userPrompt = "Make a task to buy groceries, set it to high priority";
const response = await client.chat.completions.create({ model: "gpt-4-turbo", 
                                                        messages: [{ role: "user", content: userPrompt }], 
                                                        tools: tools });


// 3. Execute the API call using the structured output
const toolCall = response.choices[0].message.tool_calls[0];
const args = JSON.parse(toolCall.function.arguments);
fetch('/api/tasks', { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}` }, body: JSON.stringify(args) });