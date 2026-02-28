// src/routes/users.route.js

import express from "express";
import {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  getCurrentUser,
  createUser,
  updateUser,
  deleteUser,
  logoutUser,
} from "../controllers/user.controller.js";

import authenticateToken from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

// Protected routes - User can access their own data
router.get("/me", authenticateToken, getCurrentUser);
router.get("/:id", authenticateToken, getUserById);
router.put("/:id", authenticateToken, updateUser);

// Admin only routes
router.get("/", authenticateToken, authorize("admin"), getAllUsers);
router.post("/create", authenticateToken, authorize("admin"), createUser);
router.delete("/:id", authenticateToken, authorize("admin"), deleteUser);

export default router;
