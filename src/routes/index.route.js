// src/routes/index.route.js

import express from "express";
import userRoutes from "./users.route.js";
import postRoutes from "./posts.route.js";
import profileRoutes from "./profile.route.js";
import portfolioRoutes from "./portfolio.route.js";
import uploadRoutes from "./upload.route.js";
import aboutRoutes from "./about.route.js";
import settingsRoutes from "./settings.route.js";
import documentRoutes from "./documents.route.js";

const router = express.Router();

// Routes
router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/profile", profileRoutes);
router.use("/portfolio", portfolioRoutes);
router.use("/upload", uploadRoutes);
router.use("/about", aboutRoutes);
router.use("/settings", settingsRoutes);
router.use("/documents", documentRoutes);

export default router;
