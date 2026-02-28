import User from "../models/User.js";

/**
 * Middleware to check if user has required role
 * @param {string[]} allowedRoles - Array of roles allowed to access the route
 */
export const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Get user from database to check role
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          message: "Access denied. Insufficient permissions.",
        });
      }

      // Attach user object to request for use in controllers
      req.userData = user;
      next();
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Authorization error", error: error.message });
    }
  };
};
