import { createUploader } from "../middlewares/upload.js";
import User from "../models/User.js";

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
    await new Promise((resolve, reject) => {
      profileUpload.any()(req, res, (err) => {
        if (err) {
          return reject(err);
        }

        resolve();
      });
    });

    // Find the profile file from all files uploaded
    const profileFile = req.files?.find((f) => f.fieldname === "resume");

    if (!profileFile) {
      return res.status(400).json({
        success: false,
        message: "Profile image is required",
      });
    }

    const userId = req.user.userId;
    // Relative image path
    const profileImage = `/uploads/profiles/${profileFile.filename}`;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage: profileImage },
      { new: true },
    );

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
        if (err) {
          return reject(err);
        }

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

const uploadResumePdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume PDF is required",
      });
    }

    const userId = req.user.userId;
    // Relative file path
    const resumePath = `/uploads/portfolios/${req.file.filename}`;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { resume: resumePath },
      { new: true },
    );

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

    const resumePath = `${process.cwd()}/src${user.resume}`;

    // Set proper download headers
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${user.resume.split("/").pop()}"`,
    );
    res.setHeader("Content-Type", "application/pdf");

    res.download(resumePath, (err) => {
      if (err) {
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

const downloadFileByPath = (req, res) => {
  try {
    const resumePath = req.user.resume;
    const resumeDownloadUrl = getDownloadUrl(user.resume);

    if (!resumePath || !resumeDownloadUrl) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "File downloaded successfully",
        fileLink: resumeDownloadUrl,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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
