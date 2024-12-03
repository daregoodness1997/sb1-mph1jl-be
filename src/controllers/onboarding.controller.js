const User = require("../models/User");
const Team = require("../models/Team");

const onboardingController = {
  updateOnboardingProfile: async (req, res) => {
    try {
      const {
        phoneNumber,
        address,
        businessHours,
        taxSettings,
        currency,
        timezone,
      } = req.body;

      // Update user profile
      const user = await User.findById(req.user.id);
      if (phoneNumber) {
        user.phoneNumber = phoneNumber;
      }
      await user.save();

      // Update team settings
      const team = await Team.findById(req.user.teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Update team address
      if (address) {
        team.address = { ...team.address, ...address };
      }

      // Update team settings
      team.settings = {
        ...team.settings,
        ...(businessHours && { businessHours }),
        ...(taxSettings && { taxSettings }),
        ...(currency && { currency }),
        ...(timezone && { timezone }),
      };

      // Update team contact
      if (phoneNumber) {
        team.contact.phone = phoneNumber;
      }

      await team.save();

      res.json({
        user: user.toObject(),
        team: team.toObject(),
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  completeOnboarding: async (req, res) => {
    try {
      const team = await Team.findById(req.user.teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Verify required fields are completed
      const requiredFields = [
        team.address,
        team.contact.phone,
        team.settings.currency,
        team.settings.timezone,
      ];

      if (requiredFields.some((field) => !field)) {
        return res.status(400).json({
          message: "Please complete all required fields",
        });
      }

      // Mark onboarding as complete
      team.onboardingCompleted = true;
      await team.save();

      res.json({
        message: "Onboarding completed successfully",
        team: team.toObject(),
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getOnboardingStatus: async (req, res) => {
    try {
      const team = await Team.findById(req.user.teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Calculate completion percentage
      const requiredFields = [
        "address",
        "contact.phone",
        "settings.currency",
        "settings.timezone",
        "settings.businessHours",
        "settings.taxSettings",
      ];

      const completedFields = requiredFields.filter((field) => {
        return field.split(".").reduce((obj, key) => obj && obj[key], team);
      });

      const completionPercentage =
        (completedFields.length / requiredFields.length) * 100;

      res.json({
        isComplete: team.onboardingCompleted,
        completionPercentage,
        remainingSteps: requiredFields.filter((field) => {
          return !field.split(".").reduce((obj, key) => obj && obj[key], team);
        }),
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = onboardingController;
