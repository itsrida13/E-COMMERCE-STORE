const express = require("express");
const { protectAdmin } = require("../middleware/auth");
const bundleController = require("../controllers/bundleController");

const router = express.Router();

router.post("/", protectAdmin, bundleController.createBundle);
router.get("/", bundleController.getBundles);
router.get("/active", bundleController.getActiveBundles);
router.put("/:id", protectAdmin, bundleController.updateBundle);
router.delete("/:id", protectAdmin, bundleController.deleteBundle);

module.exports = router;
