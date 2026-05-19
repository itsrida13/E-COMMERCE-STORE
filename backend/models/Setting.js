const mongoose = require("mongoose");

const SettingSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: "Glamour Beauty" },
    storeEmail: { type: String, default: "admin@glamourbeauty.com" },
    storePhone: { type: String, default: "" },
    storeAddress: { type: String, default: "" },
    currency: { type: String, default: "USD" },

    defaultReorderLevel: { type: Number, default: 10 },
    defaultMaxStockLevel: { type: Number, default: 100 },
    expiryAlertDays: { type: Number, default: 30 },
    lowStockAlerts: { type: Boolean, default: true },
    expiryAlerts: { type: Boolean, default: true },
    overstockAlerts: { type: Boolean, default: true },

    defaultReportFormat: { type: String, default: "csv" },
    includeInventoryValue: { type: Boolean, default: true },
    includeAIInsights: { type: Boolean, default: true },

    themeMode: { type: String, default: "light" },
    accentColor: { type: String, default: "pink" },

    emailNotifications: { type: Boolean, default: true },
    salesAlerts: { type: Boolean, default: true },
    inventoryAlerts: { type: Boolean, default: true },
    customerAlerts: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", SettingSchema);
