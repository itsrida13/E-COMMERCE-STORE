const Product = require("../models/Product");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// GET ALL PRODUCTS (public)
exports.getProducts = async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, rating, search } = req.query;
    let query = {};

    // NLP basic matching for search e.g. "shoes under 50"
    if (search) {
      const text = search.toLowerCase();
      // Look for "under x" or "less than x"
      const priceMatch = text.match(/under\s*\$?\s*(\d+)/) || text.match(/less than\s*\$?\s*(\d+)/);
      let maxP = priceMatch ? parseInt(priceMatch[1]) : maxPrice;
      
      const searchTerms = text.replace(/under\s*\$?\s*\d+/g, "")
        .replace(/(show me|find|looking for|i want|cheap|best)/g, "")
        .trim().split(" ").filter(word => word.length > 2);

      if (searchTerms.length > 0) {
        query.$or = searchTerms.map(term => ({
          $or: [
            { name: { $regex: term, $options: "i" } },
            { category: { $regex: term, $options: "i" } },
            { brand: { $regex: term, $options: "i" } }
          ]
        }));
      }

      if (maxP) {
        query.price = { ...query.price, $lte: maxP };
      }
    }

    if (category) query.category = new RegExp(category, "i");
    if (brand) query.brand = new RegExp(brand, "i");
    if (minPrice && !query.price?.$lte) {
      query.price = { $gte: Number(minPrice) };
    } else if (minPrice) {
      query.price.$gte = Number(minPrice);
    }
    if (maxPrice && !query.price) {
      query.price = { $lte: Number(maxPrice) };
    } else if (maxPrice && query.price) {
      query.price.$lte = query.price.$lte ? Math.min(query.price.$lte, Number(maxPrice)) : Number(maxPrice);
    }
    if (rating) query.rating = { $gte: Number(rating) };

    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET AUTOCOMPLETE SUGGESTIONS (public)
exports.getAutocompleteSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const text = q.toLowerCase();
    
    // Check if it's an NLP sort of query to suggest "Products under $X"
    const priceMatch = text.match(/under\s*\$?\s*(\d+)/) || text.match(/less than\s*\$?\s*(\d+)/);
    
    // Basic term based matching
    const searchTerms = text.replace(/under\s*\$?\s*\d+/g, "").trim().split(" ").filter(w => w.length > 1);
    
    let query = {};
    if (searchTerms.length > 0) {
      query.$or = searchTerms.map(term => ({
        $or: [
          { name: { $regex: term, $options: "i" } },
          { category: { $regex: term, $options: "i" } }
        ]
      }));
    }
    if (priceMatch) {
      query.price = { $lte: parseInt(priceMatch[1]) };
    }

    // Limit to 5 suggestions
    const products = await Product.find(query).limit(5).select("name price image category slug");
    
    // We can map these directly
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET SINGLE PRODUCT (public)
exports.getProductById = async (req, res) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const product = isObjectId 
      ? await Product.findById(req.params.id) 
      : await Product.findOne({ slug: req.params.id });
      
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE PRODUCT (admin only, with image upload)
exports.createProduct = async (req, res) => {
  try {
    const { 
      name, brand, category, price, stock, description, shade, metaTitle, metaDescription, metaKeywords, slug, imageAltText,
      costPrice, sellingPrice, competitorPrice, reorderLevel, maxStockLevel, supplierName, supplierDeliveryDays, lastRestockedAt,
      expiryDate, batchNumber, skinType, seasonTag, demandLevel 
    } = req.body || {};
    
    if (!name || !price) {
      return res.status(400).json({ error: "Name and price are required" });
    }
    const image = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : req.body?.image || "";

    const productSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

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
      slug: productSlug,
      imageAltText: (imageAltText || "").trim(),
      
      // NEW FIELDS
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
      sellingPrice: sellingPrice ? parseFloat(sellingPrice) : undefined,
      competitorPrice: competitorPrice ? parseFloat(competitorPrice) : undefined,
      reorderLevel: reorderLevel ? parseInt(reorderLevel) : undefined,
      maxStockLevel: maxStockLevel ? parseInt(maxStockLevel) : undefined,
      supplierName: supplierName ? String(supplierName).trim() : undefined,
      supplierDeliveryDays: supplierDeliveryDays ? parseInt(supplierDeliveryDays) : undefined,
      lastRestockedAt: lastRestockedAt || undefined,
      expiryDate: expiryDate || undefined,
      batchNumber: batchNumber ? String(batchNumber).trim() : undefined,
      skinType: skinType ? String(skinType).trim() : undefined,
      seasonTag: seasonTag ? String(seasonTag).trim() : undefined,
      demandLevel: demandLevel ? String(demandLevel).trim() : undefined,
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
    const { 
      name, brand, category, price, stock, description, image, shade, metaTitle, metaDescription, metaKeywords, slug, imageAltText,
      costPrice, sellingPrice, competitorPrice, reorderLevel, maxStockLevel, supplierName, supplierDeliveryDays, lastRestockedAt,
      expiryDate, batchNumber, skinType, seasonTag, demandLevel 
    } = req.body || {};
    
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    let imageUrl = image || product.image;
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    let updatedSlug = product.slug;
    if (slug !== undefined) {
      updatedSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    } else if (name && name !== product.name) {
      updatedSlug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const updateData = {
      name: name !== undefined ? String(name).trim() : product.name,
      brand: brand !== undefined ? String(brand).trim() : product.brand,
      category: category !== undefined ? String(category).trim() : product.category,
      shade: shade !== undefined ? String(shade).trim() : product.shade,
      price: price !== undefined ? parseFloat(price) : product.price,
      stock: stock !== undefined ? parseInt(stock) : product.stock,
      description: description !== undefined ? String(description).trim() : product.description,
      image: imageUrl,
      metaTitle: metaTitle !== undefined ? String(metaTitle).trim() : product.metaTitle,
      metaDescription: metaDescription !== undefined ? String(metaDescription).trim() : product.metaDescription,
      metaKeywords: metaKeywords !== undefined ? String(metaKeywords).trim() : product.metaKeywords,
      slug: updatedSlug,
      imageAltText: imageAltText !== undefined ? String(imageAltText).trim() : product.imageAltText,
      
      // NEW FIELDS
      costPrice: costPrice !== undefined && costPrice !== "" ? parseFloat(costPrice) : product.costPrice,
      sellingPrice: sellingPrice !== undefined && sellingPrice !== "" ? parseFloat(sellingPrice) : product.sellingPrice,
      competitorPrice: competitorPrice !== undefined && competitorPrice !== "" ? parseFloat(competitorPrice) : product.competitorPrice,
      reorderLevel: reorderLevel !== undefined && reorderLevel !== "" ? parseInt(reorderLevel) : product.reorderLevel,
      maxStockLevel: maxStockLevel !== undefined && maxStockLevel !== "" ? parseInt(maxStockLevel) : product.maxStockLevel,
      supplierName: supplierName !== undefined ? String(supplierName).trim() : product.supplierName,
      supplierDeliveryDays: supplierDeliveryDays !== undefined && supplierDeliveryDays !== "" ? parseInt(supplierDeliveryDays) : product.supplierDeliveryDays,
      lastRestockedAt: lastRestockedAt !== undefined && lastRestockedAt !== "" ? lastRestockedAt : product.lastRestockedAt,
      expiryDate: expiryDate !== undefined && expiryDate !== "" ? expiryDate : product.expiryDate,
      batchNumber: batchNumber !== undefined ? String(batchNumber).trim() : product.batchNumber,
      skinType: skinType !== undefined ? String(skinType).trim() : product.skinType,
      seasonTag: seasonTag !== undefined ? String(seasonTag).trim() : product.seasonTag,
      demandLevel: demandLevel !== undefined ? String(demandLevel).trim() : product.demandLevel,
    };

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    // Explicitly run save to trigger pre-save hooks for dynamic calculations like profit margin and stock status
    const doc = await Product.findById(req.params.id);
    if(doc) await doc.save();
    
    res.json(updated || doc);
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

// POST /api/products/generate-seo
exports.generateSEO = async (req, res) => {
  try {
    const { name, category, brand, features, audience, skin_type, shade, price_range, usp } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      // Fallback AI simulation if no API key is provided
      const seoTitle = name ? `Buy ${name} | Glamour Beauty` : "Buy Best Makeup Products | Glamour Beauty";
      const metaDescription = `Discover the perfect ${category || 'beauty product'} with ${brand || 'our premium'} ${name || 'selection'}. ${features ? features.substring(0, 80) + '...' : 'High quality and long-lasting.'}`;
      const keywords = [name, category, brand, "beauty", "makeup", "cosmetics", shade, "online store"].filter(Boolean).join(", ").toLowerCase();
      const slug = (name || "product").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const imageAltText = `${brand ? brand + ' ' : ''}${name || 'Product'} ${category ? ' - ' + category : ''}`;

      return res.json({
        seoTitle,
        metaDescription,
        keywords,
        slug,
        imageAltText
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert SEO specialist for an e-commerce makeup store.

Generate high-converting SEO metadata for the following product:

Product Name: ${name || "N/A"}
Category: ${category || "N/A"}
Brand: ${brand || "N/A"}
Key Features: ${features || "N/A"}
Target Audience: ${audience || "N/A"}
Skin Type (if applicable): ${skin_type || "N/A"}
Shade/Color (if applicable): ${shade || "N/A"}
Price Range: ${price_range || "N/A"}
Unique Selling Points: ${usp || "N/A"}

Requirements:
1. Generate an SEO-optimized Title (max 60 characters, catchy, includes main keyword)
2. Generate a Meta Description (150-160 characters, persuasive, includes keywords, call-to-action)
3. Generate 10-15 SEO Keywords (mix of short-tail + long-tail), comma separated
4. Generate a URL Slug (short, clean, keyword-rich)
5. Suggest 1 ALT text example for the main product image (SEO-friendly)

Guidelines:
- Focus on beauty/makeup niche SEO
- Use trending keywords in cosmetics industry
- Avoid keyword stuffing
- Keep language natural and engaging

Output format strictly as JSON like this (no markdown block, just raw JSON):
{
  "seoTitle": "...",
  "metaDescription": "...",
  "keywords": "...",
  "slug": "...",
  "imageAltText": "..."
}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/^\`\`\`json/i, "").replace(/^\`\`\`/i, "").replace(/\`\`\`$/i, "").trim();
    
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err) {
    console.error("AI SEO Generation Error:", err);
    res.status(500).json({ error: "Failed to generate SEO: " + err.message });
  }
};

exports.applyDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const { percentage } = req.body;
    
    if (percentage === undefined || isNaN(percentage) || percentage < 0 || percentage > 100) {
      return res.status(400).json({ error: "Valid percentage between 0 and 100 is required" });
    }

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    product.discountPercentage = parseFloat(percentage);
    product.isDiscounted = parseFloat(percentage) > 0;
    product.isClearance = false; // clear clearance state if explicitly applying a discount

    await product.save();
    res.json(product);
  } catch (err) {
    console.error("Apply discount error:", err);
    res.status(500).json({ error: "Failed to apply discount: " + err.message });
  }
};

exports.markClearance = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    product.isClearance = true;
    product.isDiscounted = true;
    product.discountPercentage = 25; // default clearance discount

    await product.save();
    res.json(product);
  } catch (err) {
    console.error("Mark clearance error:", err);
    res.status(500).json({ error: "Failed to mark clearance: " + err.message });
  }
};

exports.removeDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    product.isDiscounted = false;
    product.isClearance = false;
    product.discountPercentage = 0;
    product.discountedPrice = 0;

    await product.save();
    res.json(product);
  } catch (err) {
    console.error("Remove discount error:", err);
    res.status(500).json({ error: "Failed to remove discount: " + err.message });
  }
};
