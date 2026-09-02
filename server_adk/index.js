import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { z } from 'zod';
// Note: Import paths might vary slightly based on the exact ADK version release
import { Agent, Tool, A2UI } from '@google/adk'; 

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------
// 1. MOCK ENTERPRISE DATA (Replacing SQLite for the demo)
// ---------------------------------------------------------
const mockEmployeeDatabase = [
  { id: 'E101', name: 'Alice Smith', department: 'Engineering', status: 'Active' },
  { id: 'E102', name: 'Bob Jones', department: 'Sales', status: 'On Leave' }
];

// ---------------------------------------------------------
// 2. DEFINE A TOOL (ADK handles the execution loop automatically)
// ---------------------------------------------------------
const lookupEmployeeTool = new Tool({
  name: 'lookup_employee',
  description: 'Search for an employee by their name to get their details.',
  schema: z.object({
    employeeName: z.string().describe('The first or last name of the employee')
  }),
  // The ADK automatically runs this function when the LLM decides it needs it
  execute: async ({ employeeName }) => {
    console.log(`[Tool Executed] Looking up: ${employeeName}`);
    const found = mockEmployeeDatabase.find(e => 
      e.name.toLowerCase().includes(employeeName.toLowerCase())
    );
    return found ? found : { error: 'Employee not found' };
  }
});

// ---------------------------------------------------------
// 3. INITIALIZE THE ADK AGENT
// ---------------------------------------------------------
const enterpriseAgent = new Agent({
  name: 'HR_Assistant',
  instructions: `
    You are an internal HR assistant. 
    Always use the 'lookup_employee' tool to find employee information.
    When you find an employee, DO NOT just output markdown text. 
    Instead, use the A2UI builder to return a visual Profile Card.
  `,
  tools: [lookupEmployeeTool],
});

// ---------------------------------------------------------
// 4. EXPOSE ENDPOINT FOR GEMINI ENTERPRISE
// ---------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;
    console.log(`[Incoming Request] User says: "${userMessage}"`);

    // The ADK agent handles routing to the LLM, triggering the tool, and parsing the response
    const response = await enterpriseAgent.chat(userMessage);

    // DEMONSTRATING A2UI (Rich UI Rendering):
    // If the agent successfully fetched data, we format it as a rich UI card
    // instead of plain text, which renders natively in the Gemini chat window.
    if (response.toolResults?.lookup_employee) {
       const emp = response.toolResults.lookup_employee;
       
       const richUICard = A2UI.Card({
         title: `Employee Profile: ${emp.name}`,
         subtitle: `ID: ${emp.id}`,
         sections: [
           A2UI.KeyValue({ key: 'Department', value: emp.department }),
           A2UI.KeyValue({ key: 'Status', value: emp.status })
         ]
       });

       return res.json({
         text: "Here is the employee information you requested:",
         ui: richUICard // ADK sends this back to be rendered visually
       });
    }

    // Fallback standard text response
    res.json({ text: response.text });

  } catch (error) {
    console.error('Agent Error:', error);
    res.status(500).json({ error: 'Internal Agent Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 ADK Demo Agent running on port ${PORT}`);
  console.log(`Try sending a POST request to http://localhost:${PORT}/api/chat`);
  console.log(`with JSON: { "message": "Can you look up Alice?" }`);
});
