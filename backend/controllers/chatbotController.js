const Product = require("../models/Product");
const Order = require("../models/Order");

const PRODUCT_RESULT_LIMIT = 50;

const storeKnowledge = [
  {
    intent: "return_policy",
    keywords: [
      "return",
      "returns",
      "refund",
      "refunds",
      "exchange",
      "damaged",
      "wrong item",
      "defective",
      "return policy",
    ],
    reply:
      "Our return policy allows returns for damaged, incorrect, or defective products. Items must be unused and returned with original packaging. Please contact Glamour Beauty support with your order details to request a return or exchange.",
  },
  {
    intent: "shipping_policy",
    keywords: [
      "shipping",
      "ship",
      "delivery",
      "deliver",
      "courier",
      "how long",
      "delivery time",
      "shipping policy",
    ],
    reply:
      "Orders are processed after confirmation. Delivery time may vary depending on your city and address. Customers will be informed about delivery updates through email, phone, or WhatsApp.",
  },
  {
    intent: "privacy_policy",
    keywords: [
      "privacy",
      "privacy policy",
      "data",
      "personal information",
      "security",
      "safe",
      "information",
    ],
    reply:
      "Glamour Beauty respects your privacy. We collect customer information only to process orders, provide customer support, and improve our services. We do not sell your personal information to third parties.",
  },
  {
    intent: "contact_info",
    keywords: [
      "contact",
      "contact us",
      "phone",
      "email",
      "whatsapp",
      "address",
      "support",
      "customer service",
    ],
    reply:
      "You can contact Glamour Beauty by email at support@glamourbeauty.com, phone at +92 300 1234567, WhatsApp at +92 300 1234567, or visit us in Lahore, Pakistan.",
  },
  {
    intent: "faqs",
    keywords: [
      "faq",
      "faqs",
      "help",
      "cash on delivery",
      "cod",
      "payment",
      "pay",
      "how to order",
      "place order",
    ],
    reply:
      "Frequently asked questions: You can place an order by selecting a product, adding it to cart, and completing checkout. Cash on Delivery is available. You can also pay by card if enabled. For support, contact us by email, phone, or WhatsApp.",
  },
];

const findKnowledgeAnswer = (text) => {
  return storeKnowledge.find((item) =>
    item.keywords.some((keyword) => text.includes(keyword))
  );
};

const normalizeSearchText = (text) => {
  let cleaned = text.toLowerCase();

  // Fix common spelling mistakes
  cleaned = cleaned.replace(/eyeliners/g, "eyeliner");
  cleaned = cleaned.replace(/eyliners/g, "eyeliner");
  cleaned = cleaned.replace(/eyliner/g, "eyeliner");

  cleaned = cleaned.replace(/liptics/g, "lipstick");
  cleaned = cleaned.replace(/liptic/g, "lipstick");
  cleaned = cleaned.replace(/lipstiks/g, "lipstick");
  cleaned = cleaned.replace(/lipstik/g, "lipstick");
  cleaned = cleaned.replace(/lipstic/g, "lipstick");
  cleaned = cleaned.replace(/lipsticks/g, "lipstick");

  // Remove command/common words
  cleaned = cleaned
    .replace(/show/g, "")
    .replace(/find/g, "")
    .replace(/give me/g, "")
    .replace(/i want/g, "")
    .replace(/please/g, "")
    .replace(/all/g, "")
    .replace(/products/g, "")
    .replace(/product/g, "")
    .replace(/items/g, "")
    .replace(/item/g, "")
    .replace(/under\s*\$?\s*\d+/g, "")
    .replace(/less than\s*\$?\s*\d+/g, "")
    .replace(/below\s*\$?\s*\d+/g, "")
    .replace(/cheaper than\s*\$?\s*\d+/g, "")
    .trim();

  return cleaned;
};

const getPriceFilter = (text) => {
  const priceMatch =
    text.match(/under\s*\$?\s*(\d+)/) ||
    text.match(/less than\s*\$?\s*(\d+)/) ||
    text.match(/below\s*\$?\s*(\d+)/) ||
    text.match(/cheaper than\s*\$?\s*(\d+)/);

  return priceMatch ? Number(priceMatch[1]) : null;
};

const isLipstickQuery = (text) => {
  return (
    text.includes("lipstick") ||
    text.includes("lipsticks") ||
    text.includes("liptic") ||
    text.includes("liptics") ||
    text.includes("lipstik") ||
    text.includes("lipstiks") ||
    text.includes("lipstic") ||
    text.includes("lip")
  );
};

const isEyelinerQuery = (text) => {
  return (
    text.includes("eyeliner") ||
    text.includes("eyeliners") ||
    text.includes("eyliner") ||
    text.includes("eyliners") ||
    text.includes("eye liner")
  );
};

const isProductQuestion = (text) => {
  return (
    text.includes("product") ||
    text.includes("products") ||
    text.includes("item") ||
    text.includes("items") ||
    text.includes("show") ||
    text.includes("find") ||
    isLipstickQuery(text) ||
    isEyelinerQuery(text) ||
    text.includes("mascara") ||
    text.includes("concealer") ||
    text.includes("powder") ||
    text.includes("blush") ||
    text.includes("spray") ||
    text.includes("palette") ||
    text.includes("under") ||
    text.includes("less than") ||
    text.includes("below")
  );
};

exports.handleChatRequest = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const text = message.toLowerCase().trim();

    // 1. All user orders
    if (
      text.includes("my orders") ||
      text.includes("all orders") ||
      text.includes("orders i have placed") ||
      text.includes("order history") ||
      text.includes("give all orders") ||
      text.includes("give me orders") ||
      text.includes("show my orders")
    ) {
      if (!userId) {
        return res.json({
          reply: "Please log in first so I can show your order history.",
          intent: "auth_required",
        });
      }

      const orders = await Order.find({
        $or: [{ userId }, { user: userId }],
      })
        .populate("items.productId", "name price image")
        .populate("orderItems.product", "name price image")
        .sort({ createdAt: -1 })
        .limit(20);

      if (!orders.length) {
        return res.json({
          reply: "I could not find any orders in your account yet.",
          intent: "no_orders",
        });
      }

      return res.json({
        reply: `I found ${orders.length} recent order(s) from your account.`,
        intent: "orders_list",
        orders,
      });
    }

    // 2. Latest order tracking
    if (
      text.includes("track my order") ||
      text.includes("order status") ||
      text.includes("where is my order") ||
      text.includes("latest order")
    ) {
      if (!userId) {
        return res.json({
          reply: "Please log in first so I can track your order.",
          intent: "auth_required",
        });
      }

      const latestOrder = await Order.findOne({
        $or: [{ userId }, { user: userId }],
      }).sort({ createdAt: -1 });

      if (!latestOrder) {
        return res.json({
          reply: "I could not find any recent orders associated with your account.",
          intent: "no_orders",
        });
      }

      return res.json({
        reply: `Your latest order #${latestOrder._id
          .toString()
          .slice(-6)} is currently ${
          latestOrder.status || latestOrder.orderStatus || "Processing"
        }. Total: $${Number(latestOrder.totalPrice || 0).toFixed(2)}.`,
        intent: "order_tracking",
        data: latestOrder,
      });
    }

    // 3. Add to cart
    if (text.includes("add") && text.includes("cart")) {
      const productName = normalizeSearchText(
        text.replace("add", "").replace("to cart", "").replace("cart", "")
      );

      let product = null;

      if (productName) {
        product = await Product.findOne({
          $or: [
            { name: { $regex: productName, $options: "i" } },
            { category: { $regex: productName, $options: "i" } },
            { brand: { $regex: productName, $options: "i" } },
          ],
        });
      }

      if (product) {
        return res.json({
          reply: `I found ${product.name}. Click the button below to add it to your cart.`,
          intent: "cart_add",
          action: {
            type: "ADD_TO_CART",
            payload: product,
          },
        });
      }

      return res.json({
        reply:
          "Please tell me the product name. Example: add Velvet Matte Lipstick to cart.",
        intent: "cart_add",
      });
    }

    // 4. Discounts
    if (
      text.includes("discount") ||
      text.includes("coupon") ||
      text.includes("offer") ||
      text.includes("sale")
    ) {
      const discountedProducts = await Product.find({
        $or: [{ isDiscounted: true }, { discountPercentage: { $gt: 0 } }],
      }).limit(PRODUCT_RESULT_LIMIT);

      if (discountedProducts.length > 0) {
        return res.json({
          reply: "Here are some discounted products currently available.",
          intent: "discount_products",
          products: discountedProducts,
        });
      }

      return res.json({
        reply:
          "There are no active discount products right now, but you can check the Products page for new offers.",
        intent: "no_discounts",
      });
    }

    // 5. Policies / contact / FAQs
    const knowledgeAnswer = findKnowledgeAnswer(text);
    if (knowledgeAnswer) {
      return res.json({
        reply: knowledgeAnswer.reply,
        intent: knowledgeAnswer.intent,
      });
    }

    // 6. Product search
    if (isProductQuestion(text)) {
      const maxPrice = getPriceFilter(text);
      const searchText = normalizeSearchText(text);

      const wantsAllProducts =
        text.includes("show all products") ||
        text.includes("all products") ||
        text.includes("show products") ||
        text.includes("all items") ||
        text === "products" ||
        text === "show product";

      const query = {};

      if (maxPrice) {
        query.price = { $lte: maxPrice };
      }

      if (!wantsAllProducts && searchText) {
        const terms = searchText
          .split(" ")
          .map((word) => word.trim())
          .filter((word) => word.length > 1);

        if (terms.length > 0) {
          query.$or = terms.flatMap((term) => [
            { name: { $regex: term, $options: "i" } },
            { category: { $regex: term, $options: "i" } },
            { brand: { $regex: term, $options: "i" } },
            { shade: { $regex: term, $options: "i" } },
          ]);
        }
      }

      let products = await Product.find(query)
        .sort({ totalSold: -1, createdAt: -1 })
        .limit(PRODUCT_RESULT_LIMIT);

      // Lipstick fallback for typo words like liptics
      if (!products.length && isLipstickQuery(text)) {
        products = await Product.find({
          $or: [
            { name: { $regex: "lipstick", $options: "i" } },
            { name: { $regex: "lip", $options: "i" } },
            { category: { $regex: "lip", $options: "i" } },
            { category: { $regex: "lips", $options: "i" } },
            { category: { $regex: "red lips", $options: "i" } },
          ],
          ...(maxPrice ? { price: { $lte: maxPrice } } : {}),
        }).limit(PRODUCT_RESULT_LIMIT);
      }

      // Eyeliner fallback for typo words like eyliners
      if (!products.length && isEyelinerQuery(text)) {
        products = await Product.find({
          $or: [
            { name: { $regex: "eyeliner", $options: "i" } },
            { name: { $regex: "eye", $options: "i" } },
            { category: { $regex: "eyes", $options: "i" } },
            { category: { $regex: "eye", $options: "i" } },
          ],
          ...(maxPrice ? { price: { $lte: maxPrice } } : {}),
        }).limit(PRODUCT_RESULT_LIMIT);
      }

      if (products.length > 0) {
        return res.json({
          reply: `I found ${products.length} product(s) matching your request. You can click any product below to view details.`,
          intent: "product_search",
          products,
        });
      }

      return res.json({
        reply:
          "I could not find matching products. Try asking like: show lipsticks under 60, show all products, show liptics under 90, or show eyeliners.",
        intent: "no_products",
      });
    }

    // 7. General fallback
    return res.json({
      reply:
        "I can help you with products, prices, discounts, cart help, order tracking, all your orders, return policy, shipping policy, privacy policy, contact details, and FAQs. Try asking: show all products, show liptics under 90, show lipsticks under 50, show eyeliners, or give me my orders.",
      intent: "general",
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      error: "Chatbot encountered an error.",
    });
  }
};