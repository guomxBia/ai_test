// src/components/NoAgentQueryPanel.jsx
//
// Panel for the no-agent test page. Matches server/routes/queryRoutes.js
// exactly: provider select (gemini/ollama), target select (required only
// for ollama), a prompt field, and a structured result (tool name + args
// + record list), NOT a chat transcript.

import { useActionState, useRef, useState } from "react";
import {
  queryNoAgentServer,
  extractRecords,
  findFirstLocation,
} from "../api/noAgentClient.js";
import ResultRecordList from "./ResultRecordList.jsx";

const initialState = {
  submitted: false,
  toolName: null,
  args: null,
  records: [],
  text: null,
  error: null,
};

export default function NoAgentQueryPanel({ title, onLocationUpdate, onClear }) {
  const [provider, setProvider] = useState("gemini");
  const [target, setTarget] = useState("niogems");
  const promptRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognizerRef = useRef(null);

  async function submitAction(_prevState, formData) {
    const prompt = String(formData.get("prompt") || "").trim();

    if (!prompt) {
      return { ...initialState, error: "Please enter a prompt." };
    }

    try {
      const payload = await queryNoAgentServer({ prompt, provider, target });

      if (payload.type === "text") {
        return { ...initialState, submitted: true, text: payload.text };
      }

      const records = extractRecords(payload.data);
      const location = findFirstLocation(records);
      if (location) onLocationUpdate?.(location);

      return {
        ...initialState,
        submitted: true,
        toolName: payload.toolName,
        args: payload.args,
        records,
      };
    } catch (err) {
      return { ...initialState, submitted: true, error: err.message };
    }
  }

  const [state, formAction, isPending] = useActionState(submitAction, initialState);

  function handleClear() {
    if (promptRef.current) promptRef.current.value = "";
    onClear?.();
  }

  function toggleMic() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isRecording) {
      recognizerRef.current?.stop();
      return;
    }

    const recognizer = new SpeechRecognition();
    recognizer.continuous = false;
    recognizer.interimResults = true;
    recognizer.lang = "en-US";

    recognizer.addEventListener("result", (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (promptRef.current) promptRef.current.value = transcript;
    });
    recognizer.addEventListener("end", () => setIsRecording(false));
    recognizer.addEventListener("error", () => setIsRecording(false));

    recognizerRef.current = recognizer;
    if (promptRef.current) promptRef.current.value = "";
    setIsRecording(true);
    recognizer.start();
  }

  const micSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <div className="query-panel">
      <h3>{title}</h3>

      <form action={formAction}>
        <div className="controls-row">
          <div className="field">
            <label htmlFor="provider">Provider</label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              disabled={isPending}
            >
              <option value="gemini">Gemini (tool-calling)</option>
              <option value="ollama">Ollama (text prompt)</option>
            </select>
          </div>

          {provider === "ollama" && (
            <div className="field">
              <label htmlFor="target">Target API</label>
              <select
                id="target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                disabled={isPending}
              >
                <option value="niogems">Niogems Wells</option>
                <option value="usgs">USGS Turbines</option>
              </select>
            </div>
          )}
        </div>

        <div className="prompt-row">
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="prompt">Prompt</label>
            <textarea
              ref={promptRef}
              id="prompt"
              name="prompt"
              placeholder="e.g. show me active wells operated by Enbridge"
              disabled={isPending}
            />
          </div>
          {micSupported && (
            <button
              type="button"
              className={`mic${isRecording ? " recording" : ""}`}
              title="Voice input"
              onClick={toggleMic}
              disabled={isPending}
            >
              🎤
            </button>
          )}
          <button type="submit" disabled={isPending}>
            {isPending ? "Submitting…" : "Submit"}
          </button>
          <button type="button" onClick={handleClear} disabled={isPending}>
            Clear
          </button>
        </div>
      </form>

      <div className="status-row">
        {isPending && (
          <>
            <span className="spinner" /> Fetching data…
          </>
        )}
      </div>

      {state.toolName && (
        <div className="meta-line">
          tool: {state.toolName} args: {JSON.stringify(state.args)}
        </div>
      )}

      {state.text && (
        <div className="meta-line">
          Model responded with text instead of a tool call: "{state.text}"
        </div>
      )}

      {state.error && <div className="alert">{state.error}</div>}

      <ResultRecordList records={state.records} hasSubmitted={state.submitted} />
    </div>
  );
}