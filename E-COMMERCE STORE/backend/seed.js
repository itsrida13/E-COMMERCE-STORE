const mongoose = require("mongoose");
const Product = require("./models/Product");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    await Product.deleteMany({});
    
    const products = [
      {
        name: "Luminous Silk Foundation",
        brand: "Glow Beauty",
        category: "Face",
        shade: "Light Medium 4",
        price: 45.00,
        stock: 50,
        description: "A lightweight liquid foundation that achieves a radiant, silky finish.",
        image: "" // Empty or place a default URL if needed
      },
      {
        name: "Velvet Matte Lipstick",
        brand: "Luxe Kiss",
        category: "Lips",
        shade: "Ruby Red",
        price: 24.50,
        stock: 120,
        description: "Intense color with a luxurious matte finish that lasts all day.",
        image: ""
      },
      {
        name: "Volume Mascara",
        brand: "LashPop",
        category: "Eyes",
        shade: "Ultra Black",
        price: 18.00,
        stock: 80,
        description: "Adds dramatic volume and length with a clump-free formula.",
        image: ""
      }
    ];

    await Product.insertMany(products);
    console.log("Makeup products seeded successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
