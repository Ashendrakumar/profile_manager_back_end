/**
 * @swagger
 * /api/upload/profile-upload:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Upload profile image
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profiles:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image uploaded
 */

/**
 * @swagger
 * /api/upload/hero-images:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Upload hero images (multiple)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               heroes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Hero images uploaded
 */

/**
 * @swagger
 * /api/upload/resume-upload:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Upload resume PDF
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Resume uploaded
 */

/**
 * @swagger
 * /api/upload/file-download/{filename}:
 *   get:
 *     tags:
 *       - Upload
 *     summary: Download file by filename
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: filename
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File downloaded
 */

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
router.post(
  "/profile-upload",
  profileUploader.single("profiles"),
  uploadProfile,
);

router.post("/hero-images", heroUploader.array("heroes", 5), uploadHeroImages);

router.post("/resume-upload", resumeUploader.single("resume"), uploadResumePdf);

router.get("/file-download/:filename", downloadFileByPath);

export default router;
