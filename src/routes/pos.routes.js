const express = require("express");
const router = express.Router();
const posController = require("../controllers/pos.controller");
const {
  authenticate,
  authorize,
  checkSubscription,
} = require("../middleware/auth");

/**
 * @swagger
 * /pos/sales:
 *   post:
 *     tags: [POS]
 *     summary: Create a new sale
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, paymentMethod]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, quantity]
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     discount:
 *                       type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, mobile_payment, other]
 *               discount:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sale created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 *
 * /pos/sales/report:
 *   get:
 *     tags: [POS]
 *     summary: Get sales report
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sales report retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 *
 * /pos/sales/{saleId}/refund:
 *   post:
 *     tags: [POS]
 *     summary: Refund a sale
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: saleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sale refunded successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Sale not found
 *       500:
 *         description: Server error
 */

router.post(
  "/sales",
  authenticate,
  authorize(["admin", "manager", "cashier"]),
  checkSubscription,
  posController.createSale
);

router.get(
  "/sales/report",
  authenticate,
  authorize(["admin", "manager"]),
  checkSubscription,
  posController.getSalesReport
);

router.post(
  "/sales/:saleId/refund",
  authenticate,
  authorize(["admin", "manager"]),
  checkSubscription,
  posController.refundSale
);

module.exports = router;
