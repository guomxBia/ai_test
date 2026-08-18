/**
 * useAIQuery.js
 */
import { useState, useCallback } from 'react';
// Import the specific generator functions you want components to access
// The Niogems one remains the default, but others are now available for import.
import { 
    ollamaAINiogemsQuery, 
   // ollamaAIUsGsQuery // <-- Now available for use in components
} from './aiConfig'; 

// --- Custom Hook: useAIQuery ---
export const useAIQuery = (generatorFn = ollamaAINiogemsQuery) => { console.log("1111111111 useAIQuery is called",generatorFn)
    const [aiQueryString, setAiQueryString] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState(null);

    const submitPrompt = useCallback(async (prompt) => {
        if (!prompt.trim()) return;

        setAiError(null);
        setIsAiLoading(true);
        setAiQueryString(''); 
        
        try {
            const queryString = await generatorFn(prompt); 
            setAiQueryString(queryString);
            return queryString; 
        } catch (err) {
            setAiError(`AI Error: ${err.message}`);
            setAiQueryString('');
            return null;
        } finally {
            setIsAiLoading(false);
        }
    }, [generatorFn]); 

    return {
        aiQueryString,
        isAiLoading,
        aiError,
        submitPrompt,
    };
};