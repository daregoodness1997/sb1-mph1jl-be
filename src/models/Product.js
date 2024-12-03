const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - sku
 *         - category
 *         - quantity
 *         - price
 *       properties:
 *         name:
 *           type: string
 *           description: Product name
 *         sku:
 *           type: string
 *           description: Stock keeping unit (unique identifier)
 *         category:
 *           type: string
 *           description: Product category
 *         quantity:
 *           type: number
 *           description: Available quantity
 *         price:
 *           type: number
 *           description: Product price
 *         description:
 *           type: string
 *           description: Product description
 *         lastSync:
 *           type: string
 *           format: date-time
 *           description: Last synchronization timestamp
 *         syncStatus:
 *           type: string
 *           enum: [pending, synced, failed]
 *           description: Synchronization status
 */

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
  },
  price: {
    type: Number,
    required: true,
  },
  description: String,
  lastSync: {
    type: Date,
    default: Date.now,
  },
  syncStatus: {
    type: String,
    enum: ['pending', 'synced', 'failed'],
    default: 'pending',
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);