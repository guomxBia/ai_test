/**
 * aiApiUtils.js
 *
 * Contains utility functions for making AI API calls and processing their results.
 */
import axios from "axios";

// --- CONFIGURATION CONSTANTS ---
export const OLLAMA_API_URL = 'http://localhost:11434/api';
export const CODELLAMA_13_MODEL = 'codellama:13b-instruct-q4_K_M';

export const GEMINI_API_URL = 'https://localhost:8443/GeminiProxy';
export const GEMINI_PRO_MODEL = 'gemini-2.5-flash';

// --- AXIOS INSTANCES ---
const ollamaAxiosInstance = axios.create({
    baseURL: OLLAMA_API_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 60000,
});

const geminiAxiosInstance = axios.create({
    baseURL: GEMINI_API_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 60000,
});

// --- DETERMINISTIC URL BUILDER ---
const executeMcpTool = (toolName, args) => {
    // 1. Niogems Wells API
    if (toolName === 'query_niogems_wells') {
        const page = args.page || 1;
        const pageSize = args.pageSize || 10;

        const params = new URLSearchParams();
        if (args.leaseName) params.append('leaseName', args.leaseName);
        if (args.operatorName) params.append('operatorName', args.operatorName);
        if (args.status) params.append('status', args.status);
        if (args.fieldName) params.append('fieldName', args.fieldName);
        if (args.wellNumber) params.append('wellNumber', args.wellNumber);

        const queryString = params.toString();
        return `/page/${page}/pagesize/${pageSize}${queryString ? '?' + queryString : ''}`;
    }

    // 2. USGS Wind Turbines API (PostgREST syntax)
    if (toolName === 'query_usgs_turbines') {
        const limit = args.limit || 10;
        const offset = args.offset || 0;

        const params = new URLSearchParams();

        if (args.t_state) params.append('t_state', `eq.${args.t_state.toUpperCase()}`);
        if (args.t_county) params.append('t_county', `eq.${args.t_county}`);
        if (args.t_manu) params.append('t_manu', `ilike.*${args.t_manu}*`);

        if (args.t_cap) {
            const op = args.cap_operator || 'eq';
            params.append('t_cap', `${op}.${args.t_cap}`);
        }
        if (args.t_hh) {
            const op = args.hh_operator || 'eq';
            params.append('t_hh', `${op}.${args.t_hh}`);
        }
        if (args.p_year) params.append('p_year', `eq.${args.p_year}`);
        if (args.sort_order) params.append('order', args.sort_order);

        params.append('limit', limit);
        params.append('offset', offset);

        return `?${params.toString()}`;
    }

    throw new Error(`Unknown tool name: ${toolName}`);
};

// --- OLLAMA UTILITY (Text-Based Prompting) ---
export const ollamaAIcallFromBrowser = async (prompt, model, systemPrompt, name) => {
    console.log(`[Ollama Call] ${name} using ${model}`);
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
    ];

    try {
        const response = await ollamaAxiosInstance.post("/chat", { model, messages, stream: false });
        const rawResponse = response.data.message.content.trim();
        let finalQueryString = rawResponse.replace(/^['"]|['"]$/g, '');

        if (!finalQueryString.startsWith('/') && !finalQueryString.startsWith('?')) {
            finalQueryString = `/${finalQueryString}`;
        }
        return finalQueryString;
    } catch (error) {
        console.error('Ollama API Error:', error.response?.data || error.message);
        throw new Error(`Ollama execution failed: ${error.message}`);
    }
};

// --- GEMINI UTILITY (Function Calling / Tool-Based) ---
export const geminiAIcallFromBrowserByMcpTool = async (prompt, model, tools = []) => {
    const requestPayload = {
        model: model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ functionDeclarations: tools }]
    };

    try {
        const response = await geminiAxiosInstance.post('', requestPayload);
        const candidate = response.data.candidates[0];
        const part = candidate?.content?.parts?.[0];

        // Did Gemini choose a tool?
        if (part?.functionCall) {
            const { name, args } = part.functionCall;
            console.log(`🎯 Gemini triggered Tool [${name}] with args:`, args);
            return executeMcpTool(name, args);
        }

        // Fallback if Gemini responded with plain text
        return part?.text?.trim() || '';

    } catch (error) {
        console.error('Gemini Tool Error:', error.response?.data || error.message);
        throw new Error(`Gemini execution failed: ${error.message}`);
    }
};