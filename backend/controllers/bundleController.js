const Bundle = require("../models/Bundle");
const Product = require("../models/Product");

exports.createBundle = async (req, res) => {
  try {
    const { name, products, discountPercentage, reason, createdByAI } = req.body;
    if (!name || !products || products.length === 0) {
      return res.status(400).json({ error: "Name and products are required" });
    }

    // Fetch products to calculate prices
    const productDocs = await Product.find({ _id: { $in: products } });
    if (productDocs.length === 0) {
      return res.status(400).json({ error: "Invalid products" });
    }

    const originalPrice = productDocs.reduce((sum, p) => sum + (p.price || 0), 0);
    const discount = parseFloat(discountPercentage) || 0;
    const bundlePrice = Math.round((originalPrice - (originalPrice * discount / 100)) * 100) / 100;

    const bundle = new Bundle({
      name,
      products,
      discountPercentage: discount,
      originalPrice,
      bundlePrice,
      isActive: true,
      reason: reason || "",
      createdByAI: createdByAI || false,
    });

    const saved = await bundle.save();
    
    // Update products to link to this bundle
    await Product.updateMany(
      { _id: { $in: products } },
      { $addToSet: { bundleIds: saved._id } }
    );

    res.status(201).json(saved);
  } catch (err) {
    console.error("Create bundle error:", err);
    res.status(500).json({ error: err.message || "Failed to create bundle" });
  }
};

exports.getBundles = async (req, res) => {
  try {
    const bundles = await Bundle.find().populate("products");
    res.json(bundles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getActiveBundles = async (req, res) => {
  try {
    const bundles = await Bundle.find({ isActive: true }).populate("products");
    res.json(bundles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateBundle = async (req, res) => {
  try {
    const { name, products, discountPercentage, isActive, reason } = req.body;
    const bundle = await Bundle.findById(req.params.id);
    if (!bundle) return res.status(404).json({ error: "Bundle not found" });

    if (name !== undefined) bundle.name = name;
    if (products !== undefined) bundle.products = products;
    if (discountPercentage !== undefined) bundle.discountPercentage = parseFloat(discountPercentage) || 0;
    if (isActive !== undefined) bundle.isActive = isActive;
    if (reason !== undefined) bundle.reason = reason;

    // Recalculate prices if products or discount changed
    if (products !== undefined || discountPercentage !== undefined) {
      const productDocs = await Product.find({ _id: { $in: bundle.products } });
      bundle.originalPrice = productDocs.reduce((sum, p) => sum + (p.price || 0), 0);
      bundle.bundlePrice = Math.round((bundle.originalPrice - (bundle.originalPrice * bundle.discountPercentage / 100)) * 100) / 100;
    }

    const saved = await bundle.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteBundle = async (req, res) => {
  try {
    const bundle = await Bundle.findByIdAndDelete(req.params.id);
    if (!bundle) return res.status(404).json({ error: "Bundle not found" });
    
    // Remove bundle from products
    await Product.updateMany(
      { bundleIds: req.params.id },
      { $pull: { bundleIds: req.params.id } }
    );

    res.json({ message: "Bundle deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
