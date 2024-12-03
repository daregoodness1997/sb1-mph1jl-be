const express = require('express');
const router = express.Router();
const productRoutes = require('./product.routes');
const syncRoutes = require('./sync.routes');
const authRoutes = require('./auth.routes');
const onboardingRoutes = require('./onboarding.routes');
const { protect } = require('../middleware/auth');

router.use('/auth', authRoutes);
router.use('/onboarding', onboardingRoutes);

// Protected routes
router.use('/products', protect, productRoutes);
router.use('/sync', protect, syncRoutes);

module.exports = router;