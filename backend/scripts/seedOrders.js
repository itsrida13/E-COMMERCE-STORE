/**
 * Seeds sample orders for analytics (run after products & users exist).
 * Usage: node scripts/seedOrders.js
 */
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const sampleAddresses = [
  {
    fullName: "Sarah Khan",
    email: "sarah@example.com",
    phone: "03001234567",
    address: "12 Mall Road",
    city: "Lahore",
    postalCode: "54000",
    country: "Pakistan",
  },
  {
    fullName: "Ayesha Ali",
    email: "ayesha@example.com",
    phone: "03211234567",
    address: "45 Clifton Block 5",
    city: "Karachi",
    postalCode: "75600",
    country: "Pakistan",
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const products = await Product.find().limit(20);
  const users = await User.find({ role: { $ne: "admin" } }).limit(5);
  if (!products.length) {
    console.log("No products found. Run: node seed.js or node seed15.js first");
    process.exit(1);
  }
  if (!users.length) {
    console.log("No users found. Register a user first, then run this script.");
    process.exit(1);
  }

  const existing = await Order.countDocuments();
  if (existing > 10) {
    console.log(`Already have ${existing} orders. Skipping seed (delete orders first to re-seed).`);
    process.exit(0);
  }

  const orders = [];
  const now = new Date();

  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const ordersThisMonth = 3 + Math.floor(Math.random() * 8);
    for (let i = 0; i < ordersThisMonth; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1 + Math.floor(Math.random() * 28));
      const user = users[Math.floor(Math.random() * users.length)];
      const itemCount = 1 + Math.floor(Math.random() * 3);
      const items = [];
      let total = 0;
      const used = new Set();
      for (let j = 0; j < itemCount; j++) {
        const p = products[Math.floor(Math.random() * products.length)];
        if (used.has(String(p._id))) continue;
        used.add(String(p._id));
        const qty = 1 + Math.floor(Math.random() * 2);
        items.push({ productId: p._id, quantity: qty });
        total += (p.price || 0) * qty;
      }
      if (!items.length) continue;
      orders.push({
        userId: user._id,
        items,
        totalPrice: Math.round(total * 100) / 100,
        shippingAddress: sampleAddresses[Math.floor(Math.random() * sampleAddresses.length)],
        paymentStatus: Math.random() > 0.2 ? "paid" : "pending",
        orderStatus: ["processing", "shipped", "delivered"][Math.floor(Math.random() * 3)],
        createdAt: d,
        updatedAt: d,
      });
    }
  }

  await Order.insertMany(orders);
  console.log(`Seeded ${orders.length} sample orders for analytics.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
