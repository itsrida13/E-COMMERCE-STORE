const express = require("express");
const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const jwt = require("jsonwebtoken");

const router = express.Router();

const getUserFromToken = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch {
    return null;
  }
};

// GET /api/wishlist - Get user's wishlist
router.get("/", async (req, res) => {
  try {
    const userId = getUserFromToken(req);
    if (!userId) return res.status(401).json("Login required");

    let wishlist = await Wishlist.findOne({ userId }).populate("products");
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId, products: [] });
    }
    res.json(wishlist.products);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// POST /api/wishlist/:productId - Add to wishlist
router.post("/:productId", async (req, res) => {
  try {
    const userId = getUserFromToken(req);
    if (!userId) return res.status(401).json("Login required");

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [] });
    }

    if (!wishlist.products.includes(req.params.productId)) {
      wishlist.products.push(req.params.productId);
      await wishlist.save();
    }
    
    await wishlist.populate("products");
    res.json(wishlist.products);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// DELETE /api/wishlist/:productId - Remove from wishlist
router.delete("/:productId", async (req, res) => {
  try {
    const userId = getUserFromToken(req);
    if (!userId) return res.status(401).json("Login required");

    const wishlist = await Wishlist.findOne({ userId });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(
        (id) => id.toString() !== req.params.productId
      );
      await wishlist.save();
      await wishlist.populate("products");
      res.json(wishlist.products);
    } else {
      res.json([]);
    }
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
