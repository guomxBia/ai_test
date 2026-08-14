/**
 * @file generateQueryString.js
 * @description Demonstrates natural language-to-API query string translation using the official 
 * OpenAI Node.js SDK (v4+).
 * 
 * Technical Concepts Used:
 * - OpenAI Chat Completions API (`client.chat.completions.create`)
 * - System vs. User Prompt Engineering (enforcing clean query output without extra prose)
 * - Low Temperature Determinism (`temperature: 0` for consistent structured output)
 */

const OpenAI = require('openai');

// Initialize the official OpenAI API SDK client using environment variables
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Translates a natural language user request into a formatted API URL query string.
 * 
 * @param {string} prompt - The natural language request from the user.
 * @returns {Promise<string>} The generated URL query string (e.g., "min_price=10&max_price=50&tag=electronics").
 */
async function generateQueryString(prompt) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an API query generator. Convert user requests strictly into a valid URL query string. Return ONLY the key-value string without markdown, code fences, or explanatory prose.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0, // Reduces randomness for predictable string formatting
  });

  // Extract content from the primary choice object in the Chat Completion payload
  return response.choices[0].message.content.trim();
}

/**
 * Main execution driver demonstrating workflow execution.
 */
async function main() {
  const userRequest = "I need to search for products priced between $10 and $50 with the tag 'electronics'.";
  const aiPrompt = `Generate an API query string for the following request: ${userRequest}`;

  try {
    const queryString = await generateQueryString(aiPrompt);
    console.log("Generated query string:", queryString);

    // Example integration:
    // const apiUrl = `https://api.example.com/products?${queryString}`;
    // const apiResponse = await fetch(apiUrl); 
    // const data = await apiResponse.json();
    // console.log(data);
  } catch (error) {
    console.error("Failed to generate query string:", error.message);
  }
}

main();