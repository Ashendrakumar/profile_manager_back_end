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

const portfolioUpload = createUploader({
  folder: "portfolios",
});

// ===============================
// Single Profile Upload
// ===============================

const uploadProfile = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      profileUpload.single("profile")(req, res, (err) => {
        if (err) {
          return reject(err);
        }

        resolve();
      });
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Profile image is required",
      });
    }

    const userId = req.user.userId;
    // Relative image path
    const profileImage = `/uploads/profiles/${req.file.filename}`;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage: profileImage },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Profile uploaded successfully",
      file: req.file,
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

export { uploadProfile, uploadHeroImages, uploadResumePdf };
