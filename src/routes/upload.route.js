import express from "express";
import { createUploader } from "../middlewares/upload.js";
import * as uploadController from "../controllers/upload.controller.js";
import authenticateToken from "../middlewares/auth.js";
const { uploadProfile, uploadHeroImages, uploadResumePdf, downloadFileByPath } =
  uploadController;

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create uploader instances
const profileUploader = createUploader({
  folder: "profiles",
  allowedFileTypes: "images",
});

const heroUploader = createUploader({
  folder: "heroes",
  allowedFileTypes: "images",
});

const resumeUploader = createUploader({
  folder: "portfolios",
  allowedFileTypes: "documents", // Allow PDFs, docs
});

const portfolioUploader = createUploader({
  folder: "portfolios",
  allowedFileTypes: "images",
});

// Routes with middleware
router.post("/profile-upload", uploadProfile);

router.post("/hero-images", heroUploader.array("heroes", 5), uploadHeroImages);

router.post("/resume-upload", resumeUploader.single("resume"), uploadResumePdf);

router.get("/file-download/:filename", downloadFileByPath);

export default router;
