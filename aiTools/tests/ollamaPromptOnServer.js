/**
 * ollamaAgentPrompt.js
 * an example of an AI Agent implementation that uses Prompt Engineering to guide a model
 * it only run on the Server, not from Browser
 */
import { Ollama } from 'ollama';

// Initialize the Ollama client (it defaults to http://127.0.0.1:11434)
const ollama = new Ollama();

async function getCodeLlamaResponse(prompt) {
  try {
    const stream = await ollama.chat({
      // Use your specific model tag
      model: 'deepseek-coder:6.7b-instruct-q4_K_M', 
      messages: [
       {
          // **UPDATED SYSTEM PROMPT CONTENT HERE**
          role: 'system',
          content: `You are a highly-skilled Frontend Software Architect specializing in modern React development using pure JavaScript (ES6+), explicitly excluding TypeScript. Your primary goal is to provide fast, efficient solutions for creating new functional components. For every user request, you must adhere to the following strict format and constraints:

                    1.  **Strategy:** Provide a concise, clear architectural strategy (max 3 sentences).
                    2.  **Implementation:** Provide a single, complete, and correct React Functional Component using JavaScript.
                    3.  **Unit Test:** Immediately follow the component with a corresponding Jest unit test file using @testing-library/react.
                    4.  **Accessibility:** Ensure all generated component code is highly compliant with WCAG/ARIA standards (web accessibility).
                    5.  **Focus:** Limit all library suggestions and code to React, core JavaScript, and widely-adopted frontend testing/utility libraries only. Do not use any backend or non-JavaScript-specific code.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      stream: true, // Crucial for real-time output
    });

    // Process the stream as it comes in
    for await (const chunk of stream) {
      // Print or send the tokens to the frontend in real-time
      process.stdout.write(chunk.message.content); 
    }
    
    // Add a final newline for clean output
    console.log(); 

  } catch (error) {
    console.error("An error occurred during Ollama generation:", error);
  }
}

// Your slow-running query
const userQuery = "solve the problem like \"query backend api\" to use \"prompt engineering\" or \"agent\" or \"other better option\". I use React and Javascript not typescript, recommend library? example please";

getCodeLlamaResponse(userQuery);