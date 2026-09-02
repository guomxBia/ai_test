import { GoogleGenAI } from '@google/genai';
import 'dotenv/config'; // Automatically loads your API key from .env file

// Automatically picks up process.env.GEMINI_API_KEY
const ai = new GoogleGenAI();

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Tell me a short, 2-sentence joke about programming.',
    });

    console.log('🤖 Gemini Response:\n', response.text);
  } catch (error) {
    console.error('Error calling Gemini:', error);
  }
}

run();
