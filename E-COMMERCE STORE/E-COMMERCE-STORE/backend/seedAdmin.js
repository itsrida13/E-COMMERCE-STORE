const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecommerce-store")
  .then(async () => {
    console.log("Seeding default admin...");
    const existing = await User.findOne({ email: "admin@admin.com" });
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);
      await User.create({ name: "Super Admin", email: "admin@admin.com", password: hashedPassword, role: "admin" });
      console.log("Super Admin seeded: admin@admin.com / admin123");
    } else {
      console.log("Admin already exists.");
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
