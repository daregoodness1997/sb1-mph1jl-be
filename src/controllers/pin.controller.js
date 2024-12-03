const User = require("../models/User");
const bcrypt = require("bcryptjs");

const pinController = {
  // Update own PIN
  updateOwnPin: async (req, res) => {
    try {
      const { currentPin, newPin } = req.body;

      // Validate new PIN format
      if (!/^\d{4,6}$/.test(newPin)) {
        return res.status(400).json({ message: "PIN must be 4-6 digits" });
      }

      const user = await User.findById(req.user.id);

      // Verify current PIN
      const isValidPin = await bcrypt.compare(currentPin, user.pin);
      if (!isValidPin) {
        return res.status(401).json({ message: "Current PIN is incorrect" });
      }

      // Update PIN
      user.pin = newPin;
      await user.save();

      res.json({ message: "PIN updated successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Reset team member's PIN (admin only)
  resetUserPin: async (req, res) => {
    try {
      const { newPin } = req.body;
      const { userId } = req.params;

      // Validate PIN format
      if (!/^\d{4,6}$/.test(newPin)) {
        return res.status(400).json({ message: "PIN must be 4-6 digits" });
      }

      const user = await User.findOne({
        _id: userId,
        teamId: req.user.teamId,
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.pin = newPin;
      await user.save();

      res.json({ message: "PIN reset successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = pinController;
