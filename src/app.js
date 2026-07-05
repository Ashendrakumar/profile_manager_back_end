// src/app.js

import express from "express";
import cors from "cors";
import router from "./routes/index.route.js";
import errorHandler from "./middlewares/errorHandler.js";
import path from "path";
import { fileURLToPath } from "url";

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Swagger setup
import swaggerUi from "swagger-ui-express";
import swaggerSpecs from "./swagger-new.js";
import { createMcpRouter } from "./mcp/server.js";

const app = express();

// Enable CORS
app.use(cors());

// Body parser
app.use(express.json());

// Test base API route
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Serve static files - UPLOADS folder Expose to download
// Resume files (under /uploads/portfolios) are forced to download with a
// Content-Disposition: attachment header. The HTML5 `download` attribute is
// ignored for cross-origin links on mobile browsers, so this header is what
// makes "Download Resume" work reliably on phones from the public portfolio.
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      const isResume =
        filePath.includes(`${path.sep}portfolios${path.sep}`) &&
        [".pdf", ".doc", ".docx"].includes(ext);

      if (isResume) {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${path.basename(filePath)}"`,
        );
      }
      // Allow cross-origin (portfolio site) to embed/fetch assets.
      res.setHeader("Access-Control-Allow-Origin", "*");
    },
  }),
);

app.get("/api", (req, res) => {
  res.json({ status: "API is running", version: "1.0.0" });
});

// Routes
app.use("/api", router);

app.use("/mcp", createMcpRouter());

// Swagger route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Global error handler (last)
app.use(errorHandler);

export default app;
