const express = require("express");
const router = express.Router();
const productRoutes = require("./product.routes");
const syncRoutes = require("./sync.routes");
const authRoutes = require("./auth.routes");
const onboardingRoutes = require("./onboarding.routes");
const teamRoutes = require("./team.routes");
const { authenticate } = require("../middleware/auth");

router.use("/auth", authRoutes);
router.use("/onboarding", onboardingRoutes);

// Protected routes
router.use("/products", authenticate, productRoutes);
router.use("/sync", authenticate, syncRoutes);
router.use("/teams", authenticate, teamRoutes);

module.exports = router;
