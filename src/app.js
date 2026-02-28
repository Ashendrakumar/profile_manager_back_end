// src/app.js

import express from "express";
import cors from "cors";
import router from "./routes/index.route.js";
import errorHandler from "./middlewares/errorHandler.js";

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
