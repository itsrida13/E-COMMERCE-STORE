const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Get user ID from token
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

// POST /api/orders - Create order (logged-in users)
router.post("/", async (req, res) => {
  try {
    const userId = getUserFromToken(req);
    if (!userId) return res.status(401).json("Login required");

    const { items, totalPrice, shippingAddress } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json("Items are required");
    }

    const requiredFields = ["fullName", "email", "phone", "address", "city", "postalCode", "country"];
    if (!shippingAddress || typeof shippingAddress !== "object") {
      return res.status(400).json("Shipping address is required");
    }
    for (const field of requiredFields) {
      if (!shippingAddress[field] || String(shippingAddress[field]).trim() === "") {
        return res.status(400).json(`${field} is required`);
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingAddress.email.trim())) {
      return res.status(400).json("Invalid email format");
    }

    const digitsOnly = shippingAddress.phone.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      return res.status(400).json("Phone number must have at least 10 digits");
    }

    const order = new Order({
      userId,
      items,
      totalPrice: totalPrice || 0,
      shippingAddress: {
        fullName: String(shippingAddress.fullName).trim(),
        email: String(shippingAddress.email).trim().toLowerCase(),
        phone: String(shippingAddress.phone).trim(),
        address: String(shippingAddress.address).trim(),
        city: String(shippingAddress.city).trim(),
        postalCode: String(shippingAddress.postalCode).trim(),
        country: String(shippingAddress.country).trim()
      },
      paymentStatus: "pending",
      orderStatus: "processing"
    });

    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// GET /api/orders - Get all orders (admin only)
router.get("/", async (req, res) => {
  try {
    const userId = getUserFromToken(req);
    if (!userId) return res.status(401).json("Login required");

    const User = require("../models/User");
    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json("Admin access required");
    }

    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("items.productId", "name price brand");
    res.json(orders);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// GET /api/orders/user - Get current user's orders
router.get("/user", async (req, res) => {
  try {
    const userId = getUserFromToken(req);
    if (!userId) return res.status(401).json("Login required");

    const orders = await Order.find({ userId })
      .populate("items.productId", "name price brand image");
    res.json(orders);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// PUT /api/orders/:id/status - Update order status (admin)
router.put("/:id/status", async (req, res) => {
  try {
    const userId = getUserFromToken(req);
    if (!userId) return res.status(401).json("Login required");

    const User = require("../models/User");
    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json("Admin access required");
    }

    const { orderStatus } = req.body;
    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus },
      { new: true }
    ).populate("items.productId", "name price");
    res.json(updated);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
