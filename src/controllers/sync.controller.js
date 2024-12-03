const Product = require('../models/Product');

exports.batchSync = async (req, res) => {
  try {
    const { products } = req.body;
    const syncResults = [];

    for (const product of products) {
      try {
        const existingProduct = await Product.findOne({ sku: product.sku });
        
        if (existingProduct) {
          // Compare timestamps to resolve conflicts
          if (new Date(product.updatedAt) > new Date(existingProduct.updatedAt)) {
            const updated = await Product.findByIdAndUpdate(
              existingProduct._id,
              { ...product, syncStatus: 'synced', lastSync: new Date() },
              { new: true }
            );
            syncResults.push({ sku: product.sku, status: 'updated', data: updated });
          } else {
            syncResults.push({ sku: product.sku, status: 'skipped', data: existingProduct });
          }
        } else {
          const newProduct = await Product.create({
            ...product,
            syncStatus: 'synced',
            lastSync: new Date()
          });
          syncResults.push({ sku: product.sku, status: 'created', data: newProduct });
        }
      } catch (error) {
        syncResults.push({ sku: product.sku, status: 'failed', error: error.message });
      }
    }

    res.json({ results: syncResults });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingSync = async (req, res) => {
  try {
    const pendingProducts = await Product.find({ syncStatus: 'pending' });
    res.json(pendingProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resolveConflicts = async (req, res) => {
  try {
    const { resolutions } = req.body;
    const results = [];

    for (const resolution of resolutions) {
      const { sku, action, data } = resolution;
      
      const product = await Product.findOne({ sku });
      if (!product) {
        results.push({ sku, status: 'failed', error: 'Product not found' });
        continue;
      }

      if (action === 'keep_local') {
        product.syncStatus = 'synced';
        await product.save();
        results.push({ sku, status: 'resolved', action: 'keep_local' });
      } else if (action === 'keep_remote') {
        await Product.findByIdAndUpdate(product._id, {
          ...data,
          syncStatus: 'synced',
          lastSync: new Date()
        });
        results.push({ sku, status: 'resolved', action: 'keep_remote' });
      }
    }

    res.json({ results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};