// src/components/ChatPanel.jsx
import { useActionState, useRef } from "react";

const initialState = { output: "" };

export default function ChatPanel({ title, sendFn, onLocationUpdate, onClear }) {
  const inputRef = useRef(null);

  async function submitAction(previousState, formData) {
    const prompt = String(formData.get("prompt") || "").trim();

    if (!prompt) {
      return { output: "Please enter a question." };
    }

    try {
      const { resultText, location } = await sendFn(prompt);

      if (location && onLocationUpdate) {
        onLocationUpdate(location);
      }

      return { output: `Response:\n${resultText}` };
    } catch (err) {
      return { output: `${previousState.output}\nError: ${err.message}` };
    }
  }

  const [state, formAction, isPending] = useActionState(submitAction, initialState);

  function handleClear() {
    if (inputRef.current) inputRef.current.value = "";
    onClear?.();
  }

  return (
    <div className="chat-panel">
      <h3>{title}</h3>

      <form action={formAction}>
        <textarea
          ref={inputRef}
          name="prompt"
          placeholder="Ask a question, e.g. 'Where is SAP asset PUMP-101 located and what is its status?'"
          disabled={isPending}
        />
        <div className="chat-buttons">
          <button type="submit" disabled={isPending}>
            {isPending ? "Sending…" : "Send"}
          </button>
          <button type="button" onClick={handleClear} disabled={isPending}>
            Clear
          </button>
        </div>
      </form>

      <textarea
        readOnly
        value={state.output}
        placeholder="AI responses will appear here..."
      />
    </div>
  );
}