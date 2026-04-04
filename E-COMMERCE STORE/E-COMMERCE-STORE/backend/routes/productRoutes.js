const express = require("express");
const { protectAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");
const productController = require("../controllers/productController");

const router = express.Router();

// GET ALL PRODUCTS (public)
router.get("/", productController.getProducts);

// GET RECOMMENDATIONS (public)
router.get("/recommendations", productController.getProductRecommendations);

// GET SINGLE PRODUCT (public)
router.get("/:id", productController.getProductById);

// CREATE PRODUCT (admin only, with image upload)
router.post("/", protectAdmin, upload.single("image"), productController.createProduct);

// UPDATE PRODUCT (admin only, with optional image upload)
router.put("/:id", protectAdmin, upload.single("image"), productController.updateProduct);

// DELETE PRODUCT (admin only)
router.delete("/:id", protectAdmin, productController.deleteProduct);

module.exports = router;
