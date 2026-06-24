import { createUploader } from "../middlewares/upload.js";
import User from "../models/User.js";
import path from "path";
import fs from "fs";

// ===============================
// Upload Configs
// ===============================

const profileUpload = createUploader({
  folder: "profiles",
});

const heroUpload = createUploader({
  folder: "heroes",
});

const resumeUpload = createUploader({
  folder: "portfolios",
  allowedFileTypes: "documents",
});

const portfolioUpload = createUploader({
  folder: "portfolios",
});

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

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
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

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { resume: resumePath },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Resume uploaded successfully",
      file: req.file,
      resume: updatedUser.resume,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Download Resume (stream file)
// ===============================

const downloadResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("resume");

    if (!user || !user.resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    // Build absolute path — adjust base dir if your uploads folder differs
    const resumePath = path.join(process.cwd(), "src", user.resume);

    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({
        success: false,
        message: "Resume file not found on disk",
      });
    }

    const filename = path.basename(user.resume);

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
    const user = await User.findById(userId).select("resume");

    if (!user || !user.resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    const resumeDownloadUrl = getDownloadUrl(user.resume);

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
  const baseUrl = process.env.BASE_URL || "http://localhost:10000";
  return `${baseUrl}${filePath}`;
};

export {
  uploadProfile,
  uploadHeroImages,
  uploadResumePdf,
  downloadFileByPath,
  downloadResume,
};
