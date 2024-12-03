const express = require('express');
const router = express.Router();
const syncController = require('../controllers/sync.controller');
const { restrictTo } = require('../middleware/auth');

/**
 * @swagger
 * /sync/batch:
 *   post:
 *     summary: Batch synchronize products
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Sync results
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/batch', restrictTo('admin'), syncController.batchSync);

/**
 * @swagger
 * /sync/pending:
 *   get:
 *     summary: Get pending sync items
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending sync items
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/pending', syncController.getPendingSync);

/**
 * @swagger
 * /sync/resolve:
 *   post:
 *     summary: Resolve sync conflicts
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resolutions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     sku:
 *                       type: string
 *                     action:
 *                       type: string
 *                       enum: [keep_local, keep_remote]
 *                     data:
 *                       $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Conflicts resolved
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/resolve', restrictTo('admin'), syncController.resolveConflicts);

module.exports = router;