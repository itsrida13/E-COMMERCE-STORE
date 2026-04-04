const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  brand: String,
  category: String,
  shade: String,
  price: {
    type: Number,
    required: true
  },
  stock: Number,
  description: String,
  image: String,
  metaTitle: String,
  metaDescription: String,
  metaKeywords: String,
  rating: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);