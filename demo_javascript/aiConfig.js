/**
 * aiConfig.js
 *
 * Centralized configuration for AI query generators.
 */

import { SYSTEM_PROMPT_NIOGEMS, SYSTEM_PROMPT_USGSTURB } from './aiConfigSystemPrompt';
import { NIOGEMS_TOOL_DEFINITION, USGS_TOOL_DEFINITION } from './aiConfigToolSchemas';
import {
    OLLAMA_API_URL,
    CODELLAMA_13_MODEL,
    GEMINI_API_URL,
    GEMINI_PRO_MODEL,
    ollamaAIcallFromBrowser,
    geminiAIcallFromBrowserByToolCall ,
} from './aiApiUtils';

// --- RE-EXPORTED CONSTANTS (defined in aiApiUtils.js, re-exported here for convenience) ---
export { OLLAMA_API_URL, CODELLAMA_13_MODEL, GEMINI_API_URL, GEMINI_PRO_MODEL };

// --- CENTRALIZED API-SPECIFIC CONFIGURATION OBJECT ---
export const AI_QUERY_GENERATORS = {
    // Ollama Generators
    niogems_ollama: {
        name: 'Niogems Wells Query (Ollama)',
        model: CODELLAMA_13_MODEL,
        generator: (prompt) => ollamaAIcallFromBrowser(prompt, CODELLAMA_13_MODEL, SYSTEM_PROMPT_NIOGEMS, 'Niogems Ollama'),
        baseURL: 'https://localhost:9443/NiogemsServer/v1/wells',
    },
    usgs_ollama: {
        name: 'USGS Turbines Query (Ollama)',
        model: CODELLAMA_13_MODEL,
        generator: (prompt) => ollamaAIcallFromBrowser(prompt, CODELLAMA_13_MODEL, SYSTEM_PROMPT_USGSTURB, 'USGS Ollama'),
        baseURL: 'https://energy.usgs.gov/api/uswtdb/v1/turbines',
    },

    // Gemini Tool-Calling Generators
    niogems_gemini: {
        name: 'Niogems Wells Query (Gemini Tools)',
        model: GEMINI_PRO_MODEL,
        generator: (prompt) => geminiAIcallFromBrowserByToolCall (prompt, GEMINI_PRO_MODEL, [NIOGEMS_TOOL_DEFINITION]),
        baseURL: 'https://localhost:9443/NiogemsServer/v1/wells',
    },
    usgs_gemini: {
        name: 'USGS Turbines Query (Gemini Tools)',
        model: GEMINI_PRO_MODEL,
        generator: (prompt) => geminiAIcallFromBrowserByToolCall (prompt, GEMINI_PRO_MODEL, [USGS_TOOL_DEFINITION]),
        baseURL: 'https://energy.usgs.gov/api/uswtdb/v1/turbines',
    },
};

// --- CONVENIENCE EXPORTS FOR HOOKS/COMPONENTS ---
export const ollamaAINiogemsQuery = AI_QUERY_GENERATORS.niogems_ollama.generator;
export const ollamaAIUsGsQuery = AI_QUERY_GENERATORS.usgs_ollama.generator;

export const geminiAINiogemsQuery = AI_QUERY_GENERATORS.niogems_gemini.generator;
export const geminiAIUsGsQuery = AI_QUERY_GENERATORS.usgs_gemini.generator;