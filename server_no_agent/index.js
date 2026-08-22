import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "./config.js";
import queryRoutes from "./routes/queryRoutes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use(queryRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", defaultProvider: config.llm.defaultProvider });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log("=======================================================");
  console.log(`AI query server running on port ${config.port}`);
  console.log(`Frontend: http://localhost:${config.port}/`);
  console.log(`API:      http://localhost:${config.port}/api/query`);
  console.log(`Default provider: ${config.llm.defaultProvider}`);
  console.log("=======================================================");
});