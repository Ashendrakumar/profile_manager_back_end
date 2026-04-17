import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import config from "../config/config.js";

const { jwtSecret } = config;

// Register a new user (default role: 'user')
const registerUser = async (req, res) => {
  try {
    const { username, password, email, role } = req.body;

    // Only allow setting admin role if current user is admin (if authenticated)
    // For public registration, always set to 'user'
    const userRole =
      req.userData?.role === "admin" && role === "admin" ? "admin" : "user";

    const user = new User({ username, password, email, role: userRole });
    await user.save();

    // Generate token after registration
    const token = jwt.sign({ userId: user._id, role: user.role }, jwtSecret, {
      expiresIn: "1h",
    });

    // Return token and user data
    res.status(201).json({
      accessToken: token,
      user: {
        id: user._id.toString(),
        name: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message || "Registration failed", error: err });
  }
};

// Login and return JWT
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
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

    // Return token and user data
    res.json({
      accessToken: token,
      user: {
        id: user._id.toString(),
        name: user.username,
        email: user.email,
        role: user.role,
        portfolio: {
          link: user.portfolio.link,
          isGenerated: user.portfolio.isGenerated,
        },
      },
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message || "Login failed", error: err });
  }
};

const logoutUser = async (req, res) => {
  // Since JWT is stateless, logout can be handled on client side by deleting the token.
  res.json({
    message: "Logout successful on client side by deleting the token.",
  });
};

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: err.message });
  }
};

// Get single user by ID (Admin can get any, User can only get self)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.userData;

    // Users can only access their own data, Admins can access any
    if (currentUser.role !== "admin" && currentUser._id.toString() !== id) {
      return res.status(403).json({
        message: "Access denied. You can only view your own profile.",
      });
    }

    const user = await User.findById(id).select("-password");
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

// Get current user's profile (self)
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
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

// Create user (Admin only)
const createUser = async (req, res) => {
  try {
    const { username, password, email, role } = req.body;

    // Check if user already exists
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

// Update user (Admin can update any, User can only update self)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, password } = req.body;
    const currentUser = req.userData;

    // Users can only update their own data (and cannot change role)
    if (currentUser.role !== "admin") {
      if (currentUser._id.toString() !== id) {
        return res.status(403).json({
          message: "Access denied. You can only update your own profile.",
        });
      }
      // Remove role from update if user is not admin
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
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User updated successfully",
      user,
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message || "Failed to update user", error: err });
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.userData;

    // Prevent admin from deleting themselves
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
};
