import express from "express";
import { createUploader } from "../middlewares/upload.js";
import * as uploadController from "../controllers/upload.controller.js";
import authenticateToken from "../middlewares/auth.js";
const { uploadProfile, uploadHeroImages, uploadResumePdf } = uploadController;

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create uploader instances
const profileUploader = createUploader({ folder: "profiles" });
const heroUploader = createUploader({ folder: "heroes" });
const portfolioUploader = createUploader({
  folder: "portfolios",
  allowedFileTypes: "documents", // Allow PDFs, docs
});

// Routes with middleware
router.post(
  "/profile-upload",
  profileUploader.single("profile"),
  uploadProfile,
);

router.post("/hero-images", heroUploader.array("heroes", 5), uploadHeroImages);

router.post(
  "/resume-upload",
  portfolioUploader.single("resume"),
  uploadResumePdf,
);

export default router;
