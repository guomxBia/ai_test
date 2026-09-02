// index.js
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

const result = streamText({
  model: google('gemini-2.0-flash'), // or another Gemini model
  prompt: 'Hello!',
});