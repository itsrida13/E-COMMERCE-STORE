const Product = require("../models/Product");
const Order = require("../models/Order");

// Simulated NLP Agent
exports.handleChatRequest = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const text = message.toLowerCase();

    // 1. FAQ Automation
    if (text.includes("shipping") || text.includes("delivery")) {
      return res.json({
        reply: "We offer free standard shipping on orders over $50! Standard shipping takes 3-5 business days. Expedited shipping is available at checkout.",
        intent: "faq_shipping"
      });
    }
    if (text.includes("return") || text.includes("refund")) {
      return res.json({
        reply: "Our return policy lasts 30 days. If 30 days have gone by since your purchase, unfortunately, we can’t offer you a refund or exchange. Items must be unused and in original packaging.",
        intent: "faq_returns"
      });
    }
    if (text.includes("payment") || text.includes("pay")) {
      return res.json({
        reply: "We accept all major credit cards (Visa, MasterCard, Amex), PayPal, and Apple Pay.",
        intent: "faq_payment"
      });
    }

    // 2. Order Tracking
    if (text.includes("order") && (text.includes("where") || text.includes("status") || text.includes("track"))) {
      if (!userId) {
        return res.json({
          reply: "To track your order, please log into your account, or provide your Order ID.",
          intent: "auth_required"
        });
      }
      // Fetch latest order for user
      const latestOrder = await Order.findOne({ userId }).sort({ createdAt: -1 });
      if (!latestOrder) {
        return res.json({
          reply: "I couldn't find any recent orders associated with your account.",
          intent: "no_orders"
        });
      }
      return res.json({
        reply: `Your most recent order (${latestOrder._id.toString().slice(-6)}) is currently: **${latestOrder.orderStatus}**. Total: $${latestOrder.totalPrice.toFixed(2)}.`,
        intent: "order_tracking",
        data: latestOrder
      });
    }

    // 3. Product Discovery & Search (NLP Simulation)
    // E.g. "show me lipsticks under $50"
    const priceMatch = text.match(/under\s*\$?\s*(\d+)/) || text.match(/less than\s*\$?\s*(\d+)/);
    const maxPrice = priceMatch ? parseInt(priceMatch[1]) : null;

    // Very basic keyword extraction
    const searchTerms = text.replace(/under\s*\$?\s*\d+/g, "")
      .replace(/(show me|find|looking for|i want|cheap|best)/g, "")
      .trim().split(" ").filter(word => word.length > 2);

    let query = {};
    if (searchTerms.length > 0) {
      query.$or = searchTerms.map(term => ({
        name: { $regex: term, $options: "i" }
      }));
    }
    if (maxPrice) {
      query.price = { $lte: maxPrice };
    }

    if (Object.keys(query).length > 0) {
      const products = await Product.find(query).limit(3);
      if (products.length > 0) {
        return res.json({
          reply: `I found some products that match your search!`,
          intent: "product_search",
          products: products
        });
      }
    }

    // 4. Cart Assistance & Coupons
    if (text.includes("add") && text.includes("cart")) {
      const productNameMatch = text.replace(/add\s+/g, "").replace(/\s+to\s+cart.*/g, "").trim();
      if (productNameMatch && productNameMatch.length > 2) {
        // Try to find the product
        const product = await Product.findOne({ name: { $regex: productNameMatch, $options: "i" } });
        if (product) {
          return res.json({
            reply: `I found ${product.name}. Would you like to add it to your cart?`,
            intent: "cart_add",
            action: { type: "ADD_TO_CART", payload: product }
          });
        }
      }
      return res.json({
        reply: "Which product would you like to add to your cart? Try searching with a specific name like 'Add Velvet Lipstick to cart'.",
        intent: "cart_add"
      });
    }

    if (text.includes("remove") && text.includes("cart")) {
       return res.json({
        reply: "To remove items from your cart, please click the Cart icon at the top of the page. From there, you can adjust quantities or remove items.",
        intent: "cart_remove"
      });
    }

    if (text.includes("coupon") || text.includes("discount")) {
      const codeMatch = text.match(/code\s+(\w+)/i) || text.match(/coupon\s+(\w+)/i);
      if (codeMatch && codeMatch[1]) {
        return res.json({
          reply: `I've prepared the coupon code ${codeMatch[1].toUpperCase()} for you! You can apply it at checkout.`,
          intent: "apply_coupon",
          action: { type: "APPLY_COUPON", payload: codeMatch[1].toUpperCase() }
        });
      }
      return res.json({
        reply: "We occasionally offer discounts! Try using code SAVE10 at checkout for 10% off certain items.",
        intent: "faq_coupons"
      });
    }

    // Fallback
    return res.json({
      reply: "I'm your AI shopping assistant. You can ask me to track your order, find products like 'lipsticks under 30', or ask about our shipping and return policies!",
      intent: "general"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Chatbot encountered an error." });
  }
};
