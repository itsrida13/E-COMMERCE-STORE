const mongoose = require("mongoose");
const Product = require("./models/Product");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecommerce-store")
  .then(async () => {
    console.log("Connected to MongoDB for bulk seeding...");
    
    const products = [
      {
        name: "Matte Revolution Lipstick", brand: "Glow Beauty", category: "Lips", shade: "Pillow Talk", price: 34.00, stock: 100,
        description: "A matte lipstick that features 3D glow pigments to help lips appear wider and fuller.",
        metaTitle: "Buy Matte Revolution Lipstick | Glow Beauty",
        metaDescription: "Shop the iconic Matte Revolution Lipstick. Long-lasting, hydrating matte finish for fuller looking lips.",
        metaKeywords: "matte lipstick, pillow talk, lip makeup, glow beauty"
      },
      {
        name: "Radiant Creamy Concealer", brand: "Luxe Kiss", category: "Face", shade: "Vanilla", price: 30.00, stock: 85,
        description: "Award-winning concealer that provides medium-to-buildable coverage with a radiant finish.",
        metaTitle: "Radiant Creamy Concealer in Vanilla | Luxe Kiss",
        metaDescription: "Hide blemishes and dark circles with the Luxe Kiss full coverage radiant concealer. Buildable and crease-proof.",
        metaKeywords: "concealer, full coverage concealer, radiant concealer, face makeup"
      },
      {
        name: "Waterproof Liquid Eyeliner", brand: "LashPop", category: "Eyes", shade: "Pitch Black", price: 21.00, stock: 150,
        description: "An ultra-precise liquid eyeliner with a waterproof, smudge-proof formula.",
        metaTitle: "Waterproof Liquid Eyeliner Pencil | LashPop",
        metaDescription: "Get the perfect wing with LashPop's waterproof liquid eyeliner. Stays on up to 24 hours without smudging.",
        metaKeywords: "eyeliner, liquid eyeliner, waterproof eyeliner, eye makeup"
      },
      {
        name: "Dewy Setting Spray", brand: "Glow Beauty", category: "Face", shade: "Clear", price: 32.00, stock: 60,
        description: "A weightless setting spray that locks in makeup for intense hydration and a dewy finish.",
        metaTitle: "Dewy Setting Spray for Glowing Skin | Glow Beauty",
        metaDescription: "Lock your makeup in place all day long with our hydrating dewy setting spray.",
        metaKeywords: "setting spray, dewy finish, makeup setting spray, glow beauty"
      },
      {
        name: "Volume & Length Mascara", brand: "LashPop", category: "Eyes", shade: "Extreme Black", price: 25.00, stock: 200,
        description: "High-impact mascara that delivers dramatic volume, length, and lift in a single stroke.",
        metaTitle: "Volume & Length Mascara - Extreme Black | LashPop",
        metaDescription: "Experience instant lash volume and incredible length with the famous LashPop mascara.",
        metaKeywords: "mascara, volume mascara, lengthening mascara, eye makeup"
      },
      {
        name: "Baked Highlighting Powder", brand: "Luxe Kiss", category: "Face", shade: "Champagne Pop", price: 38.00, stock: 45,
        description: "A buttery highlighter that melts into the skin for a high-impact, lit-from-within glow.",
        metaTitle: "Baked Highlighting Powder in Champagne | Luxe Kiss",
        metaDescription: "Achieve a stunning, natural glow with our Baked Highlighting Powder. Perfect for all skin tones.",
        metaKeywords: "highlighter, highlighting powder, champagne pop, makeup highlighter"
      },
      {
        name: "Hydrating Lip Gloss", brand: "Glow Beauty", category: "Lips", shade: "Rose Quartz", price: 19.00, stock: 120,
        description: "A non-sticky, moisturizing lip gloss that delivers high shine and a sheer wash of color.",
        metaTitle: "Hydrating Lip Gloss - Rose Quartz | Glow Beauty",
        metaDescription: "Get maximum shine and hydration with Glow Beauty's non-sticky lip gloss in Rose Quartz.",
        metaKeywords: "lip gloss, hydrating lip gloss, pink lip gloss, lips"
      },
      {
        name: "Soft Focus Setting Powder", brand: "Luxe Kiss", category: "Face", shade: "Translucent", price: 40.00, stock: 75,
        description: "Finely milled powder that blurs imperfections and sets makeup up to 16 hours.",
        metaTitle: "Translucent Soft Focus Setting Powder | Luxe Kiss",
        metaDescription: "Set your face makeup perfectly with this invisible, soft-focus translucent powder.",
        metaKeywords: "setting powder, translucent powder, face powder, bake makeup"
      },
      {
        name: "Eyeshadow Palette", brand: "Glamour Pro", category: "Eyes", shade: "Warm Neutrals", price: 45.00, stock: 30,
        description: "A versatile palette featuring 12 highly pigmented warm neutral matte and shimmer shades.",
        metaTitle: "Warm Neutrals Eyeshadow Palette | Glamour Pro",
        metaDescription: "Create endless day-to-night looks with our 12-pan Warm Neutrals eyeshadow palette.",
        metaKeywords: "eyeshadow palette, warm neutrals, matte eyeshadow, shimmer eyeshadow"
      },
      {
        name: "Brow Sculpting Gel", brand: "LashPop", category: "Eyes", shade: "Clear", price: 18.00, stock: 110,
        description: "A long-lasting strong hold clear brow gel that tames and shapes brows all day.",
        metaTitle: "Clear Brow Sculpting Gel | LashPop",
        metaDescription: "Keep your eyebrows perfectly in place all day with LashPop's strong-hold clear brow gel.",
        metaKeywords: "brow gel, clear brow gel, eyebrow sculpting, eyebrows"
      },
      {
        name: "Liquid Blush", brand: "Glow Beauty", category: "Face", shade: "Joy", price: 23.00, stock: 90,
        description: "A weightless, long-lasting liquid blush that blends beautifully for a soft, healthy flush.",
        metaTitle: "Liquid Blush in Joy (Soft Peach) | Glow Beauty",
        metaDescription: "Add a natural flush of color to your cheeks with our blendable, highly pigmented liquid blush.",
        metaKeywords: "liquid blush, peach blush, cream blush, face makeup"
      },
      {
        name: "Cream Contour Stick", brand: "Luxe Kiss", category: "Face", shade: "Medium Bronze", price: 28.00, stock: 65,
        description: "A creamy contour stick that creates effortless, natural-looking dimension.",
        metaTitle: "Cream Contour Stick - Medium Bronze | Luxe Kiss",
        metaDescription: "Sculpt and define your face structure effortlessly with our blendable cream contour stick.",
        metaKeywords: "contour stick, cream contour, bronzer, face sculpting"
      },
      {
        name: "Lip Liner Pencil", brand: "Glow Beauty", category: "Lips", shade: "Spice", price: 15.00, stock: 140,
        description: "A smooth, creamy lip liner designed for shaping, lining, or filling the lip.",
        metaTitle: "Creamy Lip Liner Pencil in Spice | Glow Beauty",
        metaDescription: "Define your lips preventing feathering with our ultra-smooth, long-lasting lip liner pencil.",
        metaKeywords: "lip liner, spice lip liner, lip pencil, lip makeup"
      },
      {
        name: "Tinted Moisturizer SPF 30", brand: "Glamour Pro", category: "Face", shade: "Light 2", price: 36.00, stock: 80,
        description: "A multi-tasking blend of skincare and makeup that provides sheer coverage and sun protection.",
        metaTitle: "Tinted Moisturizer SPF 30 | Glamour Pro",
        metaDescription: "Protect and perfect your skin daily with our sheer coverage Tinted Moisturizer with SPF 30.",
        metaKeywords: "tinted moisturizer, bb cream, complexion, spf makeup"
      },
      {
        name: "Makeup Primer", brand: "Luxe Kiss", category: "Face", shade: "Clear", price: 34.00, stock: 55,
        description: "A smoothing primer that minimizes the look of pores and fine lines for flawless makeup application.",
        metaTitle: "Pore-Minimizing Makeup Primer | Luxe Kiss",
        metaDescription: "Create the perfect smooth canvas for your foundation with our blurring makeup primer.",
        metaKeywords: "makeup primer, pore minimizing, face primer, smooth base"
      }
    ];

    await Product.insertMany(products);
    console.log("15 new makeup products seeded successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
