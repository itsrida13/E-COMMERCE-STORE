const Product = require("../models/Product");

// GET ALL PRODUCTS (public)
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET SINGLE PRODUCT (public)
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE PRODUCT (admin only, with image upload)
exports.createProduct = async (req, res) => {
  try {
    const { name, brand, category, price, stock, description, shade, metaTitle, metaDescription, metaKeywords } = req.body || {};
    if (!name || !price) {
      return res.status(400).json({ error: "Name and price are required" });
    }
    const image = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : req.body?.image || "";

    const product = new Product({
      name: String(name).trim(),
      brand: (brand || "").trim(),
      category: (category || "").trim(),
      shade: (shade || "").trim(),
      price: parseFloat(price) || 0,
      stock: parseInt(stock) || 0,
      description: (description || "").trim(),
      image: image || "",
      metaTitle: (metaTitle || "").trim(),
      metaDescription: (metaDescription || "").trim(),
      metaKeywords: (metaKeywords || "").trim(),
    });

    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create product" });
  }
};

// UPDATE PRODUCT (admin only, with optional image upload)
exports.updateProduct = async (req, res) => {
  try {
    const { name, brand, category, price, stock, description, image, shade, metaTitle, metaDescription, metaKeywords } =
      req.body || {};
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ error: "Product not found" });

    let imageUrl = image || product.image;
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: name !== undefined ? String(name).trim() : product.name,
        brand: brand !== undefined ? String(brand).trim() : product.brand,
        category:
          category !== undefined ? String(category).trim() : product.category,
        shade: shade !== undefined ? String(shade).trim() : product.shade,
        price: price !== undefined ? parseFloat(price) : product.price,
        stock: stock !== undefined ? parseInt(stock) : product.stock,
        description:
          description !== undefined
            ? String(description).trim()
            : product.description,
        image: imageUrl,
        metaTitle: metaTitle !== undefined ? String(metaTitle).trim() : product.metaTitle,
        metaDescription: metaDescription !== undefined ? String(metaDescription).trim() : product.metaDescription,
        metaKeywords: metaKeywords !== undefined ? String(metaKeywords).trim() : product.metaKeywords,
      },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update product" });
  }
};

// DELETE PRODUCT (admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete product" });
  }
};

// GET PRODUCT RECOMMENDATIONS (public / user logic)
// Rules: 1. Trending (mocked by highest rating/stock) 
//        2. Customers Also Bought (same category as the provided productId)
exports.getProductRecommendations = async (req, res) => {
  try {
    const { type, productId, category } = req.query;
    
    let recommendations = [];
    
    if (type === "trending") {
      // Products with highest rating, limit to 4
      recommendations = await Product.find().sort({ rating: -1, stock: -1 }).limit(4);
    } 
    else if (type === "related" || type === "also_bought") {
      // Find products in similar category, excluding the current one
      let query = {};
      if (category) {
        query.category = new RegExp(category, "i");
      }
      if (productId) {
        query._id = { $ne: productId };
      }
      recommendations = await Product.find(query).limit(4);
      
      // Fallback if none found
      if (recommendations.length === 0) {
        recommendations = await Product.find({ _id: { $ne: productId } }).limit(4);
      }
    } 
    else {
      // Default fallback: return random products (simulated by latest)
      recommendations = await Product.find().sort({ createdAt: -1 }).limit(4);
    }
    
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch recommendations" });
  }
};
