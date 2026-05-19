const mongoose = require("mongoose");

const stockHistorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  action: {
    type: String,
    enum: ["restock", "adjustment", "sale", "dead_stock"],
    required: true
  },
  quantityChanged: {
    type: Number,
    required: true
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  supplierName: String,
  purchaseCost: Number,
  batchNumber: String,
  expiryDate: Date,
  reason: String,
  note: String
}, { timestamps: true });

module.exports = mongoose.model("StockHistory", stockHistorySchema);
