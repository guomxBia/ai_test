// src/App.jsx
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import AgentTestPage from "./pages/AgentTestPage.jsx";
import NoAgentTestPage from "./pages/NoAgentTestPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/agent_test" element={<AgentTestPage />} />
      <Route path="/no_agent_test" element={<NoAgentTestPage />} />
    </Routes>
  );
}