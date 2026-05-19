const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // --- EXISTING FIELDS ---
    name: {
      type: String,
      required: true,
      trim: true,
    },

    brand: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      default: "",
      trim: true,
    },

    shade: {
      type: String,
      default: "",
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      default: 0,
    },

    stock: {
      type: Number,
      default: 0,
    },

    description: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    metaTitle: {
      type: String,
      default: "",
    },

    metaDescription: {
      type: String,
      default: "",
    },

    metaKeywords: {
      type: String,
      default: "",
    },

    slug: {
      type: String,
      trim: true,
      default: undefined,
      index: {
        unique: true,
        sparse: true,
      },
    },

    imageAltText: {
      type: String,
      default: "",
    },

    rating: {
      type: Number,
      default: 0,
    },

    // --- INVENTORY FIELDS ---
    reorderLevel: {
      type: Number,
      default: 10,
    },

    maxStockLevel: {
      type: Number,
      default: 100,
    },

    lowStockThreshold: {
      type: Number,
      default: 5,
    },

    totalSold: {
      type: Number,
      default: 0,
    },

    stockStatus: {
      type: String,
      default: "In Stock",
      enum: ["In Stock", "Low Stock", "Out of Stock", "Overstock"],
    },

    lastRestockedAt: {
      type: Date,
      default: null,
    },

    // --- BUSINESS FIELDS ---
    costPrice: {
      type: Number,
      default: 0,
    },

    sellingPrice: {
      type: Number,
      default: 0,
    },

    profitMargin: {
      type: Number,
      default: 0,
    },

    supplierName: {
      type: String,
      default: "",
    },

    supplierContact: {
      type: String,
      default: "",
    },

    supplierDeliveryDays: {
      type: Number,
      default: 0,
    },

    // --- MAKEUP FIELDS ---
    expiryDate: {
      type: Date,
      default: null,
    },

    batchNumber: {
      type: String,
      default: "",
    },

    skinType: {
      type: String,
      default: "",
    },

    seasonTag: {
      type: String,
      default: "",
    },

    demandLevel: {
      type: String,
      default: "",
    },

    // --- ANALYTICS FIELDS ---
    totalViews: {
      type: Number,
      default: 0,
    },

    isTrending: {
      type: Boolean,
      default: false,
    },

    isDeadStock: {
      type: Boolean,
      default: false,
    },

    competitorPrice: {
      type: Number,
      default: 0,
    },

    // --- DISCOUNT & BUNDLES ---
    discountPercentage: {
      type: Number,
      default: 0,
    },
    isDiscounted: {
      type: Boolean,
      default: false,
    },
    discountedPrice: {
      type: Number,
      default: 0,
    },
    isClearance: {
      type: Boolean,
      default: false,
    },
    bundleIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bundle",
      },
    ],
  },
  { timestamps: true }
);

// Helper function to create slug
function createSlug(name, id) {
  if (!name) return undefined;

  const baseSlug = String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  if (!baseSlug) return undefined;

  return `${baseSlug}-${id.toString().slice(-6)}`;
}

// Pre-save hook
productSchema.pre("save", function () {
  // Remove empty slug because empty string causes duplicate key error
  if (this.slug === "" || this.slug === null) {
    this.slug = undefined;
  }

  // Generate unique slug if missing
  if (!this.slug && this.name) {
    this.slug = createSlug(this.name, this._id);
  }

  // If sellingPrice is missing or 0, use price
  if (!this.sellingPrice || Number(this.sellingPrice) <= 0) {
    this.sellingPrice = Number(this.price || 0);
  }

  // Calculate discount & clearance price
  if (this.isClearance && (!this.discountPercentage || this.discountPercentage === 0)) {
    this.discountPercentage = 25;
    this.isDiscounted = true;
  }

  if (this.isDiscounted && this.discountPercentage > 0) {
    const basePrice = Number(this.price || 0);
    this.discountedPrice = Math.round((basePrice - (basePrice * this.discountPercentage / 100)) * 100) / 100;
  } else {
    this.discountedPrice = 0;
    this.isDiscounted = false;
    this.discountPercentage = 0;
  }

  // Calculate profit margin
  const costPrice = Number(this.costPrice || 0);
  const sellingPrice = Number(this.sellingPrice || 0);

  if (sellingPrice > 0) {
    this.profitMargin = Math.round(
      ((sellingPrice - costPrice) / sellingPrice) * 100
    );
  } else {
    this.profitMargin = 0;
  }

  // Stock status logic
  const currentStock = Number(this.stock || 0);
  const currentReorderLevel = Number(this.reorderLevel || 10);
  const currentMaxStockLevel = Number(this.maxStockLevel || 100);

  if (currentStock <= 0) {
    this.stockStatus = "Out of Stock";
  } else if (currentStock <= currentReorderLevel) {
    this.stockStatus = "Low Stock";
  } else if (currentStock > currentMaxStockLevel) {
    this.stockStatus = "Overstock";
  } else {
    this.stockStatus = "In Stock";
  }
});

module.exports = mongoose.model("Product", productSchema);