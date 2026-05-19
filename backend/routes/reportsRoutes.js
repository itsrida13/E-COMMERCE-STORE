const express = require("express");
const { protectAdmin } = require("../middleware/auth");
const reportsController = require("../controllers/reportsController");

const router = express.Router();

router.get("/products", protectAdmin, reportsController.getProductsReport);
router.get("/inventory", protectAdmin, reportsController.getInventoryReport);
router.get("/sales", protectAdmin, reportsController.getSalesReport);
router.get("/customers", protectAdmin, reportsController.getCustomersReport);
router.get("/ai-insights", protectAdmin, reportsController.getAiInsightsReport);

module.exports = router;
