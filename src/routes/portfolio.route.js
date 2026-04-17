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
