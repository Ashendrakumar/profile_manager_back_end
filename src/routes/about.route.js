import express from "express";
import authenticateToken from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";
import {
  getAbout,
  getAboutForAdmin,
  createAbout,
  updateAbout,
  deleteAbout,
} from "../controllers/about.controller.js";

const router = express.Router();

// Public route - GET about page content
router.get("/", getAbout);

// Admin routes
router.get(
  "/admin/get",
  authenticateToken,
  authorize("admin"),
  getAboutForAdmin,
);

router.post(
  "/admin/create",
  authenticateToken,
  authorize("admin"),
  createAbout,
);

router.put(
  "/admin/update/:id",
  authenticateToken,
  authorize("admin"),
  updateAbout,
);

router.delete(
  "/admin/delete/:id",
  authenticateToken,
  authorize("admin"),
  deleteAbout,
);

export default router;
