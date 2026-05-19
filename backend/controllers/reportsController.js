const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

// Helper to convert array of objects to CSV string
const generateCSV = (headers, data) => {
  const headerRow = headers.join(",");
  const dataRows = data.map(row => {
    return headers.map(header => {
      let cell = row[header] === null || row[header] === undefined ? "" : row[header].toString();
      // Escape quotes and wrap in quotes if there's a comma
      if (cell.includes(",") || cell.includes('"')) {
        cell = `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(",");
  });
  return [headerRow, ...dataRows].join("\n");
};

const sendCSV = (res, filename, csvString) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.status(200).send(csvString);
};

exports.getProductsReport = async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    const filter = {};
    if (category && category !== "All") filter.category = category;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const products = await Product.find(filter);
    
    // Requested Columns: Product Name, Brand, Category, Shade, Price, Cost Price, Selling Price, Stock, Reorder Level, Supplier, Expiry Date, Created At
    const data = products.map(p => ({
      "Product Name": p.name || "",
      "Brand": p.brand || "",
      "Category": p.category || "",
      "Shade": p.shade || "",
      "Price": p.price || 0,
      "Cost Price": p.costPrice || "",
      "Selling Price": p.price || 0,
      "Stock": p.stock || 0,
      "Reorder Level": p.reorderLevel || 10,
      "Supplier": p.supplier || p.supplierName || "",
      "Expiry Date": p.expiryDate ? new Date(p.expiryDate).toISOString().split("T")[0] : "",
      "Created At": p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : ""
    }));

    const headers = ["Product Name", "Brand", "Category", "Shade", "Price", "Cost Price", "Selling Price", "Stock", "Reorder Level", "Supplier", "Expiry Date", "Created At"];
    const csv = generateCSV(headers, data);
    sendCSV(res, "products_report.csv", csv);
  } catch (err) {
    console.error("Product Report Error:", err);
    res.status(500).json({ error: "Failed to generate products report" });
  }
};

exports.getInventoryReport = async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    const filter = {};
    if (category && category !== "All") filter.category = category;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const products = await Product.find(filter);
    
    // Requested Columns: Product Name, Category, Current Stock, Reorder Level, Max Stock, Stock Status, Supplier Name, Expiry Date, Last Restocked At
    const data = products.map(p => {
      let status = "In Stock";
      if (p.stock === 0) status = "Out of Stock";
      else if (p.stock < (p.reorderLevel || 15)) status = "Low Stock";

      return {
        "Product Name": p.name || "",
        "Category": p.category || "",
        "Current Stock": p.stock || 0,
        "Reorder Level": p.reorderLevel || 10,
        "Max Stock": p.maxStock || "",
        "Stock Status": status,
        "Supplier Name": p.supplier || p.supplierName || "",
        "Expiry Date": p.expiryDate ? new Date(p.expiryDate).toISOString().split("T")[0] : "",
        "Last Restocked At": p.updatedAt ? new Date(p.updatedAt).toISOString().split("T")[0] : ""
      };
    });

    const headers = ["Product Name", "Category", "Current Stock", "Reorder Level", "Max Stock", "Stock Status", "Supplier Name", "Expiry Date", "Last Restocked At"];
    const csv = generateCSV(headers, data);
    sendCSV(res, "inventory_report.csv", csv);
  } catch (err) {
    console.error("Inventory Report Error:", err);
    res.status(500).json({ error: "Failed to generate inventory report" });
  }
};

exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const orders = await Order.find(filter).populate("userId", "email name");
    
    // Requested Columns: Order ID, Customer Name, Customer Email, Total Amount, Payment Status, Order Status, Created At
    const data = orders.map(o => ({
      "Order ID": o._id.toString(),
      "Customer Name": o.userId ? o.userId.name : (o.shippingAddress ? o.shippingAddress.fullName : "Guest"),
      "Customer Email": o.userId ? o.userId.email : (o.shippingAddress ? o.shippingAddress.email : ""),
      "Total Amount": o.totalPrice || 0,
      "Payment Status": o.paymentStatus || "pending",
      "Order Status": o.orderStatus || "processing",
      "Created At": o.createdAt ? new Date(o.createdAt).toISOString().split("T")[0] : ""
    }));

    const headers = ["Order ID", "Customer Name", "Customer Email", "Total Amount", "Payment Status", "Order Status", "Created At"];
    const csv = generateCSV(headers, data);
    sendCSV(res, "sales_report.csv", csv);
  } catch (err) {
    console.error("Sales Report Error:", err);
    res.status(500).json({ error: "Failed to generate sales report" });
  }
};

exports.getCustomersReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { role: "user" };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const users = await User.find(filter);
    
    // Requested Columns: Name, Email, Role, Created At
    const data = users.map(u => ({
      "Name": u.name || "",
      "Email": u.email || "",
      "Role": u.role || "user",
      "Created At": u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : ""
    }));

    const headers = ["Name", "Email", "Role", "Created At"];
    const csv = generateCSV(headers, data);
    sendCSV(res, "customers_report.csv", csv);
  } catch (err) {
    console.error("Customers Report Error:", err);
    res.status(500).json({ error: "Failed to generate customers report" });
  }
};

exports.getAiInsightsReport = async (req, res) => {
  try {
    const products = await Product.find();
    const orders = await Order.find({ orderStatus: { $ne: "cancelled" } });
    const insights = [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const productStats = {};
    products.forEach(p => {
      productStats[p._id.toString()] = { product: p, salesRecent: 0, salesPrevious: 0 };
    });

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt || order.date);
      if (orderDate >= sixtyDaysAgo && order.items) {
        order.items.forEach(item => {
          const pid = item.productId ? item.productId.toString() : null;
          if (pid && productStats[pid]) {
            if (orderDate >= thirtyDaysAgo) productStats[pid].salesRecent += (item.quantity || 1);
            else productStats[pid].salesPrevious += (item.quantity || 1);
          }
        });
      }
    });

    products.forEach(p => {
      const stats = productStats[p._id.toString()];
      const stock = p.stock || 0;
      const name = p.name;
      const catLower = (p.category || "").toLowerCase();
      
      if (stock === 0) {
        insights.push({ "Title": "Out of Stock", "Type": "Inventory", "Priority": "High", "Message": `${name} is out of stock.`, "Recommended Action": "Restock", "Confidence Score": "100", "Created At": new Date().toISOString().split("T")[0] });
      } else if (stock > 0 && stock <= 15 && stats.salesRecent > 5) {
        insights.push({ "Title": "Low Stock Warning", "Type": "Inventory", "Priority": "High", "Message": `${name} may go out of stock soon.`, "Recommended Action": "Restock Soon", "Confidence Score": "92", "Created At": new Date().toISOString().split("T")[0] });
      } else if (stock > 100 && stats.salesRecent === 0) {
        insights.push({ "Title": "Dead Stock", "Type": "Inventory", "Priority": "Medium", "Message": `${name} has >100 stock but 0 recent sales.`, "Recommended Action": "Clearance Sale", "Confidence Score": "88", "Created At": new Date().toISOString().split("T")[0] });
      }

      if (stats.salesRecent > 0 && stats.salesPrevious > 0) {
        const growth = ((stats.salesRecent - stats.salesPrevious) / stats.salesPrevious) * 100;
        if (growth > 50) {
          insights.push({ "Title": "Trending Product", "Type": "Sales", "Priority": "Medium", "Message": `${name} sales increased by ${Math.round(growth)}%.`, "Recommended Action": "Increase Marketing", "Confidence Score": "85", "Created At": new Date().toISOString().split("T")[0] });
        }
      }

      if (catLower.includes("sunscreen") || name.toLowerCase().includes("sunscreen")) {
        insights.push({ "Title": "Summer Trend", "Type": "Seasonal", "Priority": "Low", "Message": `Demand for ${name} expected to rise.`, "Recommended Action": "Highlight on Homepage", "Confidence Score": "90", "Created At": new Date().toISOString().split("T")[0] });
      }
    });

    // Requested Columns: Title, Type, Priority, Message, Recommended Action, Confidence Score, Created At
    const headers = ["Title", "Type", "Priority", "Message", "Recommended Action", "Confidence Score", "Created At"];
    const csv = generateCSV(headers, insights);
    sendCSV(res, "ai_insights_report.csv", csv);
  } catch (err) {
    console.error("AI Insights Report Error:", err);
    res.status(500).json({ error: "Failed to generate AI insights report" });
  }
};
