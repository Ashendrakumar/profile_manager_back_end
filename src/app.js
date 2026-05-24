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
import swaggerFile from "./swagger-output.json" with { type: "json" };

// import swaggerFile from "./swagger-output.json" assert { type: "json" };

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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api", (req, res) => {
  res.json({ status: "API is running", version: "1.0.0" });
});

// Routes
app.use("/api", router);

// Swagger route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// Global error handler (last)
app.use(errorHandler);

export default app;
