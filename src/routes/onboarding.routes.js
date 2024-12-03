const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboarding.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/status', onboardingController.getOnboardingStatus);
router.post('/complete', onboardingController.updateOnboardingProfile);

module.exports = router;