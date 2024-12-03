const User = require("../models/User");
const Team = require("../models/Team");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../utils/email");
const authController = {
  register: async (req, res) => {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        businessName,
        businessType,
      } = req.body;

      // Validate required fields
      if (
        !email ||
        !password ||
        !firstName ||
        !lastName ||
        !businessName ||
        !businessType
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: "Email already registered" });
      }
      console.log(">>>>> debugger");
      // Create team first
      const team = new Team({
        name: businessName,
        businessType,
        contact: { email },
        subscription: {
          plan: "free",
          status: "trial",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        },
      });

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      // Create user
      const user = new User({
        email,
        password: await bcrypt.hash(password, 10),
        firstName,
        lastName,
        role: "admin", // First user is always admin
        pin: crypto.randomInt(100000, 999999).toString(), // Generate random 6-digit PIN
        verificationToken,
        verificationTokenExpiry,
        isEmailVerified: false,
      });

      // Save team first to get teamId
      try {
        await team.save();
      } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
          message: "Error creating team",
          error:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }

      // Update user with teamId and ownerId
      user.teamId = team._id;
      team.ownerId = user._id;

      // Save both
      try {
        await user.save();
        await team.save();
      } catch (error) {
        // If user creation fails, cleanup team
        if (team._id) {
          await Team.findByIdAndDelete(team._id);
        }

        console.log(error.message);
        return res.status(500).json({
          message: "Error saving user data",
          error:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }

      // Send verification email
      try {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
        await sendVerificationEmail(user.email, verificationToken);
      } catch (error) {
        console.error("Error sending verification email:", error);
        // Continue registration process even if email fails
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user._id, teamId: team._id },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Remove sensitive data
      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.pin;
      delete userResponse.verificationToken;
      delete userResponse.verificationTokenExpiry;

      res.status(201).json({
        user: userResponse,
        team,
        token,
      });
    } catch (error) {
      res.status(500).json({
        message: "An error occurred during registration",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res
          .status(404)
          .json({ message: "No user found with this email" });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
      await user.save();

      await sendPasswordResetEmail(user.email, resetToken);
      res.json({ message: "Password reset email sent" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res
          .status(400)
          .json({ message: "Invalid or expired reset token" });
      }

      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      const jwtToken = signToken(user._id);
      res.json({ token: jwtToken });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Find user and populate team
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if password is undefined or empty
      if (!password || typeof password !== "string") {
        return res.status(400).json({ message: "Invalid password format" });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ message: "Account is deactivated" });
      }

      // Get team info
      const team = await Team.findById(user.teamId);
      if (!team || !team.isActive) {
        return res.status(403).json({ message: "Team is inactive" });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user._id, teamId: user.teamId },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Remove sensitive data
      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.pin;

      res.json({
        user: userResponse,
        team,
        token,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  verifyEmail: async (req, res) => {
    try {
      const { token } = req.params;

      const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpiry: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      user.isEmailVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpiry = undefined;
      await user.save();

      res.json({ message: "Email verified successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = authController;
