// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppRoutes from "./core/AppRoutes.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppRoutes />
  </StrictMode>
);