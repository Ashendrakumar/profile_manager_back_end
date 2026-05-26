/**
 * @swagger
 * /api/portfolio/{id}:
 *   get:
 *     tags:
 *       - Portfolio
 *     summary: Get user portfolio details
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Portfolio details
 */

/**
 * @swagger
 * /api/portfolio/generate:
 *   post:
 *     tags:
 *       - Portfolio
 *     summary: Generate portfolio link
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Portfolio link generated
 */

import express from "express";
import {
  getUserPortfolioDetails,
  generatePortfolioLink,
} from "../controllers/portfolio.controller.js";
import authenticateToken from "../middlewares/auth.js";

const router = express.Router();

// Public routes
router.get("/:id", getUserPortfolioDetails);

// Protected routes
router.post("/generate", authenticateToken, generatePortfolioLink);

export default router;
