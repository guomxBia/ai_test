import React, { useState } from 'react';
// IMPORT THE NEW HOOKS - Assuming they are correctly aliased in the environment
import { 
    ollamaAINiogemsQuery, 
    ollamaAIUsGsQuery, // <-- Now available for use in components
    geminiAINiogemsQuery,
    geminiAIUsGsQuery
} from '../aiTools/aiConfig';
import { useAIQuery } from '../aiTools/useAIQuery'; 

import {API_FETCH_CONFIGS} from "../aiTools/apiConfig"
import {useDataQuery} from '../aiTools/useDataQuery';


// Using explicit .jsx extension for local component import resolution
import VoiceToText from './VoiceToText'; 
import {
  CalciteList,
  CalciteListItem,
  CalcitePanel,
  CalciteLoader,
  CalciteAlert,
  CalciteIcon,
  CalciteLabel
} from '@esri/calcite-components-react';

import "@esri/calcite-components/dist/components/calcite-panel";
import "@esri/calcite-components/dist/components/calcite-input";
import "@esri/calcite-components/dist/components/calcite-button";
import "@esri/calcite-components/dist/components/calcite-list";
import "@esri/calcite-components/dist/components/calcite-list-item";
import "@esri/calcite-components/dist/components/calcite-loader";
import "@esri/calcite-components/dist/components/calcite-alert";
import "@esri/calcite-components/dist/components/calcite-icon";
import "@esri/calcite-components/dist/components/calcite-label";
// IMPORTANT FIX: Removing the redundant web component definition imports (e.g., "@esri/calcite-components/dist/components/calcite-panel")
// as these cause module resolution errors in some build environments, relying solely on the React wrappers.

// --- Main Visual Component ---
export const QueryStringByAI = () => {  // console.log("QuerySTringbyAI");
  const [userInput, setUserInput] = useState('');
  // 💡 1. Use the AI Query Generator Hook
  const { 
    aiQueryString, 
    isAiLoading, 
    aiError, 
    submitPrompt // The function that generates the AI query
  } = useAIQuery(geminiAIUsGsQuery);
   if(!!aiQueryString)
   console.log("2222222 result from useAIQuery in caller QueryStringByAI",aiQueryString)
  // 💡 2. Use the Wells Query Hook
  const { 
    data,
    isLoading, 
    error, 
    isFetching 
  } = useDataQuery(aiQueryString,API_FETCH_CONFIGS.usgs);
  
  const totalLoading = isAiLoading || isLoading || isFetching;
  
  // --- Render Logic ---
  if (aiQueryString || aiError || isAiLoading)
  {
    const message=aiQueryString?aiQueryString:(aiError?aiError:isAiLoading);
    //console.log("4444443333Status:",message);
  }
  if(!!data)
 console.log("444444 data from useDataQuery in caller QueryStringByAI",data);

  return (
    <CalcitePanel style={{ maxWidth: '1000px',minWidth:'400px',width:'90vw', margin: '20px auto' }}>
      
      {/* 💡 Integrated Voice-to-Text Input (now includes the submission button and all necessary logic) */}
      <VoiceToText
        value={userInput}
        onTextChange={setUserInput} // Updates userInput state when typing/clearing
        onSubmit={submitPrompt} // VoiceToText calls submitPrompt(userInput) on button click or Enter key
        disabled={totalLoading}
        loading={isAiLoading}
      />

      {/* Loading and Error States */}
      {totalLoading && <CalciteLoader active label="Fetching Data..." scale="m" />}
      
    
      {/* Query Results List */}
      <CalciteLabel style={{ marginTop: '1rem' }}>
        Query Results ({data?.totalItems ?? 0} Total)
      </CalciteLabel>
      
      {data?.length === 0 && !totalLoading && (
        <p>No wells found for the generated query.</p>
      )}

      <CalciteList style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {/* 1. Map over the data array */}
                  {data?.map((item, index) => (
                      <CalciteListItem 
                          // 💡 Universal Fix: Always use the unique array index as the key.
                          key={index} 
                          
                          // Set a generic, universal label based on the position
                          label={`Record #${index + 1}`} 
                          
                          // Set a generic description by attempting to find the first non-null string value
                          description={
                              Object.values(item)
                                    .find(val => typeof val === 'string' && val.length > 0) 
                                    || 'Details available below'
                          }
                      >
                          {/* 2. Dynamically generate the details slot */}
                          <div slot="actions-end" style={{ fontSize: '0.85em', color: 'var(--calcite-color-text-3)' }}>
                              {/* Loop over ALL keys of the current item object */}
                              {Object.keys(item).map((key) => (
                                  <div key={key} style={{ padding: '2px 0' }}>
                                      {/* Format the column name for readability */}
                                      <strong style={{ textTransform: 'capitalize' }}>
                                          {key.replace(/_/g, ' ')}
                                      </strong>
                                      {/* Display the value (safely converted to a string) */}
                                      : {String(item[key])}
                                  </div>
                              ))}
                          </div>
                      </CalciteListItem>
                  ))}
      </CalciteList>
        {error && (
        <CalciteAlert 
          icon="exclamation-mark-triangle-f" 
          open 
          kind="danger" 
          title="API Fetch Error"
          label="API Fetch Error"
        >
          {error.message}
        </CalciteAlert>
      )}
      {aiError && (
        <CalciteAlert 
          icon="exclamation-mark-triangle-f" 
          open 
          kind="danger" 
          title="AI Generation Error"
          label="AI Generation Error"
        >
          {aiError}
        </CalciteAlert>
      )}

    </CalcitePanel>
  );
};

export default QueryStringByAI;
