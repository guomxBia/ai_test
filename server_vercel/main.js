import { getLlama, LlamaCompletion } from 'node-llama-cpp';

const llama = await getLlama({ gpu: false });

const model = await llama.loadModel({
  modelPath: './models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
});

const context = await model.createContext({ contextSize: 2048 });
const completion = new LlamaCompletion({ contextSequence: context.getSequence() });

// TinyLlama's documented chat format — built manually, no auto-detection
const prompt = `<|system|>
You are a helpful assistant.</s>
<|user|>
Say hello in one sentence.</s>
<|assistant|>
`;

const result = await completion.generateCompletion(prompt, {
  maxTokens: 100,
  stopStrings: ['</s>', '<|user|>'], // stop before it starts hallucinating a new turn
});

console.log('Response:', JSON.stringify(result));