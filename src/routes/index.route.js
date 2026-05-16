// src/routes/index.route.js

import express from "express";
import userRoutes from "./users.route.js";
import postRoutes from "./posts.route.js";
import profileRoutes from "./profile.route.js";
import portfolioRoutes from "./portfolio.route.js";
import uploadRoutes from "./upload.route.js";

const router = express.Router();

// Routes
router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/profile", profileRoutes);
router.use("/portfolio", portfolioRoutes);
router.use("/upload", uploadRoutes);

export default router;
