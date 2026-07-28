#!/usr/bin/env node
/**
 * acgis-mcp-server.js
 */

import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

/**
 * Simple endpoint that fetches ArcGIS JS API docs.
 * Example query: GET /?q=geometryEngine.union
 */
app.get("/", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "Missing query parameter 'q'" });

  try {
    // Convert "geometryEngine.union" → URL path
    const [cls, method] = q.split(".");
    const url = `https://developers.arcgis.com/javascript/latest/api-reference/esri-${cls}.html`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    const html = await response.text();

    // Basic extraction: find relevant method section
    const regex = new RegExp(`<h3[^>]*>${method}</h3>[\\s\\S]*?(?=<h3|$)`, "i");
    const match = html.match(regex);
    const snippet = match ? match[0].replace(/<[^>]+>/g, "") : "Method not found.";

    res.json({
      title: `${q} (ArcGIS JS API)`,
      url,
      snippet,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`ArcGIS MCP server running on http://localhost:${port}`);
});
