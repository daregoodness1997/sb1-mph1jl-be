const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Authentication middleware
exports.authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: "Please log in to access this resource" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user with essential team info
    const user = await User.findById(decoded.userId)
      .select("+teamId +role +isActive")
      .lean();

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Role-based authorization middleware
exports.authorize = (roles) => {
  return (req, res, next) => {
    // If roles is not an array, convert it to one
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required before authorization",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

// Optional: Middleware to check if user belongs to the same team
exports.sameTeam = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;

    if (!targetUserId) {
      return res.status(400).json({
        message: "User ID parameter is required",
      });
    }

    const targetUser = await User.findById(targetUserId)
      .select("teamId")
      .lean();

    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    if (targetUser.teamId.toString() !== req.user.teamId.toString()) {
      return res.status(403).json({
        message: "You can only access users within your team",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Optional: Middleware to check subscription status
exports.checkSubscription = async (req, res, next) => {
  try {
    const Team = require("../models/Team"); // Import here to avoid circular dependency

    const team = await Team.findById(req.user.teamId)
      .select("subscription")
      .lean();

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (
      team.subscription.status !== "active" &&
      team.subscription.status !== "trial"
    ) {
      return res.status(403).json({
        message:
          "Your subscription is inactive. Please update your subscription to continue.",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
