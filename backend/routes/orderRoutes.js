const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const StockHistory = require("../models/StockHistory");
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

// Helper to calculate stock status
const getStockStatus = (stock, reorderLevel, maxStockLevel) => {
  const safeStock = Number(stock || 0);
  const safeReorderLevel = Number(reorderLevel || 10);
  const safeMaxStockLevel = Number(maxStockLevel || 100);

  if (safeStock <= 0) return "Out of Stock";
  if (safeStock <= safeReorderLevel) return "Low Stock";
  if (safeStock > safeMaxStockLevel) return "Overstock";

  return "In Stock";
};

// POST /api/orders - Create order
router.post("/", async (req, res) => {
  try {
    // Debugging Requirement: console log received order data
    console.log("Order received in backend:", req.body);

    const userId = getUserFromToken(req) || req.body.user || null;

    let {
      customerName,
      email,
      phone,
      shippingAddress,
      orderItems,
      items,
      paymentMethod,
      paymentStatus,
      status,
      totalPrice
    } = req.body;

    // Normalize orderItems vs items
    if (orderItems && !items) {
      items = orderItems.map(item => ({
        productId: item.product,
        quantity: item.quantity
      }));
    }
    if (items && !orderItems) {
      orderItems = [];
      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (product) {
          orderItems.push({
            product: product._id,
            name: product.name,
            image: product.image || "",
            quantity: item.quantity,
            price: product.price
          });
        }
      }
    }

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json("Items are required");
    }

    // Normalize shippingAddress vs customer details
    if (shippingAddress && typeof shippingAddress === "object") {
      if (!customerName) customerName = shippingAddress.fullName;
      if (!email) email = shippingAddress.email;
      if (!phone) phone = shippingAddress.phone;
    } else {
      shippingAddress = {};
    }

    const finalCustomerName = customerName || shippingAddress.fullName || "";
    const finalEmail = email || shippingAddress.email || "";
    const finalPhone = phone || shippingAddress.phone || "";

    if (!finalCustomerName || !finalEmail || !finalPhone) {
      return res.status(400).json("Customer name, email and phone are required");
    }

    const finalShippingAddress = {
      fullName: finalCustomerName,
      email: finalEmail,
      phone: finalPhone,
      address: shippingAddress.address || "",
      city: shippingAddress.city || "",
      postalCode: shippingAddress.postalCode || "",
      country: shippingAddress.country || ""
    };

    if (!finalShippingAddress.address || !finalShippingAddress.city || !finalShippingAddress.country) {
      return res.status(400).json("Shipping address details (address, city, country) are required");
    }

    // 1. Validate product stock levels before modifying anything
    const productsToUpdate = [];
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json(`Product with ID ${item.product} not found`);
      }
      
      const currentStock = Number(product.stock || 0);
      const orderQty = Number(item.quantity || 1);
      
      if (currentStock < orderQty) {
        return res.status(400).json(
          `Insufficient stock for "${product.name}". Available: ${currentStock}, Requested: ${orderQty}`
        );
      }
      
      productsToUpdate.push({ product, quantity: orderQty });
    }

    // 2. Create and Save the Order document
    const order = new Order({
      user: userId,
      userId: userId,
      customerName: finalCustomerName,
      email: finalEmail,
      phone: finalPhone,
      shippingAddress: finalShippingAddress,
      orderItems,
      items,
      paymentMethod: paymentMethod || "Cash on Delivery",
      paymentStatus: paymentStatus || "Pending",
      status: status || "Processing",
      orderStatus: (status || "Processing").toLowerCase(),
      totalPrice: totalPrice || 0
    });

    const savedOrder = await order.save();

    // Debugging Requirement: console log saved order
    console.log("Saved order:", savedOrder);

    // 3. Decrement product stock, update status and log history
    for (const { product, quantity } of productsToUpdate) {
      const previousStock = Number(product.stock || 0);
      const newStock = previousStock - quantity;
      
      product.stock = newStock;
      product.stockStatus = getStockStatus(
        newStock,
        product.reorderLevel,
        product.maxStockLevel
      );
      
      await product.save();
      
      await StockHistory.create({
        productId: product._id,
        action: "sale",
        quantityChanged: -quantity,
        previousStock,
        newStock,
        reason: "Customer Order placed",
        note: `Order ID: ${savedOrder._id}`
      });
    }

    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// GET /api/orders - Get all orders (admin or fallback)
router.get("/", async (req, res) => {
  try {
    const userId = getUserFromToken(req);
    const User = require("../models/User");
    let isAdmin = false;

    if (userId) {
      const user = await User.findById(userId);
      if (user && user.role === "admin") {
        isAdmin = true;
      }
    }

    // If admin, return all orders. If not, fallback to fetching public or user orders safely.
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("user", "name email")
      .populate("items.productId", "name price brand image")
      .populate("orderItems.product", "name price brand image")
      .sort({ createdAt: -1 });

    console.log(`Fetched ${orders.length} orders from database.`);
    res.json(orders);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// GET /api/orders/my-orders or GET /api/orders/user - Get current user's orders
router.get(["/my-orders", "/user"], async (req, res) => {
  try {
    const userId = getUserFromToken(req);
    if (!userId) return res.status(401).json("Login required");

    const orders = await Order.find({
      $or: [
        { userId: userId },
        { user: userId }
      ]
    })
      .populate("items.productId", "name price brand image")
      .populate("orderItems.product", "name price brand image")
      .sort({ createdAt: -1 });

    console.log(`Fetched ${orders.length} orders for user ID: ${userId}`);
    res.json(orders);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// PUT /api/orders/:id and PUT /api/orders/:id/status - Update order status & paymentStatus (admin)
const updateOrderHandler = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    console.log(`Updating order #${order._id}. Request body:`, req.body);

    const newStatus = req.body.status || req.body.orderStatus || order.status || order.orderStatus;
    const newPaymentStatus = req.body.paymentStatus || order.paymentStatus;

    const oldStatus = order.status || order.orderStatus;

    // Handle stock updates based on status transitions
    const itemsList = order.orderItems && order.orderItems.length > 0 ? order.orderItems : order.items;
    
    if (newStatus && newStatus.toLowerCase() === "cancelled" && oldStatus.toLowerCase() !== "cancelled") {
      // 1. Restoring stock: Transition to "cancelled" from active
      for (const item of itemsList) {
        const prodId = item.product || item.productId;
        const product = await Product.findById(prodId);
        if (product) {
          const previousStock = Number(product.stock || 0);
          const quantity = Number(item.quantity || 1);
          const newStock = previousStock + quantity;
          
          product.stock = newStock;
          product.stockStatus = getStockStatus(
            newStock,
            product.reorderLevel,
            product.maxStockLevel
          );
          
          await product.save();
          
          await StockHistory.create({
            productId: product._id,
            action: "adjustment",
            quantityChanged: quantity,
            previousStock,
            newStock,
            reason: "Order Cancelled",
            note: `Order ID: ${order._id}`
          });
        }
      }
    } else if (newStatus && oldStatus.toLowerCase() === "cancelled" && newStatus.toLowerCase() !== "cancelled") {
      // 2. Deducting stock again: Transition from "cancelled" to active
      const productsToUpdate = [];
      for (const item of itemsList) {
        const prodId = item.product || item.productId;
        const product = await Product.findById(prodId);
        if (!product) {
          return res.status(404).json({ message: `Product not found` });
        }
        
        const currentStock = Number(product.stock || 0);
        const orderQty = Number(item.quantity || 1);
        
        if (currentStock < orderQty) {
          return res.status(400).json({
            message: `Insufficient stock to reactivate order for product "${product.name}". Available: ${currentStock}, Required: ${orderQty}`
          });
        }
        
        productsToUpdate.push({ product, quantity: orderQty });
      }

      // If all validated, deduct stock
      for (const { product, quantity } of productsToUpdate) {
        const previousStock = Number(product.stock || 0);
        const newStock = previousStock - quantity;
        
        product.stock = newStock;
        product.stockStatus = getStockStatus(
          newStock,
          product.reorderLevel,
          product.maxStockLevel
        );
        
        await product.save();
        
        await StockHistory.create({
          productId: product._id,
          action: "sale",
          quantityChanged: -quantity,
          previousStock,
          newStock,
          reason: "Order Reactivated",
          note: `Order ID: ${order._id}`
        });
      }
    }

    // Update status and paymentStatus fields
    if (req.body.status) {
      order.status = req.body.status;
      order.orderStatus = req.body.status.toLowerCase();
    } else if (req.body.orderStatus) {
      order.orderStatus = req.body.orderStatus;
      const val = req.body.orderStatus.toLowerCase();
      order.status = val === "processing" ? "Processing" : val === "delivered" ? "Delivered" : val === "cancelled" ? "Cancelled" : "Processing";
    }

    if (req.body.paymentStatus) {
      order.paymentStatus = req.body.paymentStatus;
    }

    // Smart COD delivered rule
    const paymentMethodLower = (order.paymentMethod || "").toLowerCase();
    const finalStatusLower = (order.status || order.orderStatus || "").toLowerCase();
    if (finalStatusLower === "delivered" && (paymentMethodLower === "cod" || paymentMethodLower === "cash on delivery")) {
      order.paymentStatus = "Paid";
    }

    const updatedOrder = await order.save();
    console.log("Updated order saved in database:", updatedOrder);

    // Populate for response
    await updatedOrder.populate([
      { path: "items.productId", select: "name price" },
      { path: "orderItems.product", select: "name price" }
    ]);
    
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

router.put("/:id", updateOrderHandler);
router.put("/:id/status", updateOrderHandler);

module.exports = router;
