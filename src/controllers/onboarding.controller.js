const User = require('../models/User');

exports.updateOnboardingProfile = async (req, res) => {
  try {
    const { company } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        company,
        onboardingCompleted: true
      },
      { new: true }
    );

    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        onboardingCompleted: user.onboardingCompleted
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getOnboardingStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      onboardingCompleted: user.onboardingCompleted,
      company: user.company
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};