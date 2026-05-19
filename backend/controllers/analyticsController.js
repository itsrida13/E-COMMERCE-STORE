const analyticsService = require("../services/analyticsService");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

exports.getDashboard = async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 90;
    const data = await analyticsService.getDashboard(days);
    res.json(data);
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: err.message || "Failed to load analytics" });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const orders = await Order.find({
      orderStatus: { $ne: "cancelled" },
      paymentStatus: { $in: ["paid", "pending", "completed"] },
    }).populate("items.productId");
    const products = await Product.find();
    const users = await User.find();

    let totalRevenue = 0;
    orders.forEach((order) => {
      let orderTotal = order.totalPrice || order.totalAmount || order.amount || order.total || 0;
      let calculatedTotal = 0;
      if (order.items && order.items.length > 0) {
        calculatedTotal = order.items.reduce((sum, item) => {
          const price = item.productId ? (item.productId.price || 0) : 0;
          return sum + (price * (item.quantity || 1));
        }, 0);
      }
      totalRevenue += calculatedTotal > orderTotal ? calculatedTotal : orderTotal;
    });

    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    let lowStockCount = 0;
    let outOfStockCount = 0;
    let inventoryValue = 0;

    products.forEach((p) => {
      const stock = p.stock || p.countInStock || 0;
      const price = p.price || 0;
      if (stock === 0) outOfStockCount++;
      else if (stock <= 5) lowStockCount++;
      inventoryValue += stock * price;
    });

    res.json({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      totalProducts: products.length,
      totalCustomers: users.length,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      lowStockCount,
      outOfStockCount,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
    });
  } catch (err) {
    console.error("Analytics summary error:", err);
    res.status(500).json({ error: err.message || "Failed to load analytics summary" });
  }
};

exports.getSalesPredictions = async (req, res) => {
  try {
    const products = await Product.find();
    const orders = await Order.find({ orderStatus: { $ne: "cancelled" } });

    // Calculate dates
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const salesLast30 = {};
    const salesPrev30 = {};
    const totalSoldPerProduct = {};
    const revenuePerProduct = {};

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt || order.date);
      const isLast30 = orderDate >= thirtyDaysAgo;
      const isPrev30 = orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;

      const itemsList = order.orderItems && order.orderItems.length > 0 ? order.orderItems : order.items;
      
      itemsList?.forEach(item => {
        const pid = (item.product || item.productId)?.toString();
        if (pid) {
          const qty = Number(item.quantity || 1);
          const price = Number(item.price || 0);

          totalSoldPerProduct[pid] = (totalSoldPerProduct[pid] || 0) + qty;
          revenuePerProduct[pid] = (revenuePerProduct[pid] || 0) + (qty * price);

          if (isLast30) {
            salesLast30[pid] = (salesLast30[pid] || 0) + qty;
          } else if (isPrev30) {
            salesPrev30[pid] = (salesPrev30[pid] || 0) + qty;
          }
        }
      });
    });

    let totalPredictedDemand = 0;
    let sumConfidence = 0;
    let urgentRestocks = 0;
    let discountTargets = 0;

    const mappedProducts = products.map(product => {
      const pid = product._id.toString();
      const currentStock = product.stock || 0;
      const totalSold = totalSoldPerProduct[pid] || product.totalSold || 0;
      const revenue = Math.round((revenuePerProduct[pid] || (totalSold * product.price) || 0) * 100) / 100;
      
      const last30DaysSold = salesLast30[pid] || 0;
      const previous30DaysSold = salesPrev30[pid] || 0;

      const trend = last30DaysSold - previous30DaysSold;
      const growthRate = previous30DaysSold > 0 ? ((last30DaysSold - previous30DaysSold) / previous30DaysSold) : 0;
      const demandChangePercentage = Math.round(growthRate * 100);

      // Predicted demand formula
      let predictedDemandNext30Days = Math.max(0, Math.round(last30DaysSold + trend * 0.5));

      const hasRealOrders = last30DaysSold > 0 || previous30DaysSold > 0;
      if (!hasRealOrders) {
        predictedDemandNext30Days = Math.max(0, Math.round((totalSold / 6) + 1));
        if (predictedDemandNext30Days === 0 && currentStock > 0) {
          predictedDemandNext30Days = 2; // low stock forecast fallback
        }
      }

      // Confidence logic
      let confidence = 70;
      if (hasRealOrders && last30DaysSold > 1) {
        confidence = 85;
      } else if (!hasRealOrders) {
        confidence = 60;
      }

      // Action Required logic
      let actionRequired = "Monitor";
      const reorderLevel = product.reorderLevel || 10;
      const maxStockLevel = product.maxStockLevel || 100;

      if (predictedDemandNext30Days > currentStock) {
        actionRequired = "Urgent Restock";
      } else if (currentStock <= reorderLevel) {
        actionRequired = "Maintain Stock";
      } else if (currentStock > maxStockLevel && last30DaysSold <= 2) {
        actionRequired = "Discount";
      } else if (totalSold === 0 && currentStock > 0) {
        actionRequired = "Discount";
      }

      // AI Reasoning logic
      let aiReasoning = "Stable historical projection";
      if (last30DaysSold > previous30DaysSold && previous30DaysSold > 0) {
        aiReasoning = "High recent demand compared with previous month";
      } else if (currentStock > maxStockLevel && last30DaysSold <= 2) {
        aiReasoning = "Low sales velocity with excess inventory";
      } else if (predictedDemandNext30Days > currentStock) {
        aiReasoning = "Current stock may not cover predicted demand";
      } else if (totalSold === 0) {
        aiReasoning = "No recent sales; product may be slow moving";
      } else if (!hasRealOrders) {
        aiReasoning = "New/low-data product baseline projection";
      }

      totalPredictedDemand += predictedDemandNext30Days;
      sumConfidence += confidence;
      if (actionRequired === "Urgent Restock") urgentRestocks++;
      if (actionRequired === "Discount") discountTargets++;

      return {
        _id: product._id,
        productId: pid,
        name: product.name,
        category: product.category,
        image: product.image || "",
        currentStock,
        totalSold,
        revenue,
        last30DaysSold,
        previous30DaysSold,
        monthlySales: last30DaysSold,
        predictedDemand: predictedDemandNext30Days,
        predictedDemandNext30Days,
        demandChangePercentage,
        confidence,
        confidenceScore: confidence,
        aiReasoning,
        seasonReason: aiReasoning,
        actionRequired,
        recommendedAction: actionRequired
      };
    });

    const avgConfidence = mappedProducts.length > 0 ? Math.round(sumConfidence / mappedProducts.length) : 0;

    res.json({
      totalPredictedDemand,
      avgConfidence,
      urgentRestocks,
      discountTargets,
      products: mappedProducts
    });
  } catch (err) {
    console.error("Sales predictions error:", err);
    res.status(500).json({ error: err.message || "Failed to generate sales predictions" });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const products = await Product.find();
    const orders = await Order.find({ orderStatus: { $ne: "cancelled" } });

    // Calculate dates
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const salesLast30 = {};
    const totalSoldPerProduct = {};
    const revenuePerProduct = {};
    const pairCounts = {};

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt || order.date);
      const isLast30 = orderDate >= thirtyDaysAgo;

      const itemsList = order.orderItems && order.orderItems.length > 0 ? order.orderItems : order.items;
      const productIds = [];

      itemsList?.forEach(item => {
        const pid = (item.product || item.productId)?.toString();
        if (pid) {
          const qty = Number(item.quantity || 1);
          const price = Number(item.price || 0);

          totalSoldPerProduct[pid] = (totalSoldPerProduct[pid] || 0) + qty;
          revenuePerProduct[pid] = (revenuePerProduct[pid] || 0) + (qty * price);

          if (isLast30) {
            salesLast30[pid] = (salesLast30[pid] || 0) + qty;
          }

          productIds.push(pid);
        }
      });

      // Count product pairs for cross-selling
      if (productIds.length > 1) {
        const uniqueIds = [...new Set(productIds)];
        for (let i = 0; i < uniqueIds.length; i++) {
          for (let j = i + 1; j < uniqueIds.length; j++) {
            const pair = [uniqueIds[i], uniqueIds[j]].sort().join("|");
            pairCounts[pair] = (pairCounts[pair] || 0) + 1;
          }
        }
      }
    });

    // 1. Top Best Sellers
    const topBestSellers = products
      .map(p => {
        const pid = p._id.toString();
        const sold = totalSoldPerProduct[pid] || p.totalSold || 0;
        const revenue = Math.round((revenuePerProduct[pid] || (sold * p.price) || 0) * 100) / 100;
        return {
          _id: p._id,
          productId: p._id,
          name: p.name,
          category: p.category,
          image: p.image || "",
          stock: p.stock || 0,
          currentStock: p.stock || 0,
          totalSold: sold,
          revenue,
          tag: "Top Ranked"
        };
      })
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 4);

    // 2. Cross-Sell Bundles
    const sortedPairs = Object.entries(pairCounts)
      .sort((a, b) => b[1] - a[1]);

    const crossSellBundles = [];
    
    // Add real pairs
    for (const [pairKey, count] of sortedPairs) {
      if (crossSellBundles.length >= 4) break;
      const [id1, id2] = pairKey.split("|");
      const p1 = products.find(p => p._id.toString() === id1);
      const p2 = products.find(p => p._id.toString() === id2);
      
      if (p1 && p2) {
        crossSellBundles.push({
          bundleName: `${p1.name} & ${p2.name} Glow Set`,
          mainProduct: { _id: p1._id, name: p1.name, image: p1.image, price: p1.price },
          recommendedProduct: { _id: p2._id, name: p2.name, image: p2.image, price: p2.price },
          products: [
            { productId: p1._id, name: p1.name, image: p1.image, price: p1.price },
            { productId: p2._id, name: p2.name, image: p2.image, price: p2.price }
          ],
          reason: "These products were purchased together frequently.",
          suggestedDiscountPercentage: 10,
          suggestedDiscount: "10%",
          expectedBenefit: "Recommended together to increase average order value.",
          action: "Create Bundle"
        });
      }
    }

    // Fallback complementary matching
    if (crossSellBundles.length < 4) {
      products.forEach(p => {
        if (crossSellBundles.length >= 4) return;
        const pid = p._id.toString();
        const cat = (p.category || "").toLowerCase();
        
        let match = null;
        let reason = "Same category pairing with complementary use.";
        
        if (cat.includes("lip") && !cat.includes("liner")) {
          match = products.find(o => o._id.toString() !== pid && (o.category || "").toLowerCase().includes("liner"));
          reason = "Perfect lip pairing.";
        } else if (cat.includes("foundation")) {
          match = products.find(o => o._id.toString() !== pid && ((o.category || "").toLowerCase().includes("concealer") || (o.category || "").toLowerCase().includes("spray")));
          reason = "Eye makeup essential duo.";
        } else if (cat.includes("eyeliner")) {
          match = products.find(o => o._id.toString() !== pid && (o.category || "").toLowerCase().includes("mascara"));
          reason = "Eye makeup essential duo.";
        }

        if (match) {
          const alreadyAdded = crossSellBundles.some(b => 
            (b.mainProduct._id.toString() === pid && b.recommendedProduct._id.toString() === match._id.toString()) ||
            (b.mainProduct._id.toString() === match._id.toString() && b.recommendedProduct._id.toString() === pid)
          );
          if (!alreadyAdded) {
            crossSellBundles.push({
              bundleName: `${p.name} & ${match.name} Duo`,
              mainProduct: { _id: p._id, name: p.name, image: p.image, price: p.price },
              recommendedProduct: { _id: match._id, name: match.name, image: match.image, price: match.price },
              products: [
                { productId: p._id, name: p.name, image: p.image, price: p.price },
                { productId: match._id, name: match.name, image: match.image, price: match.price }
              ],
              reason,
              suggestedDiscountPercentage: 10,
              suggestedDiscount: "10%",
              expectedBenefit: "Recommended together to increase average order value.",
              action: "Create Bundle"
            });
          }
        }
      });
    }

    // 3. Upcoming Seasonal Picks
    const seasonalPicks = [];
    products.forEach(p => {
      if (seasonalPicks.length >= 4) return;
      const cat = (p.category || "").toLowerCase();
      const seasonTag = p.seasonTag || "";
      const demandLevel = p.demandLevel || "High";
      
      let isSeasonal = false;
      let reason = "High seasonal demand.";
      let expectedDemand = demandLevel;
      let season = "All Season";

      if (seasonTag) {
        isSeasonal = true;
        season = seasonTag;
        reason = `${seasonTag} essential and highly rated by customers.`;
      } else if (cat.includes("sunscreen") || cat.includes("moisturizer")) {
        isSeasonal = true;
        season = "Summer";
        reason = "Summer season (high demand for skincare & SPF).";
        expectedDemand = "Very High";
      } else if (cat.includes("lip") && (p.shade || "").toLowerCase().includes("dark")) {
        isSeasonal = true;
        season = "Winter";
        reason = "Winter season (trend for darker/deeper shades).";
        expectedDemand = "High";
      } else if (cat.includes("foundation") || cat.includes("spray")) {
        isSeasonal = true;
        season = "Wedding Season";
        reason = "Wedding season approaching (high demand for base & lips).";
        expectedDemand = "Very High";
      }

      if (isSeasonal) {
        seasonalPicks.push({
          _id: p._id,
          productId: p._id,
          name: p.name,
          image: p.image || "",
          seasonTag: season,
          season,
          expectedDemand,
          reason
        });
      }
    });

    // 4. Discount Recommendations (Slow-Moving)
    const discountRecommendations = [];
    products.forEach(p => {
      if (discountRecommendations.length >= 4) return;
      const pid = p._id.toString();
      const currentStock = p.stock || 0;
      const totalSold = totalSoldPerProduct[pid] || p.totalSold || 0;
      const last30DaysSold = salesLast30[pid] || 0;
      const maxStockLevel = p.maxStockLevel || 100;
      const isDeadStock = p.isDeadStock || false;

      let isSlowMoving = false;
      let reason = "";
      let suggestedDiscountPercentage = 10;

      if (currentStock > maxStockLevel && totalSold <= 2) {
        isSlowMoving = true;
        reason = "Excess inventory with extremely low cumulative sales.";
        suggestedDiscountPercentage = 20;
      } else if (last30DaysSold === 0 && currentStock > 20) {
        isSlowMoving = true;
        reason = "No sales in the last 30 days with moderate stock.";
        suggestedDiscountPercentage = 15;
      } else if (isDeadStock && currentStock > 0) {
        isSlowMoving = true;
        reason = "Flagged as dead stock with stagnant movement.";
        suggestedDiscountPercentage = 25;
      } else if (currentStock > 30 && totalSold < 5) {
        isSlowMoving = true;
        reason = "High stock with low overall velocity.";
        suggestedDiscountPercentage = 10;
      }

      if (isSlowMoving) {
        discountRecommendations.push({
          _id: p._id,
          productId: p._id,
          name: p.name,
          image: p.image || "",
          stock: currentStock,
          currentStock,
          totalSold,
          reason,
          suggestedDiscountPercentage,
          suggestedDiscount: `${suggestedDiscountPercentage}%`,
          action: "Apply Discount"
        });
      }
    });

    res.json({
      bestSellers: topBestSellers,
      topBestSellers,
      
      bundles: crossSellBundles,
      crossSellBundles,
      
      seasonal: seasonalPicks,
      seasonalPicks,
      
      slowMoving: discountRecommendations,
      discountRecommendations
    });
  } catch (err) {
    console.error("Recommendations error:", err);
    res.status(500).json({ error: err.message || "Failed to generate recommendations" });
  }
};

exports.getAiInsights = async (req, res) => {
  try {
    const products = await Product.find();
    const orders = await Order.find({ orderStatus: { $ne: "cancelled" } });
    const insights = [];

    // Date calculations for velocity
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Calculate sales velocity per product
    const productStats = {};
    products.forEach(p => {
      productStats[p._id.toString()] = {
        product: p,
        salesRecent: 0,
        salesPrevious: 0,
        revenueRecent: 0,
        revenuePrevious: 0
      };
    });

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt || order.date);
      const isRecent = orderDate >= thirtyDaysAgo;
      const isPrevious = orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;

      if ((isRecent || isPrevious) && order.items) {
        order.items.forEach(item => {
          const pid = item.productId ? item.productId.toString() : null;
          if (pid && productStats[pid]) {
            const qty = item.quantity || 1;
            const rev = qty * (productStats[pid].product.price || 0);
            
            if (isRecent) {
              productStats[pid].salesRecent += qty;
              productStats[pid].revenueRecent += rev;
            } else {
              productStats[pid].salesPrevious += qty;
              productStats[pid].revenuePrevious += rev;
            }
          }
        });
      }
    });

    // Generate Insights by traversing products
    let totalRevenueRecent = 0;
    let totalRevenuePrevious = 0;

    products.forEach(p => {
      const stats = productStats[p._id.toString()];
      const stock = p.stock || 0;
      const views = p.totalViews || 0;
      const name = p.name;
      const category = p.category;
      
      totalRevenueRecent += stats.revenueRecent;
      totalRevenuePrevious += stats.revenuePrevious;

      // --- INVENTORY INSIGHTS ---
      if (stock === 0) {
        insights.push({
          title: "Out of Stock",
          message: `The product "${name}" is completely out of stock.`,
          type: "Inventory",
          priority: "High",
          confidenceScore: 100,
          recommendedAction: "Urgent Restock",
          productName: name,
          category
        });
      } else if (stock > 0 && stock <= 15 && stats.salesRecent > 5) {
        insights.push({
          title: "Low Stock Warning",
          message: `Product "${name}" may go out of stock soon due to high sales velocity.`,
          type: "Inventory",
          priority: "High",
          confidenceScore: 92,
          recommendedAction: "Restock Soon",
          productName: name,
          category
        });
      } else if (stock > 100 && stats.salesRecent === 0) {
        insights.push({
          title: "Dead Stock Detected",
          message: `Product "${name}" has over 100 units in stock but 0 sales in the last 30 days.`,
          type: "Inventory",
          priority: "Medium",
          confidenceScore: 88,
          recommendedAction: "Clearance Sale",
          productName: name,
          category
        });
      }

      // --- SALES INSIGHTS ---
      if (stats.salesRecent > 0 && stats.salesPrevious > 0) {
        const growth = ((stats.salesRecent - stats.salesPrevious) / stats.salesPrevious) * 100;
        if (growth > 50) {
          insights.push({
            title: "Trending Product",
            message: `Sales for "${name}" have increased by ${Math.round(growth)}% compared to the previous period.`,
            type: "Sales",
            priority: "Medium",
            confidenceScore: 85,
            recommendedAction: "Increase Marketing Spend",
            productName: name,
            category
          });
        }
      }

      if (views > 200 && stats.salesRecent < 5) {
        insights.push({
          title: "High Traffic, Low Conversion",
          message: `Product "${name}" has high views but very low sales. Consider reviewing the price or description.`,
          type: "Sales",
          priority: "Medium",
          confidenceScore: 78,
          recommendedAction: "Review Pricing / Details",
          productName: name,
          category
        });
      }

      // --- SEASONAL INSIGHTS ---
      const catLower = (category || "").toLowerCase();
      if (catLower.includes("sunscreen") || name.toLowerCase().includes("sunscreen")) {
        insights.push({
          title: "Summer Trend Alert",
          message: `Demand for SPF and suncare like "${name}" is expected to rise.`,
          type: "Seasonal",
          priority: "Low",
          confidenceScore: 90,
          recommendedAction: "Highlight on Homepage",
          productName: name,
          category
        });
      }
      if (catLower.includes("lip") || catLower.includes("foundation")) {
        insights.push({
          title: "Wedding Season Prep",
          message: `Base makeup and lip products tend to spike during wedding season. Ensure stock is healthy for "${name}".`,
          type: "Seasonal",
          priority: "Medium",
          confidenceScore: 82,
          recommendedAction: "Monitor Stock Levels",
          productName: name,
          category
        });
      }
    });

    // Store-wide Revenue Insight
    if (totalRevenuePrevious > 0) {
      const revenueGrowth = ((totalRevenueRecent - totalRevenuePrevious) / totalRevenuePrevious) * 100;
      if (revenueGrowth < 0) {
        insights.push({
          title: "Revenue Drop Detected",
          message: `Store-wide revenue decreased by ${Math.abs(Math.round(revenueGrowth))}% in the last 30 days compared to the previous period.`,
          type: "Sales",
          priority: "High",
          confidenceScore: 95,
          recommendedAction: "Run Storewide Promotion",
        });
      } else if (revenueGrowth > 10) {
        insights.push({
          title: "Strong Revenue Growth",
          message: `Store-wide revenue increased by ${Math.round(revenueGrowth)}% in the last 30 days!`,
          type: "Sales",
          priority: "Low",
          confidenceScore: 95,
          recommendedAction: "Maintain Current Strategy",
        });
      }
    }

    // Sort by Priority (High -> Medium -> Low)
    const priorityMap = { High: 3, Medium: 2, Low: 1 };
    insights.sort((a, b) => priorityMap[b.priority] - priorityMap[a.priority]);

    res.json(insights);
  } catch (err) {
    console.error("AI Insights error:", err);
    res.status(500).json({ error: err.message || "Failed to generate AI insights" });
  }
};
