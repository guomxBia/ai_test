import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 7070,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/config/setupTests.js",
  }
});