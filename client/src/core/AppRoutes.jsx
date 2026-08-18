// src/core/AppRoutes.jsx
import { Routes, Route, BrowserRouter } from "react-router-dom";
import Layout from "./Layout.jsx";
import HomePage from "../pages/HomePage.jsx";
import AgentTestPage from "../pages/AgentTestPage.jsx";
import NoAgentTestPage from "../pages/NoAgentTestPage.jsx";
import NotFound from "../pages/NotFound.jsx";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="agent_test" element={<AgentTestPage />} />
          <Route path="no_agent_test" element={<NoAgentTestPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;