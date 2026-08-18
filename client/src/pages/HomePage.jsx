// src/pages/HomePage.jsx
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="home-page">
      <h1>GIS AI Test Harness</h1>
      <p>Choose which backend to test:</p>
      <div className="home-links">
        <Link to="/agent_test">Agent Test (Google ADK + MCP client)</Link>
        <Link to="/no_agent_test">No-Agent Test (MCP client + LLM only)</Link>
      </div>
    </div>
  );
}