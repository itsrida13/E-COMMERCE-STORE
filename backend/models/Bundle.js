const mongoose = require("mongoose");

const bundleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
    ],
    discountPercentage: {
      type: Number,
      default: 0,
    },
    bundlePrice: {
      type: Number,
      required: true,
      default: 0,
    },
    originalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    reason: {
      type: String,
      default: "",
    },
    createdByAI: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bundle", bundleSchema);
