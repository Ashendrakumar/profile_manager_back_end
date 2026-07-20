import { createUploader } from "../middlewares/upload.js";
import User from "../models/User.js";
import config from "../config/config.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Resolve the uploads root from this module's location (src/uploads), so file
// deletion/streaming is independent of the process working directory. This
// matches where multer writes (middlewares/upload.js) and where app.js serves.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = path.join(__dirname, "..");

// Hero images are uploaded inside the controller (multiple files), so this
// uploader lives here. Profile/resume uploaders are wired in upload.route.js.
const heroUpload = createUploader({
  folder: "heroes",
});

/**
 * Delete a previously stored upload from disk (best-effort).
 * Prevents orphaned files accumulating every time a user replaces their
 * profile image or resume. `storedPath` is the DB value, e.g.
 * "/uploads/profiles/123.webp".
 */
const removeStoredFile = (storedPath) => {
  if (!storedPath) return;
  try {
    const absolutePath = path.join(UPLOADS_ROOT, storedPath);
    if (fs.existsSync(absolutePath)) {
      fs.unlink(absolutePath, () => {});
    }
  } catch {
    // ignore cleanup failures — they must not block the upload response
  }
};

/**
 * Resolve the user's effective resume path: the one marked primary, falling
 * back to the most recent resume, then the legacy single `resume` field.
 */
const resolvePrimaryResumePath = (user) => {
  const resumes = user.resumes || [];
  if (resumes.length > 0) {
    const primary =
      resumes.find((r) => r.isPrimary) || resumes[resumes.length - 1];
    return primary.filePath;
  }
  return user.resume || "";
};

/**
 * Shape a resume subdocument for API responses: expose a ready-to-use absolute
 * download URL alongside the stored relative path.
 */
const formatResume = (resume) => ({
  _id: resume._id,
  fileName: resume.fileName,
  filePath: resume.filePath,
  downloadUrl: `${config.baseUrl}${resume.filePath}`,
  isPrimary: resume.isPrimary,
  uploadedAt: resume.createdAt,
});

const formatResumes = (resumes = []) => resumes.map(formatResume);

// ===============================
// Single Profile Upload
// ===============================

const uploadProfile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Profile image is required",
      });
    }

    const profileFile = req.file;
    const userId = req.user.userId;
    const profileImage = `/uploads/profiles/${profileFile.filename}`;

    // Capture the previous image so we can clean it up after a successful swap.
    const existing = await User.findById(userId).select("profileImage");
    if (!existing) {
      removeStoredFile(profileImage);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage },
      { new: true },
    );

    if (existing.profileImage && existing.profileImage !== profileImage) {
      removeStoredFile(existing.profileImage);
    }

    return res.status(200).json({
      success: true,
      message: "Profile uploaded successfully",
      file: profileFile,
      profileImage: updatedUser.profileImage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Multiple Hero Images Upload
// ===============================

const uploadHeroImages = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      heroUpload.array("heroes", 5)(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Hero images are required",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hero images uploaded successfully",
      files: req.files,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Upload Resume PDF
// ===============================

const uploadResumePdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume PDF is required",
      });
    }

    const userId = req.user.userId;
    const resumePath = `/uploads/portfolios/${req.file.filename}`;

    const user = await User.findById(userId).select("resumes");
    if (!user) {
      removeStoredFile(resumePath);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isFirstResume = user.resumes.length === 0;

    const resume = {
      fileName: req.file.originalname,
      filePath: resumePath,
      isPrimary: isFirstResume,
    };

    const updatedUser = await User.findByIdAndUpdate(userId, {
      $push: { resumes: resume },
    });

    return res.status(201).json({
      success: true,
      message: "Resume uploaded successfully",
      resumes: formatResumes(updatedUser.resumes),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// List Resumes
// ===============================

const getResumes = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("resumes");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      resumes: formatResumes(user.resumes),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// Mark a Resume as Primary
// ===============================

const setPrimaryResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { resumeId } = req.params;

    const user = await User.findById(userId).select("resumes");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const target = user.resumes.id(resumeId);
    if (!target) {
      return res
        .status(404)
        .json({ success: false, message: "Resume not found" });
    }

    // Exactly one primary: clear the rest, set the chosen one.
    user.resumes.forEach((resume) => {
      resume.isPrimary = resume._id.equals(resumeId);
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Primary resume updated",
      resumes: formatResumes(user.resumes),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// Delete a Resume
// ===============================

const deleteResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { resumeId } = req.params;

    const user = await User.findById(userId).select("resumes");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const target = user.resumes.id(resumeId);
    if (!target) {
      return res
        .status(404)
        .json({ success: false, message: "Resume not found" });
    }

    const wasPrimary = target.isPrimary;
    const removedPath = target.filePath;
    target.deleteOne();

    // If we removed the primary, promote the most recent remaining resume.
    if (wasPrimary && user.resumes.length > 0) {
      user.resumes[user.resumes.length - 1].isPrimary = true;
    }

    await user.save();
    removeStoredFile(removedPath);

    return res.status(200).json({
      success: true,
      message: "Resume deleted",
      resumes: formatResumes(user.resumes),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// Download Resume (stream file)
// ===============================

const downloadResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("resumes resume");

    const storedPath = user ? resolvePrimaryResumePath(user) : "";
    if (!storedPath) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    const resumePath = path.join(UPLOADS_ROOT, storedPath);

    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({
        success: false,
        message: "Resume file not found on disk",
      });
    }

    const filename = path.basename(storedPath);

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/pdf");

    res.download(resumePath, filename, (err) => {
      if (err && !res.headersSent) {
        return res.status(500).json({
          success: false,
          message: "Failed to download resume",
          error: err.message,
        });
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Get Resume Download URL
// ===============================

const downloadFileByPath = async (req, res) => {
  try {
    const userId = req.user.userId;
    // FIX: fetch user from DB, not from req.user (which only has auth payload)
    const user = await User.findById(userId).select("resumes resume");

    const storedPath = user ? resolvePrimaryResumePath(user) : "";
    if (!storedPath) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    const resumeDownloadUrl = getDownloadUrl(storedPath);

    return res.status(200).json({
      success: true,
      message: "File link retrieved successfully",
      fileLink: resumeDownloadUrl,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Helper
// ===============================

const getDownloadUrl = (filePath) => {
  if (!filePath) return null;
  return `${config.baseUrl}${filePath}`;
};

export {
  uploadProfile,
  uploadHeroImages,
  uploadResumePdf,
  getResumes,
  setPrimaryResume,
  deleteResume,
  downloadFileByPath,
  downloadResume,
};
