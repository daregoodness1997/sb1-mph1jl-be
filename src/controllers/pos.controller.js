const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Team = require("../models/Team");
const { generateSaleNumber } = require("../utils/helpers");

const posController = {
  createSale: async (req, res) => {
    try {
      const { items, paymentMethod, discount = 0, notes } = req.body;

      // Validate items array
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Items are required" });
      }

      // Get team settings for tax rate
      const team = await Team.findById(req.user.teamId);
      const taxRate = team.settings.taxRate || 0;

      // Process items and calculate totals
      let subtotal = 0;
      const processedItems = [];

      for (const item of items) {
        const product = await Product.findOne({
          _id: item.productId,
          teamId: req.user.teamId,
        });

        if (!product) {
          return res.status(404).json({
            message: `Product not found: ${item.productId}`,
          });
        }

        if (product.quantity < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for product: ${product.name}`,
          });
        }

        const itemSubtotal = product.price * item.quantity;
        const itemDiscount = item.discount || 0;

        processedItems.push({
          product: product._id,
          quantity: item.quantity,
          priceAtSale: product.price,
          discount: itemDiscount,
          subtotal: itemSubtotal - itemDiscount,
        });

        subtotal += itemSubtotal - itemDiscount;

        // Update product quantity
        product.quantity -= item.quantity;
        await product.save();
      }

      const tax = (subtotal * taxRate) / 100;
      const total = subtotal + tax - discount;

      // Create sale record
      const sale = new Sale({
        saleNumber: await generateSaleNumber(req.user.teamId),
        teamId: req.user.teamId,
        cashierId: req.user.id,
        items: processedItems,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod,
        paymentStatus: "completed",
        notes,
      });

      await sale.save();

      res.status(201).json(sale);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getSalesReport: async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        cashierId,
        paymentMethod,
        minAmount,
        maxAmount,
      } = req.query;

      const query = { teamId: req.user.teamId };

      // Add date range filter
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      // Add other filters
      if (cashierId) query.cashierId = cashierId;
      if (paymentMethod) query.paymentMethod = paymentMethod;
      if (minAmount) query.total = { $gte: Number(minAmount) };
      if (maxAmount) {
        query.total = { ...query.total, $lte: Number(maxAmount) };
      }

      const sales = await Sale.find(query)
        .populate("cashierId", "firstName lastName")
        .populate("items.product", "name sku")
        .sort({ createdAt: -1 });

      // Calculate summary
      const summary = {
        totalSales: sales.length,
        totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
        averageTicket:
          sales.length > 0
            ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length
            : 0,
        paymentMethods: sales.reduce((acc, sale) => {
          acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + 1;
          return acc;
        }, {}),
      };

      res.json({
        sales,
        summary,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  refundSale: async (req, res) => {
    try {
      const { saleId } = req.params;
      const { reason } = req.body;

      const sale = await Sale.findOne({
        _id: saleId,
        teamId: req.user.teamId,
      });

      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }

      if (sale.paymentStatus === "refunded") {
        return res.status(400).json({ message: "Sale already refunded" });
      }

      // Return items to inventory
      for (const item of sale.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: item.quantity },
        });
      }

      sale.paymentStatus = "refunded";
      sale.refundReason = reason;
      sale.refundedAt = new Date();
      await sale.save();

      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = posController;
