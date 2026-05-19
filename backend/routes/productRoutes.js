const express = require("express");
const { protectAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");
const productController = require("../controllers/productController");

const router = express.Router();

// GET ALL PRODUCTS (public)
router.get("/", productController.getProducts);

// GET AUTOCOMPLETE SUGGESTIONS (public)
router.get("/autocomplete", productController.getAutocompleteSuggestions);

// GET RECOMMENDATIONS (public)
router.get("/recommendations", productController.getProductRecommendations);

// GET SINGLE PRODUCT (public)
router.get("/:id", productController.getProductById);

// CREATE PRODUCT (admin only, with image upload)
router.post("/", protectAdmin, upload.single("image"), productController.createProduct);

// GENERATE SEO (admin only)
router.post("/generate-seo", protectAdmin, productController.generateSEO);

// UPDATE PRODUCT (admin only, with optional image upload)
router.put("/:id", protectAdmin, upload.single("image"), productController.updateProduct);

// APPLY DISCOUNT TO PRODUCT (admin only)
router.put("/:id/apply-discount", protectAdmin, productController.applyDiscount);

// REMOVE DISCOUNT FROM PRODUCT (admin only)
router.put("/:id/remove-discount", protectAdmin, productController.removeDiscount);

// MARK PRODUCT AS CLEARANCE (admin only)
router.put("/:id/mark-clearance", protectAdmin, productController.markClearance);

// DELETE PRODUCT (admin only)
router.delete("/:id", protectAdmin, productController.deleteProduct);

module.exports = router;
