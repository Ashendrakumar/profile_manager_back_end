import { createUploader } from "../middlewares/upload.js";
import User from "../models/User.js";
import * as storage from "../services/storageService.js";

// Hero images are uploaded inside the controller (multiple files), so this
// uploader lives here. Profile/resume uploaders are wired in upload.route.js.
const heroUpload = createUploader({ allowedFileTypes: "images" });

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
 * download URL alongside the stored path/URL.
 */
const formatResume = (resume) => ({
  _id: resume._id,
  fileName: resume.fileName,
  filePath: resume.filePath,
  downloadUrl: storage.resolveUrl(resume.filePath),
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

    const userId = req.user.userId;

    // Confirm the user exists before we commit the upload, so a bad user id
    // doesn't leave an orphaned blob behind.
    const existing = await User.findById(userId).select("profileImage");
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { storedValue: profileImage } = await storage.save({
      buffer: req.file.buffer,
      folder: "profiles",
      originalName: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage },
      { new: true },
    );

    // Clean up the previous image after a successful swap.
    if (existing.profileImage && existing.profileImage !== profileImage) {
      await storage.remove(existing.profileImage);
    }

    return res.status(200).json({
      success: true,
      message: "Profile uploaded successfully",
      profileImage: updatedUser.profileImage,
      profileImageUrl: storage.resolveUrl(updatedUser.profileImage),
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

    const heroes = await Promise.all(
      req.files.map(async (file) => {
        const { storedValue, url } = await storage.save({
          buffer: file.buffer,
          folder: "heroes",
          originalName: file.originalname,
          contentType: file.mimetype,
        });
        return {
          fileName: file.originalname,
          filePath: storedValue,
          url,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      message: "Hero images uploaded successfully",
      heroes,
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

    const user = await User.findById(userId).select("resumes");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { storedValue: resumePath } = await storage.save({
      buffer: req.file.buffer,
      folder: "portfolios",
      originalName: req.file.originalname,
      contentType: req.file.mimetype || "application/pdf",
      download: true, // resumes should download, not render inline
    });

    const isFirstResume = user.resumes.length === 0;

    const resume = {
      fileName: req.file.originalname,
      filePath: resumePath,
      isPrimary: isFirstResume,
    };

    user.resumes.push(resume);
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Resume uploaded successfully",
      resumes: formatResumes(user.resumes),
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
    await storage.remove(removedPath);

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
// Download Resume (redirect to the stored file)
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

    // Works for both drivers: local resolves to the express.static URL (which
    // sends Content-Disposition: attachment) and R2 resolves to its public URL
    // (which carries the attachment disposition set at upload time).
    return res.redirect(storage.resolveUrl(storedPath));
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
    const user = await User.findById(userId).select("resumes resume");

    const storedPath = user ? resolvePrimaryResumePath(user) : "";
    if (!storedPath) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "File link retrieved successfully",
      fileLink: storage.resolveUrl(storedPath),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
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
