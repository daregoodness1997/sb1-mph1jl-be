const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    businessType: {
      type: String,
      required: true,
      enum: ["retail", "restaurant", "service", "wholesale", "other"],
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    contact: {
      phone: String,
      email: String,
    },
    settings: {
      currency: {
        type: String,
        default: "USD",
      },
      timezone: {
        type: String,
        default: "UTC",
      },
      taxRate: {
        type: Number,
        default: 0,
      },
    },
    subscription: {
      plan: {
        type: String,
        enum: ["free", "basic", "premium", "enterprise"],
        default: "free",
      },
      status: {
        type: String,
        enum: ["active", "inactive", "trial"],
        default: "trial",
      },
      expiresAt: Date,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      //   required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
teamSchema.index({ ownerId: 1 });
teamSchema.index({ "subscription.status": 1 });

// Method to check if team can add more users based on subscription
teamSchema.methods.canAddUsers = async function () {
  const userCount = await mongoose
    .model("User")
    .countDocuments({ teamId: this._id });

  const limits = {
    free: 2,
    basic: 5,
    premium: 15,
    enterprise: Infinity,
  };

  return userCount < limits[this.subscription.plan];
};

// Method to get team statistics
teamSchema.methods.getStats = async function () {
  const users = await mongoose
    .model("User")
    .countDocuments({ teamId: this._id });
  const activeUsers = await mongoose.model("User").countDocuments({
    teamId: this._id,
    isActive: true,
  });

  return {
    totalUsers: users,
    activeUsers: activeUsers,
    createdAt: this.createdAt,
    subscriptionStatus: this.subscription.status,
    subscriptionPlan: this.subscription.plan,
  };
};

module.exports = mongoose.model("Team", teamSchema);
