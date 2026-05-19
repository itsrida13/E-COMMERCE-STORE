const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  // Mapped user fields for dual compatibility
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },

  customerName: { type: String },
  email: { type: String },
  phone: { type: String },

  shippingAddress: {
    fullName: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    postalCode: { type: String },
    country: { type: String }
  },

  orderItems: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    },
    name: { type: String },
    image: { type: String },
    quantity: { type: Number },
    price: { type: Number }
  }],

  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    },
    quantity: { type: Number }
  }],

  bundles: [{
    bundle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bundle"
    },
    name: { type: String },
    price: { type: Number },
    quantity: { type: Number }
  }],

  paymentMethod: {
    type: String,
    required: true
  },

  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Refunded", "pending", "paid"],
    default: "Pending"
  },

  status: {
    type: String,
    enum: ["Processing", "Delivered", "Cancelled", "processing", "delivered", "cancelled"],
    default: "Processing"
  },

  orderStatus: {
    type: String,
    default: "processing"
  },

  totalPrice: {
    type: Number,
    required: true
  }
}, { timestamps: true });

// Pre-save synchronization hook (Synchronous arity-0 to prevent Kareem engine compatibility errors)
orderSchema.pre("save", function() {
  // Sync user/userId
  if (this.user && !this.userId) this.userId = this.user;
  if (this.userId && !this.user) this.user = this.userId;

  // Sync customerName/shippingAddress.fullName
  if (this.customerName && (!this.shippingAddress || !this.shippingAddress.fullName)) {
    this.shippingAddress = this.shippingAddress || {};
    this.shippingAddress.fullName = this.customerName;
  }
  if (this.shippingAddress?.fullName && !this.customerName) {
    this.customerName = this.shippingAddress.fullName;
  }

  // Sync email
  if (this.email && (!this.shippingAddress || !this.shippingAddress.email)) {
    this.shippingAddress = this.shippingAddress || {};
    this.shippingAddress.email = this.email;
  }
  if (this.shippingAddress?.email && !this.email) {
    this.email = this.shippingAddress.email;
  }

  // Sync phone
  if (this.phone && (!this.shippingAddress || !this.shippingAddress.phone)) {
    this.shippingAddress = this.shippingAddress || {};
    this.shippingAddress.phone = this.phone;
  }
  if (this.shippingAddress?.phone && !this.phone) {
    this.phone = this.shippingAddress.phone;
  }

  // Sync items / orderItems
  if (this.orderItems && this.orderItems.length > 0 && (!this.items || this.items.length === 0)) {
    this.items = this.orderItems.map(item => ({
      productId: item.product,
      quantity: item.quantity
    }));
  }
  if (this.items && this.items.length > 0 && (!this.orderItems || this.orderItems.length === 0)) {
    this.orderItems = this.items.map(item => {
      // Find matching item in orderItems to preserve name/price/image if they exist
      const existing = (this.orderItems || []).find(oi => oi.product?.toString() === item.productId?.toString());
      return {
        product: item.productId,
        quantity: item.quantity,
        name: existing?.name || "",
        price: existing?.price || 0,
        image: existing?.image || ""
      };
    });
  }

  // Sync status / orderStatus (case insensitivity and value mapping)
  if (this.status && !this.orderStatus) {
    this.orderStatus = this.status.toLowerCase();
  }
  if (this.orderStatus && !this.status) {
    const val = this.orderStatus.toLowerCase();
    this.status = val === "processing" ? "Processing" : val === "delivered" ? "Delivered" : val === "cancelled" ? "Cancelled" : "Processing";
  }

  // Sync paymentStatus (case insensitivity)
  if (this.paymentStatus) {
    const val = this.paymentStatus.toLowerCase();
    if (val === "pending") this.paymentStatus = "Pending";
    else if (val === "paid") this.paymentStatus = "Paid";
    else if (val === "failed") this.paymentStatus = "Failed";
    else if (val === "refunded") this.paymentStatus = "Refunded";
  }
});

module.exports = mongoose.model("Order", orderSchema);
