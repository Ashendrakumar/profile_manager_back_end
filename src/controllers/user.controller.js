import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import config from "../config/config.js";
import { sendOtpEmail } from "../utils/emailService.js";

const { jwtSecret } = config;

/**
 * Generate a cryptographically secure 6-digit OTP.
 */
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hash OTP using SHA-256 for secure storage.
 */
const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

// ─────────────────────────────────────────────────────────────────────────────
// Register a new user — sends OTP email, does NOT return JWT yet
// ─────────────────────────────────────────────────────────────────────────────
const registerUser = async (req, res) => {
  try {
    const { username, password, email, role } = req.body;

    // Check if a verified user already exists with this email or username
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      // If the existing user is unverified, we can resend OTP instead
      if (!existingUser.isVerified) {
        const otp = generateOtp();
        existingUser.otp = hashOtp(otp);
        existingUser.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        await existingUser.save();

        await sendOtpEmail(existingUser.email, otp, existingUser.username);

        // Issue a short-lived OTP token so the frontend can navigate securely
        const otpToken = jwt.sign(
          { email: existingUser.email, fullName: existingUser.username },
          jwtSecret,
          { expiresIn: "10m" },
        );

        return res.status(200).json({
          message:
            "Account pending verification. A new OTP has been sent to your email.",
          email: existingUser.email,
          otpToken,
        });
      }
      return res
        .status(400)
        .json({ message: "User with this email or username already exists." });
    }

    // Only allow setting admin role if current user is admin
    const userRole =
      req.userData?.role === "admin" && role === "admin" ? "admin" : "user";

    // Generate OTP before saving
    const otp = generateOtp();

    const user = new User({
      username,
      password,
      email,
      role: userRole,
      isVerified: false,
      otp: hashOtp(otp),
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await user.save();

    // Send the OTP email (non-blocking error handling)
    try {
      await sendOtpEmail(email, otp, username);
    } catch (emailErr) {
      console.error("Failed to send OTP email:", emailErr.message);
      // Clean up the user if email fails to avoid orphan records
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({
        message:
          "Failed to send verification email. Please check the email address and try again.",
      });
    }

    // Issue a short-lived OTP token (10 min) carrying email + fullName for the frontend
    const otpToken = jwt.sign(
      { email, fullName: username },
      jwtSecret,
      { expiresIn: "10m" },
    );

    res.status(201).json({
      message:
        "Registration successful! Please check your email for the verification code.",
      email,
      otpToken,
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message || "Registration failed", error: err });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Verify OTP — marks user as verified and returns JWT
// ─────────────────────────────────────────────────────────────────────────────
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ message: "This account is already verified. Please log in." });
    }

    // Check OTP expiry
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({
        message: "OTP has expired. Please request a new one.",
        code: "OTP_EXPIRED",
      });
    }

    // Compare hashed OTP
    const hashedInput = hashOtp(otp.toString().trim());
    if (user.otp !== hashedInput) {
      return res.status(400).json({
        message: "Invalid OTP. Please try again.",
        code: "OTP_INVALID",
      });
    }

    // Mark as verified and clear OTP fields
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // Issue JWT
    const token = jwt.sign({ userId: user._id, role: user.role }, jwtSecret, {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: "Email verified successfully! Welcome aboard.",
      accessToken: token,
      user: {
        id: user._id.toString(),
        name: user.username,
        email: user.email,
        role: user.role,
        portfolio: {
          link: user.portfolio?.link || "",
          isGenerated: user.portfolio?.isGenerated || false,
        },
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "OTP verification failed", error: err });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Resend OTP — generates a fresh OTP and re-sends the email
// ─────────────────────────────────────────────────────────────────────────────
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ message: "This account is already verified." });
    }

    // Rate-limit: allow resend only if last OTP was sent > 60 seconds ago
    if (
      user.otpExpiry &&
      user.otpExpiry > new Date(Date.now() + 9 * 60 * 1000)
    ) {
      return res.status(429).json({
        message: "Please wait at least 60 seconds before requesting a new OTP.",
      });
    }

    const otp = generateOtp();
    user.otp = hashOtp(otp);
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(user.email, otp, user.username);

    res.status(200).json({
      message: "A new verification code has been sent to your email.",
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Failed to resend OTP", error: err });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────────────────────
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Block login for unverified accounts
    if (!user.isVerified) {
      return res.status(403).json({
        message:
          "Please verify your email before logging in. Check your inbox for the OTP.",
        code: "EMAIL_NOT_VERIFIED",
        email: user.email,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Email or password is incorrect" });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, jwtSecret, {
      expiresIn: "1h",
    });

    res.json({
      accessToken: token,
      user: mapUserData(user),
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message || "Login failed", error: err });
  }
};

function mapUserData(user) {
  return {
    id: user._id.toString(),
    name: user.username,
    email: user.email,
    role: user.role,
    portfolio: {
      link: user.portfolio?.link || "",
      isGenerated: user.portfolio?.isGenerated || false,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────────────────────────────────────
const logoutUser = async (req, res) => {
  res.json({
    message: "Logout successful on client side by deleting the token.",
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Get all users (Admin only)
// ─────────────────────────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -otp");
    res.json(users);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get single user by ID
// ─────────────────────────────────────────────────────────────────────────────
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.userData;

    if (currentUser.role !== "admin" && currentUser._id.toString() !== id) {
      return res.status(403).json({
        message: "Access denied. You can only view your own profile.",
      });
    }

    const user = await User.findById(id).select("-password -otp");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch user", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get current user's profile (self)
// ─────────────────────────────────────────────────────────────────────────────
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-password -otp -otpExpiry",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user: mapUserData(user) });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch user", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Create user (Admin only)
// ─────────────────────────────────────────────────────────────────────────────
const createUser = async (req, res) => {
  try {
    const { username, password, email, role } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email or username already exists" });
    }

    const user = new User({
      username,
      password,
      email,
      role: role || "user",
      isVerified: true, // Admin-created users are pre-verified
    });
    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message || "Failed to create user", error: err });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Update user
// ─────────────────────────────────────────────────────────────────────────────
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, password } = req.body;
    const currentUser = req.userData;

    if (currentUser.role !== "admin") {
      if (currentUser._id.toString() !== id) {
        return res.status(403).json({
          message: "Access denied. You can only update your own profile.",
        });
      }
      delete req.body.role;
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (password) updateData.password = password;
    if (role && currentUser.role === "admin") updateData.role = role;

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -otp");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully", user });
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message || "Failed to update user", error: err });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Delete user (Admin only)
// ─────────────────────────────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.userData;

    if (currentUser._id.toString() === id) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete user", error: err.message });
  }
};

export {
  registerUser,
  loginUser,
  logoutUser,
  getAllUsers,
  getUserById,
  getCurrentUser,
  createUser,
  updateUser,
  deleteUser,
  verifyOtp,
  resendOtp,
};
