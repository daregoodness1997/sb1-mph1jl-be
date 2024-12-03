const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Team = require("../models/Team");

const teamController = {
  // Create a new team member
  createTeamMember: async (req, res) => {
    try {
      const { email, firstName, lastName, role, pin } = req.body;

      // Validate PIN format
      if (!/^\d{4,6}$/.test(pin)) {
        return res.status(400).json({ message: "PIN must be 4-6 digits" });
      }

      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: "Email already registered" });
      }

      const user = new User({
        email,
        firstName,
        lastName,
        role,
        pin,
        teamId: req.user.teamId, // From authenticated user
      });

      await user.save();

      // Remove sensitive data before sending response
      const userResponse = user.toObject();
      delete userResponse.pin;
      delete userResponse.password;

      res.status(201).json(userResponse);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get all team members
  getTeamMembers: async (req, res) => {
    try {
      const teamMembers = await User.find(
        { teamId: req.user.teamId },
        "-pin -password"
      );
      res.json(teamMembers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Update team member
  updateTeamMember: async (req, res) => {
    try {
      const { role, isActive } = req.body;
      const { userId } = req.params;

      const user = await User.findOne({
        _id: userId,
        teamId: req.user.teamId,
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent last admin from being deactivated
      if (user.role === "admin" && !isActive) {
        const adminCount = await User.countDocuments({
          teamId: req.user.teamId,
          role: "admin",
          isActive: true,
        });
        if (adminCount <= 1) {
          return res.status(400).json({
            message: "Cannot deactivate the last admin",
          });
        }
      }

      user.role = role || user.role;
      user.isActive = isActive !== undefined ? isActive : user.isActive;
      await user.save();

      const userResponse = user.toObject();
      delete userResponse.pin;
      delete userResponse.password;

      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  createTeam: async (req, res) => {
    try {
      const { name, businessType, address, contact } = req.body;

      const team = new Team({
        name,
        businessType,
        address,
        contact,
        ownerId: req.user.id,
      });

      await team.save();

      // Update the creating user to be an admin of this team
      await User.findByIdAndUpdate(req.user.id, {
        teamId: team._id,
        role: "admin",
      });

      res.status(201).json(team);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  updateTeam: async (req, res) => {
    try {
      const { name, address, contact, settings } = req.body;

      const team = await Team.findOne({
        _id: req.user.teamId,
        isActive: true,
      });

      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Update only allowed fields
      if (name) team.name = name;
      if (address) team.address = { ...team.address, ...address };
      if (contact) team.contact = { ...team.contact, ...contact };
      if (settings) team.settings = { ...team.settings, ...settings };

      await team.save();
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getTeamStats: async (req, res) => {
    try {
      const team = await Team.findById(req.user.teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      const stats = await team.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  checkUserLimit: async (req, res) => {
    try {
      const team = await Team.findById(req.user.teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      const canAdd = await team.canAddUsers();
      res.json({ canAddUsers: canAdd });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  resetUserPin: async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findOne({
        _id: userId,
        teamId: req.user.teamId,
        isActive: true,
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate new random 6-digit PIN
      const newPin = Math.floor(100000 + Math.random() * 900000).toString();
      user.pin = newPin;

      await user.save();

      res.json({ message: "PIN reset successful", newPin });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = teamController;
