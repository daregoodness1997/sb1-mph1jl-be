const express = require("express");
const router = express.Router();
const onboardingController = require("../controllers/onboarding.controller");
const { authenticate } = require("../middleware/auth");

/**
 * @swagger
 * /onboarding/status:
 *   get:
 *     tags: [Onboarding]
 *     summary: Get user's onboarding status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's onboarding status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isComplete:
 *                   type: boolean
 *                 currentStep:
 *                   type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 *
 * /onboarding/complete:
 *   post:
 *     tags: [Onboarding]
 *     summary: Complete onboarding profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName:
 *                 type: string
 *               industry:
 *                 type: string
 *               size:
 *                 type: string
 *               preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: Onboarding completed successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */

router.use(authenticate);

router.get("/status", onboardingController.getOnboardingStatus);
router.post("/complete", onboardingController.updateOnboardingProfile);

module.exports = router;
