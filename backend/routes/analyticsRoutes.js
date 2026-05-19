const express = require("express");
const { protectAdmin } = require("../middleware/auth");
const analyticsController = require("../controllers/analyticsController");

const router = express.Router();

router.get("/dashboard", protectAdmin, analyticsController.getDashboard);
router.get("/summary", protectAdmin, analyticsController.getSummary);
router.get("/sales-predictions", protectAdmin, analyticsController.getSalesPredictions);
router.get("/recommendations", protectAdmin, analyticsController.getRecommendations);
router.get("/ai-insights", protectAdmin, analyticsController.getAiInsights);

module.exports = router;
