const express = require("express");
const router = express.Router();

const {
  getInventory,
  getLowStock,
  getOutOfStock,
  adjustStock,
  restock,
  getStockAlerts,
  getStockHistory,
} = require("../controllers/inventoryController");

// Inventory list
router.get("/", getInventory);

// KPI summary cards
router.get("/stock-alerts", getStockAlerts);

// Low stock and out of stock
router.get("/low-stock", getLowStock);
router.get("/out-of-stock", getOutOfStock);

// Stock actions
router.put("/:productId/restock", restock);
router.put("/:productId/adjust-stock", adjustStock);

// Stock history
router.get("/:productId/history", getStockHistory);

module.exports = router;