const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SEASONAL_CATEGORIES = {
  summer: ["Skincare", "Face", "Sunscreen"],
  winter: ["Lips", "Face"],
  wedding: ["Lips", "Eyes", "Face"],
  festival: ["Lips", "Eyes", "Face", "Skincare"],
};

function getSeason(month) {
  if ([5, 6, 7].includes(month)) return "summer";
  if ([11, 0, 1].includes(month)) return "winter";
  if ([3, 4, 9, 10].includes(month)) return "wedding";
  return "festival";
}

function movingAverage(values, window = 3) {
  if (!values.length) return [];
  const result = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return result;
}

function forecastNext(values, periods = 3) {
  const avg = movingAverage(values, 3);
  const last = avg[avg.length - 1] || 0;
  const trend =
    avg.length >= 2 ? (avg[avg.length - 1] - avg[avg.length - 2]) / (avg[avg.length - 2] || 1) : 0;
  const forecast = [];
  for (let i = 1; i <= periods; i++) {
    forecast.push(Math.max(0, Math.round(last * (1 + trend * i * 0.5))));
  }
  return forecast;
}

async function loadOrderData() {
  const orders = await Order.find({
    orderStatus: { $ne: "cancelled" },
    paymentStatus: { $in: ["paid", "pending", "completed", "Paid", "Pending"] },
  })
    .populate("items.productId")
    .populate("orderItems.product")
    .populate("userId", "name email createdAt")
    .lean();

  return orders;
}

exports.getDashboard = async (dateRange = 90) => {
  const orders = await loadOrderData();
  const products = await Product.find().lean();
  const users = await User.find().lean();
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - dateRange);

  const getOrderTotal = (o) => {
    let orderTotal = o.totalPrice || o.totalAmount || o.amount || o.total || 0;
    let calculatedTotal = 0;
    if (o.orderItems && o.orderItems.length > 0) {
      calculatedTotal = o.orderItems.reduce((sum, item) => {
        const price = Number(item.price || 0);
        return sum + price * (item.quantity || 1);
      }, 0);
    } else if (o.items && o.items.length > 0) {
      calculatedTotal = o.items.reduce((sum, item) => {
        const price = item.productId ? (item.productId.price || 0) : 0;
        return sum + price * (item.quantity || 1);
      }, 0);
    }
    return calculatedTotal > orderTotal ? calculatedTotal : orderTotal;
  };

  const filteredOrders = orders.filter((o) => new Date(o.createdAt) >= from);
  const allTimeRevenue = orders.reduce((s, o) => s + getOrderTotal(o), 0);
  const revenue = filteredOrders.reduce((s, o) => s + getOrderTotal(o), 0);
  const orderCount = filteredOrders.length;
  const uniqueCustomers = new Set(filteredOrders.map((o) => String(o.userId?._id || o.userId))).size;
  const aov = orderCount ? revenue / orderCount : 0;

  const prevFrom = new Date(from);
  prevFrom.setDate(prevFrom.getDate() - dateRange);
  const prevOrders = orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d >= prevFrom && d < from;
  });
  const prevRevenue = prevOrders.reduce((s, o) => s + getOrderTotal(o), 0);
  const revenueGrowth = prevRevenue ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

  const monthlyMap = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = { month: MONTHS[d.getMonth()], revenue: 0, orders: 0 };
  }
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap[key]) {
      monthlyMap[key].revenue += getOrderTotal(o);
      monthlyMap[key].orders += 1;
    }
  });
  const monthlyRevenue = Object.values(monthlyMap);
  const revenueValues = monthlyRevenue.map((m) => m.revenue);
  const forecastValues = forecastNext(revenueValues, 3);
  const forecastMonths = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    forecastMonths.push({
      month: MONTHS[d.getMonth()],
      revenue: forecastValues[i - 1],
      forecast: true,
    });
  }

  const categorySales = {};
  const productSales = {};
  const pairCount = {};

  filteredOrders.forEach((order) => {
    const ids = [];
    const itemsList = order.orderItems && order.orderItems.length > 0 ? order.orderItems : order.items;

    itemsList?.forEach((item) => {
      const p = item.product || item.productId;
      if (!p) return;
      ids.push(String(p._id));
      const cat = p.category || "Other";
      const price = Number(item.price || p.price || 0);

      categorySales[cat] = (categorySales[cat] || 0) + item.quantity * price;
      const key = String(p._id);
      if (!productSales[key]) {
        productSales[key] = {
          _id: p._id,
          name: p.name,
          brand: p.brand,
          category: p.category,
          revenue: 0,
          units: 0,
          price: p.price,
        };
      }
      productSales[key].revenue += item.quantity * price;
      productSales[key].units += item.quantity;
    });
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const pair = [ids[i], ids[j]].sort().join("|");
        pairCount[pair] = (pairCount[pair] || 0) + 1;
      }
    }
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  const categoryPie = Object.entries(categorySales)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  const totalCat = categoryPie.reduce((s, c) => s + c.value, 0) || 1;
  const categoryAnalysis = categoryPie.map((c) => ({
    ...c,
    percent: Math.round((c.value / totalCat) * 1000) / 10,
  }));

  const inventoryAlerts = [];
  const stockHealth = [];
  products.forEach((p) => {
    const sales = productSales[String(p._id)];
    const dailyRate = sales ? sales.units / Math.max(dateRange, 1) : 0;
    const daysLeft = dailyRate > 0 ? Math.floor((p.stock || 0) / dailyRate) : 999;
    const status =
      (p.stock || 0) <= 0
        ? "out"
        : (p.stock || 0) <= 5
          ? "critical"
          : daysLeft <= 7
            ? "low"
            : (p.stock || 0) > 100 && dailyRate < 0.1
              ? "overstock"
              : dailyRate < 0.05 && (p.stock || 0) > 20
                ? "dead"
                : "healthy";

    if (["out", "critical", "low", "overstock", "dead"].includes(status)) {
      inventoryAlerts.push({
        productId: p._id,
        name: p.name,
        stock: p.stock || 0,
        status,
        daysUntilOut: daysLeft < 999 ? daysLeft : null,
        dailySalesRate: Math.round(dailyRate * 100) / 100,
        restockQty: status === "low" || status === "critical" ? Math.max(20, Math.ceil(dailyRate * 30)) : null,
        message:
          status === "out"
            ? `${p.name} is out of stock.`
            : status === "critical"
              ? `${p.name} may go out of stock in ${daysLeft} days.`
              : status === "low"
                ? `${p.name} is running low (${p.stock} left, ~${daysLeft} days).`
                : status === "dead"
                  ? `${p.name} is slow-moving dead stock.`
                  : `${p.name} may be overstocked.`,
      });
    }
    stockHealth.push({ name: p.name, stock: p.stock || 0, status, daysLeft: daysLeft < 999 ? daysLeft : null });
  });

  const userOrderCount = {};
  orders.forEach((o) => {
    const uid = String(o.userId?._id || o.userId);
    userOrderCount[uid] = (userOrderCount[uid] || 0) + 1;
  });
  const repeatCustomers = Object.values(userOrderCount).filter((c) => c > 1).length;
  const repeatRate = uniqueCustomers ? (repeatCustomers / uniqueCustomers) * 100 : 0;

  const topPairs = Object.entries(pairCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pair, count]) => {
      const [id1, id2] = pair.split("|");
      const p1 = products.find((p) => String(p._id) === id1);
      const p2 = products.find((p) => String(p._id) === id2);
      return {
        products: [p1?.name, p2?.name].filter(Boolean),
        count,
        message: p1 && p2 ? `Customers buying ${p1.name} also buy ${p2.name}.` : "",
      };
    });

  const currentMonth = now.getMonth();
  const season = getSeason(currentMonth);
  const seasonalTips = SEASONAL_CATEGORIES[season] || [];
  const seasonalForecast = seasonalTips.map((cat) => ({
    category: cat,
    season,
    trend: "rising",
    note:
      season === "summer"
        ? `${cat} typically sells more in summer (skincare/sun protection).`
        : season === "winter"
          ? `${cat} and dark shades trend in winter.`
          : season === "wedding"
            ? `${cat} demand rises during wedding season.`
            : `${cat} may spike during festival periods.`,
  }));

  const heatmap = {};
  MONTHS.forEach((m, mi) => {
    heatmap[m] = {};
    categoryPie.forEach((c) => {
      heatmap[m][c.name] = 0;
    });
  });
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const m = MONTHS[d.getMonth()];
    const itemsList = o.orderItems && o.orderItems.length > 0 ? o.orderItems : o.items;
    itemsList?.forEach((item) => {
      const p = item.product || item.productId;
      const cat = p?.category || "Other";
      if (heatmap[m]) heatmap[m][cat] = (heatmap[m][cat] || 0) + item.quantity;
    });
  });
  const heatmapData = MONTHS.map((month) => ({
    month,
    ...heatmap[month],
  }));

  const pricingInsights = [];
  const catPrices = {};
  products.forEach((p) => {
    const cat = p.category || "Other";
    if (!catPrices[cat]) catPrices[cat] = [];
    catPrices[cat].push(p.price || 0);
  });
  Object.entries(catPrices).forEach(([cat, prices]) => {
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const margin = 0.35;
    pricingInsights.push({
      category: cat,
      avgPrice: Math.round(avg * 100) / 100,
      minPrice: min,
      maxPrice: max,
      suggestedDiscount: avg > 40 ? 10 : 5,
      profitMarginEst: Math.round(margin * 100),
      trend: max > avg * 1.2 ? "premium_range" : "stable",
      message:
        max > avg * 1.2
          ? `${cat} has premium items; consider bundle offers.`
          : `${cat} pricing is stable; avg $${avg.toFixed(2)}.`,
    });
  });

  const insights = [];
  if (revenueGrowth > 5) insights.push(`Revenue grew ${revenueGrowth.toFixed(1)}% vs previous period.`);
  if (revenueGrowth < -5) insights.push(`Revenue dropped ${Math.abs(revenueGrowth).toFixed(1)}%. Consider promotions.`);
  inventoryAlerts.slice(0, 3).forEach((a) => insights.push(a.message));
  seasonalForecast.slice(0, 2).forEach((s) => insights.push(s.note));
  topPairs.slice(0, 1).forEach((p) => p.message && insights.push(p.message));
  const lowCat = categoryAnalysis[categoryAnalysis.length - 1];
  if (lowCat) insights.push(`Consider discounting slow ${lowCat.name} category (${lowCat.percent}% of sales).`);
  if (repeatRate < 30) insights.push("Focus on retention: repeat customer rate is below 30%.");
  else insights.push(`Strong retention: ${repeatRate.toFixed(0)}% repeat customer rate.`);

  const weeklyMap = {};
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const key = d.toISOString().slice(0, 10);
    weeklyMap[key] = { week: `W${8 - i}`, revenue: 0, orders: 0 };
  }
  filteredOrders.forEach((o) => {
    const d = new Date(o.createdAt);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    const found = Object.keys(weeklyMap).find((k) => Math.abs(new Date(k) - weekStart) < 7 * 86400000);
    if (found && weeklyMap[found]) {
      weeklyMap[found].revenue += getOrderTotal(o);
      weeklyMap[found].orders += 1;
    }
  });
  const weeklySales = Object.values(weeklyMap);

  const categoryGrowth = [];
  const prevCatSales = {};
  const currCatSales = { ...categorySales };
  prevOrders.forEach((o) => {
    const itemsList = o.orderItems && o.orderItems.length > 0 ? o.orderItems : o.items;
    itemsList?.forEach((item) => {
      const p = item.product || item.productId;
      const cat = p?.category || "Other";
      const price = Number(item.price || p?.price || 0);
      prevCatSales[cat] = (prevCatSales[cat] || 0) + item.quantity * price;
    });
  });
  Object.keys({ ...currCatSales, ...prevCatSales }).forEach((cat) => {
    const curr = currCatSales[cat] || 0;
    const prev = prevCatSales[cat] || 0;
    const growth = prev ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0;
    categoryGrowth.push({
      name: cat,
      revenue: Math.round(curr * 100) / 100,
      growth: Math.round(growth * 10) / 10,
    });
  });
  categoryGrowth.sort((a, b) => b.growth - a.growth);
  const fastestGrowing = categoryGrowth[0] || null;
  const lowPerforming = [...categoryGrowth].sort((a, b) => a.revenue - b.revenue).slice(0, 3);

  const userSpend = {};
  filteredOrders.forEach((o) => {
    const uid = String(o.userId?._id || o.userId);
    if (!userSpend[uid]) {
      userSpend[uid] = {
        name: o.userId?.name || "Customer",
        email: o.userId?.email || "",
        orders: 0,
        spent: 0,
      };
    }
    userSpend[uid].orders += 1;
    userSpend[uid].spent += getOrderTotal(o);
  });
  const topCustomers = Object.values(userSpend)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 10);

  const FESTIVALS = [
    { name: "Wedding Season", months: [3, 4, 9, 10], categories: ["Lips", "Eyes", "Face"] },
    { name: "Summer Beauty", months: [5, 6, 7], categories: ["Skincare", "Face", "Sunscreen"] },
    { name: "Winter Glam", months: [11, 0, 1], categories: ["Lips", "Face"] },
    { name: "Festival / Eid", months: [2, 3, 8], categories: ["Lips", "Eyes", "Skincare"] },
  ];
  const festivalForecast = FESTIVALS.map((f) => {
    const upcoming = f.months.some((m) => {
      const diff = (m - currentMonth + 12) % 12;
      return diff <= 2;
    });
    return {
      event: f.name,
      categories: f.categories,
      upcoming,
      prediction: upcoming
        ? `${f.name}: expect higher demand for ${f.categories.join(", ")}.`
        : `${f.name} typically boosts ${f.categories[0]} sales.`,
    };
  });

  const productDemand = topProducts.slice(0, 8).map((p) => {
    const daily = p.units / Math.max(dateRange, 1);
    const nextMonth = Math.ceil(daily * 30);
    return {
      name: p.name,
      category: p.category,
      currentUnits: p.units,
      forecastUnits: nextMonth,
      trend: p.units > 5 ? "high" : "moderate",
    };
  });

  const profitByCategory = categoryAnalysis.map((c) => ({
    name: c.name,
    revenue: c.value,
    profit: Math.round(c.value * 0.35 * 100) / 100,
    margin: 35,
  }));

  const priceTrendLine = monthlyRevenue.map((m, i) => ({
    month: m.month,
    revenue: m.revenue,
    avgOrderValue: m.orders ? Math.round((m.revenue / m.orders) * 100) / 100 : 0,
  }));

  const competitorComparison = categoryAnalysis.slice(0, 5).map((c) => ({
    category: c.name,
    yourAvg: Math.round((c.value / (topProducts.filter((p) => p.category === c.name).length || 1)) * 100) / 100,
    marketEst: Math.round(c.value * 0.92),
  }));

  const inventoryChart = stockHealth.slice(0, 12).map((s) => ({
    name: s.name?.slice(0, 15),
    stock: s.stock,
    status: s.status,
  }));

  const trendingProducts = [...topProducts]
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  return {
    kpis: {
      revenue: Math.round(revenue * 100) / 100,
      allTimeRevenue: Math.round(allTimeRevenue * 100) / 100,
      orders: orderCount,
      customers: uniqueCustomers,
      totalUsers: users.length,
      aov: Math.round(aov * 100) / 100,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      repeatRate: Math.round(repeatRate * 10) / 10,
      productCount: products.length,
      lowStockCount: inventoryAlerts.filter((a) => ["low", "critical", "out"].includes(a.status)).length,
    },
    salesForecast: {
      monthly: [...monthlyRevenue, ...forecastMonths],
      weekly: weeklySales,
      seasonal: seasonalForecast,
    },
    categoryAnalysis,
    topProducts,
    inventory: { alerts: inventoryAlerts, health: stockHealth.slice(0, 20) },
    pricingInsights,
    customerAnalytics: {
      repeatRate,
      repeatCustomers,
      uniqueCustomers,
      segments: [
        { name: "New", count: Math.max(0, uniqueCustomers - repeatCustomers) },
        { name: "Returning", count: repeatCustomers },
      ],
    },
    recommendations: {
      topSelling: topProducts.slice(0, 5),
      boughtTogether: topPairs,
      seasonal: products
        .filter((p) => seasonalTips.includes(p.category))
        .slice(0, 5)
        .map((p) => ({ _id: p._id, name: p.name, category: p.category, price: p.price })),
      trending: topProducts.slice(0, 4),
    },
    heatmap: heatmapData,
    insights,
    dateRange,
    categoryGrowth,
    fastestGrowingCategory: fastestGrowing,
    lowPerformingCategories: lowPerforming,
    topCustomers,
    festivalForecast,
    productDemand,
    profitByCategory,
    priceTrendLine,
    competitorComparison,
    inventoryChart,
    trendingProducts,
    mostPurchased: topProducts.slice(0, 5),
  };
};
