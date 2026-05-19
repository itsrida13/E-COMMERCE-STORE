const Product = require("../models/Product");
const StockHistory = require("../models/StockHistory");

const getStockStatus = (stock, reorderLevel, maxStockLevel) => {
  const safeStock = Number(stock || 0);
  const safeReorderLevel = Number(reorderLevel || 10);
  const safeMaxStockLevel = Number(maxStockLevel || 100);

  if (safeStock <= 0) return "Out of Stock";
  if (safeStock <= safeReorderLevel) return "Low Stock";
  if (safeStock > safeMaxStockLevel) return "Overstock";

  return "In Stock";
};

// GET /api/inventory
exports.getInventory = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    const inventory = products.map((product) => {
      const stock = Number(product.stock || 0);
      const reorderLevel = Number(product.reorderLevel || 10);
      const maxStockLevel = Number(product.maxStockLevel || 100);

      return {
        _id: product._id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        shade: product.shade,
        price: product.price,
        sellingPrice: product.sellingPrice,
        costPrice: product.costPrice,
        image: product.image,

        stock,
        reorderLevel,
        maxStockLevel,
        lowStockThreshold: product.lowStockThreshold,
        totalSold: product.totalSold || 0,
        stockStatus: getStockStatus(stock, reorderLevel, maxStockLevel),

        supplierName: product.supplierName || "No supplier",
        supplierContact: product.supplierContact || "",
        supplierDeliveryDays: product.supplierDeliveryDays || 0,

        expiryDate: product.expiryDate || null,
        batchNumber: product.batchNumber || "No batch",

        profitMargin: product.profitMargin || 0,
        demandLevel: product.demandLevel || "",
        isDeadStock: product.isDeadStock || false,
      };
    });

    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/inventory/stock-alerts
exports.getStockAlerts = async (req, res) => {
  try {
    const products = await Product.find();

    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let overstockCount = 0;
    let expiringSoonCount = 0;

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    products.forEach((product) => {
      const stock = Number(product.stock || 0);
      const reorderLevel = Number(product.reorderLevel || 10);
      const maxStockLevel = Number(product.maxStockLevel || 100);

      const valuePrice = Number(
        product.costPrice || product.sellingPrice || product.price || 0
      );

      totalStockValue += stock * valuePrice;

      const status = getStockStatus(stock, reorderLevel, maxStockLevel);

      if (status === "Low Stock") lowStockCount += 1;
      if (status === "Out of Stock") outOfStockCount += 1;
      if (status === "Overstock") overstockCount += 1;

      if (product.expiryDate) {
        const expiry = new Date(product.expiryDate);

        if (expiry > today && expiry <= thirtyDaysFromNow) {
          expiringSoonCount += 1;
        }
      }
    });

    res.json({
      totalStockValue,
      lowStockCount,
      outOfStockCount,
      overstockCount,
      expiringSoonCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/inventory/low-stock
exports.getLowStock = async (req, res) => {
  try {
    const products = await Product.find();

    const lowStockProducts = products.filter((product) => {
      const stock = Number(product.stock || 0);
      const reorderLevel = Number(product.reorderLevel || 10);

      return stock > 0 && stock <= reorderLevel;
    });

    res.json(lowStockProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/inventory/out-of-stock
exports.getOutOfStock = async (req, res) => {
  try {
    const products = await Product.find({ stock: { $lte: 0 } });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/inventory/:productId/restock
exports.restock = async (req, res) => {
  try {
    const {
      quantity,
      supplierName,
      purchaseCost,
      batchNumber,
      expiryDate,
      note,
    } = req.body;

    const addedQuantity = Number(quantity || 0);

    if (addedQuantity <= 0) {
      return res.status(400).json({ message: "Restock quantity must be greater than 0" });
    }

    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const previousStock = Number(product.stock || 0);
    const newStock = previousStock + addedQuantity;

    product.stock = newStock;
    product.lastRestockedAt = new Date();

    if (supplierName !== undefined) product.supplierName = supplierName;
    if (purchaseCost !== undefined && purchaseCost !== "") {
      product.costPrice = Number(purchaseCost || 0);
    }
    if (batchNumber !== undefined) product.batchNumber = batchNumber;
    if (expiryDate !== undefined && expiryDate !== "") {
      product.expiryDate = expiryDate;
    }

    product.stockStatus = getStockStatus(
      newStock,
      product.reorderLevel,
      product.maxStockLevel
    );

    await product.save();

    await StockHistory.create({
      productId: product._id,
      action: "restock",
      quantityChanged: addedQuantity,
      previousStock,
      newStock,
      reason: "Product restocked",
      note: note || "Restocked from admin inventory dashboard",
      supplierName: supplierName || product.supplierName || "",
      batchNumber: batchNumber || product.batchNumber || "",
    });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/inventory/:productId/adjust-stock
exports.adjustStock = async (req, res) => {
  try {
    const { quantity, reason, note } = req.body;

    const quantityChange = Number(quantity);

    if (Number.isNaN(quantityChange) || quantityChange === 0) {
      return res.status(400).json({ message: "Adjustment quantity must be a valid non-zero number" });
    }

    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const previousStock = Number(product.stock || 0);
    const newStock = previousStock + quantityChange;

    if (newStock < 0) {
      return res.status(400).json({
        message: `Stock cannot become negative. Current stock: ${previousStock}, adjustment: ${quantityChange}`,
      });
    }

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
      quantityChanged: quantityChange,
      previousStock,
      newStock,
      reason: reason || "Manual stock adjustment",
      note: note || "Adjusted from admin inventory dashboard",
    });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/inventory/:productId/history
exports.getStockHistory = async (req, res) => {
  try {
    const history = await StockHistory.find({
      productId: req.params.productId,
    })
      .populate("productId", "name image")
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};