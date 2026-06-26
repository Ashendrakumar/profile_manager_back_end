import jwt from "jsonwebtoken";
import User from "../models/User.js";
import config from "../config/config.js";

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token missing" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || config.jwtSecret,
    );
    req.user = decoded;

    // Fetch the user; a valid token for a deleted user must not pass, otherwise
    // controllers that read req.userData (e.g. user.controller) crash with 500.
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }
    req.userData = user;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authenticateToken;
