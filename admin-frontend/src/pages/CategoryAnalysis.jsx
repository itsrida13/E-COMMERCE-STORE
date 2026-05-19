import React, { useState, useEffect } from 'react';
import { getProducts, getOrders } from '../services/api';
import { 
  FolderHeart, DollarSign, ShoppingBag, 
  Package, Sparkles, AlertTriangle, HelpCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

const COLORS = ["#be185d", "#db2777", "#ec4899", "#f472b6", "#fbcfe8", "#8b5cf6", "#a78bfa"];

export default function CategoryAnalysis() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, orderRes] = await Promise.all([
        getProducts(),
        getOrders()
      ]);
      setProducts(prodRes.data || []);
      setOrders(orderRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load category analysis data");
    } finally {
      setLoading(false);
    }
  };

  // Group products and compute stats per category
  const categoryStats = {};

  products.forEach(p => {
    const cat = p.category || "Uncategorized";
    if (!categoryStats[cat]) {
      categoryStats[cat] = {
        name: cat,
        productCount: 0,
        totalStock: 0,
        totalSold: 0,
        revenue: 0,
        avgPriceSum: 0,
        minPrice: Infinity,
        maxPrice: -Infinity,
      };
    }
    const stats = categoryStats[cat];
    stats.productCount += 1;
    stats.totalStock += (p.stock || p.countInStock || 0);
    stats.avgPriceSum += (p.price || 0);
    if ((p.price || 0) < stats.minPrice) stats.minPrice = p.price;
    if ((p.price || 0) > stats.maxPrice) stats.maxPrice = p.price;
  });

  // Calculate average price
  Object.keys(categoryStats).forEach(cat => {
    const stats = categoryStats[cat];
    stats.avgPrice = stats.productCount > 0 ? Math.round((stats.avgPriceSum / stats.productCount) * 100) / 100 : 0;
  });

  // Aggregate sales orders
  orders.forEach(order => {
    if (order.orderStatus === 'cancelled') return;
    
    const itemsList = order.orderItems && order.orderItems.length > 0 ? order.orderItems : order.items;
    
    itemsList?.forEach(item => {
      const targetProdId = item.productId?._id || item.productId || item.product?._id || item.product;
      const targetProduct = products.find(p => p._id.toString() === targetProdId?.toString());
      const cat = targetProduct?.category || "Uncategorized";

      if (!categoryStats[cat]) {
        categoryStats[cat] = {
          name: cat,
          productCount: 0,
          totalStock: 0,
          totalSold: 0,
          revenue: 0,
          avgPriceSum: 0,
          minPrice: Infinity,
          maxPrice: -Infinity,
        };
      }

      const qty = Number(item.quantity || 1);
      const price = Number(item.price || targetProduct?.price || 0);

      categoryStats[cat].totalSold += qty;
      categoryStats[cat].revenue += qty * price;
    });
  });

  const categoryList = Object.values(categoryStats).map(stats => ({
    ...stats,
    revenue: Math.round(stats.revenue * 100) / 100,
    minPrice: stats.minPrice === Infinity ? 0 : stats.minPrice,
    maxPrice: stats.maxPrice === -Infinity ? 0 : stats.maxPrice,
  })).sort((a, b) => b.revenue - a.revenue);

  // Summary Metrics
  const totalCategories = categoryList.length;
  const totalRevenue = categoryList.reduce((sum, c) => sum + c.revenue, 0);
  const totalUnitsSold = categoryList.reduce((sum, c) => sum + c.totalSold, 0);
  const totalStock = categoryList.reduce((sum, c) => sum + c.totalStock, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Analyzing category performance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-center max-w-lg mx-auto mt-10">
        <AlertTriangle size={32} className="mx-auto mb-3" />
        <h3 className="text-lg font-bold mb-2">Category Engine Error</h3>
        <p>{error}</p>
        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-pink-900 tracking-tight flex items-center gap-2">
            <FolderHeart className="text-pink-600" size={28} />
            Category Performance Analysis
          </h1>
          <p className="text-gray-500 mt-1">Real-time revenue share, inventory health, and demand stats per category.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Categories Listed</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{totalCategories}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center text-pink-600">
            <FolderHeart size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Category Revenue</p>
            <p className="text-2xl font-bold text-green-600 mt-1">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Sold (Units)</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{totalUnitsSold}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <ShoppingBag size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Stock Value</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{totalStock} units</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
            <Package size={24} />
          </div>
        </div>
      </div>

      {/* Recharts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Category Sales Share ($ Revenue)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryList} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                />
                <Bar dataKey="revenue" fill="#be185d" radius={[4, 4, 0, 0]} name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Inventory Stock Share</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryList}
                  dataKey="totalStock"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {categoryList.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category List Details Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="text-pink-600" size={20} />
            Category Intelligence Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-white border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Products Count</th>
                <th className="px-6 py-4 font-semibold">Inventory Level</th>
                <th className="px-6 py-4 font-semibold">Units Sold</th>
                <th className="px-6 py-4 font-semibold">Average listed Price</th>
                <th className="px-6 py-4 font-semibold">Price Limits (Min - Max)</th>
                <th className="px-6 py-4 font-semibold text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categoryList.map((c) => (
                <tr key={c.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 capitalize">{c.name}</td>
                  <td className="px-6 py-4 text-gray-600">{c.productCount}</td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className={`font-semibold ${c.totalStock <= 10 ? 'text-orange-600' : 'text-gray-900'}`}>
                      {c.totalStock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{c.totalSold}</td>
                  <td className="px-6 py-4 text-gray-600">${c.avgPrice}</td>
                  <td className="px-6 py-4 text-gray-500">${c.minPrice} - ${c.maxPrice}</td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">${c.revenue}</td>
                </tr>
              ))}

              {categoryList.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No active product categories detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
