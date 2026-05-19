const express = require("express");
const { protectAdmin } = require("../middleware/auth");
const settingsController = require("../controllers/settingsController");

const router = express.Router();

// GET /api/settings
router.get("/", protectAdmin, settingsController.getSettings);

// PUT /api/settings
router.put("/", protectAdmin, settingsController.updateSettings);

module.exports = router;
