const express = require("express");
const router = express.Router();
const teamController = require("../controllers/team.controller");
const {
  authenticate,
  authorize,
  sameTeam,
  checkSubscription,
} = require("../middleware/auth");

/**
 * @swagger
 * /teams/users:
 *   post:
 *     tags: [Teams]
 *     summary: Create a new team member
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, manager, user]
 *     responses:
 *       201:
 *         description: Team member created successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Requires admin role
 *       500:
 *         description: Server error
 *   get:
 *     tags: [Teams]
 *     summary: Get all team members
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of team members
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Requires admin or manager role
 *       500:
 *         description: Server error
 *
 * /teams/users/{userId}:
 *   put:
 *     tags: [Teams]
 *     summary: Update a team member
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, manager, user]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Team member updated successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Requires admin role
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *
 * /teams/users/{userId}/pin:
 *   put:
 *     tags: [Teams]
 *     summary: Reset a team member's PIN
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PIN reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 newPin:
 *                   type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Requires admin role
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

// Basic routes with authentication and role authorization
router.post(
  "/users",
  authenticate,
  authorize(["admin"]),
  checkSubscription,
  teamController.createTeamMember
);

router.get(
  "/users",
  authenticate,
  authorize(["admin", "manager"]),
  teamController.getTeamMembers
);

// Routes that need same-team verification
router.put(
  "/users/:userId",
  authenticate,
  authorize(["admin"]),
  sameTeam,
  teamController.updateTeamMember
);

router.put(
  "/users/:userId/pin",
  authenticate,
  authorize(["admin"]),
  sameTeam,
  teamController.resetUserPin
);

module.exports = router;
