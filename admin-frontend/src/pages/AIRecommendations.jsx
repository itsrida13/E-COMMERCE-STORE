import React, { useState, useEffect } from 'react';
import { getRecommendations } from '../services/api';
import { getProductImageUrl } from '../utils/image';
import { 
  Sparkles, TrendingUp, PackagePlus, 
  Sun, Snowflake, AlertCircle, Percent,
  Tag, Activity, PlusCircle
} from 'lucide-react';
import { applyProductDiscount, markProductClearance, createBundle, adjustStock } from '../services/api';

export default function AIRecommendations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await getRecommendations();
      setData(res.data);
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : msg?.error || "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDiscount = async (id, percentage) => {
    try {
      const num = parseInt(percentage.replace('%', ''), 10);
      await applyProductDiscount(id, num);
      alert(`Successfully applied ${percentage} discount!`);
      fetchRecommendations(); // refresh data
    } catch (err) {
      alert("Failed to apply discount.");
    }
  };

  const handleMarkClearance = async (id) => {
    try {
      await markProductClearance(id);
      alert("Product marked for clearance!");
      fetchRecommendations();
    } catch (err) {
      alert("Failed to mark clearance.");
    }
  };

  const handleRestock = async (productId, name) => {
    const confirmRestock = window.confirm(`Restock 25 units of "${name}"?`);
    if (!confirmRestock) return;
    try {
      await adjustStock(productId, { method: "addition", quantity: 25, reason: "Best Seller Restock" });
      alert("Stock restocked successfully!");
      fetchRecommendations();
    } catch (err) {
      alert("Failed to restock: " + (err.response?.data?.error || err.message));
    }
  };

  const handleCreateBundle = async (bundle) => {
    const discountPct = parseInt(bundle.suggestedDiscount.replace('%', ''), 10) || 15;
    const defaultName = `${bundle.mainProduct.name} & ${bundle.recommendedProduct.name} Duo`;
    
    const confirmCreate = window.confirm(`Create AI Bundle: "${defaultName}" with ${discountPct}% off?`);
    if (!confirmCreate) return;

    const payload = {
      name: defaultName,
      products: [bundle.mainProduct._id, bundle.recommendedProduct._id],
      discountPercentage: discountPct,
      reason: bundle.reason,
      isActive: true,
    };

    try {
      await createBundle(payload);
      alert(`AI Bundle "${defaultName}" created successfully! It is now active on the store frontend.`);
      fetchRecommendations();
    } catch (err) {
      alert("Failed to create bundle: " + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Generating AI Recommendations...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-center max-w-lg mx-auto mt-10">
        <AlertCircle size={32} className="mx-auto mb-3" />
        <h3 className="text-lg font-bold mb-2">Engine Error</h3>
        <p>{error || "No data available."}</p>
        <button onClick={fetchRecommendations} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-pink-900 tracking-tight flex items-center gap-2">
            <Sparkles className="text-pink-600" size={28} />
            AI Recommendation Engine
          </h1>
          <p className="text-gray-500 mt-1">Data-driven cross-selling, seasonal picks, and inventory optimizations.</p>
        </div>
      </div>

      {/* 1. Best Sellers */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="text-blue-500" /> Top Best Sellers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.bestSellers.map(product => (
            <div key={product._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-48 bg-gray-100 relative">
                <img 
                  src={getProductImageUrl(product.image)} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-pink-700 text-xs font-bold px-2 py-1 rounded-lg">
                  Top Ranked
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 truncate">{product.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{product.category}</p>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-500 text-xs">Total Sold</p>
                    <p className="font-semibold text-gray-800">{product.totalSold}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-500 text-xs">Revenue</p>
                    <p className="font-semibold text-green-600">${product.revenue}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                  <button 
                    onClick={() => handleRestock(product._id, product.name)}
                    className="flex-1 bg-pink-100 hover:bg-pink-200 text-pink-700 text-xs font-bold py-2 rounded transition-colors flex justify-center items-center gap-1"
                  >
                    <PlusCircle size={14} /> Restock
                  </button>
                  <button className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-bold py-2 rounded transition-colors flex justify-center items-center gap-1">
                    <PackagePlus size={14} /> Bundle
                  </button>
                  <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded transition-colors flex justify-center items-center gap-1">
                    <Activity size={14} /> View Analytics
                  </button>
                </div>
              </div>
            </div>
          ))}
          {data.bestSellers.length === 0 && <p className="text-gray-500">No sales data available yet.</p>}
        </div>
      </section>

      {/* 2. Frequently Bought Together (Bundles) */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <PackagePlus className="text-purple-500" /> AI Cross-Sell Bundles
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.bundles.map((bundle, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-purple-100 shadow-sm p-5 flex flex-col sm:flex-row gap-5 items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-bl-lg">
                Suggested
              </div>
              
              <div className="flex items-center gap-4 flex-1">
                <div className="text-center">
                  <img src={getProductImageUrl(bundle.mainProduct.image)} alt={bundle.mainProduct.name} className="w-16 h-16 rounded-lg object-cover mb-2 border border-gray-100" />
                  <p className="text-xs font-medium w-16 truncate" title={bundle.mainProduct.name}>{bundle.mainProduct.name}</p>
                </div>
                <div className="text-purple-400 font-bold text-xl">+</div>
                <div className="text-center">
                  <img src={getProductImageUrl(bundle.recommendedProduct.image)} alt={bundle.recommendedProduct.name} className="w-16 h-16 rounded-lg object-cover mb-2 border border-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.2)]" />
                  <p className="text-xs font-medium w-16 truncate" title={bundle.recommendedProduct.name}>{bundle.recommendedProduct.name}</p>
                </div>
              </div>
              
              <div className="flex-1 text-center sm:text-left border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-5">
                <h4 className="font-bold text-gray-800 mb-1">{bundle.reason}</h4>
                <p className="text-sm text-gray-500 mb-3">Recommend these together with a <span className="font-bold text-green-600">{bundle.suggestedDiscount} discount</span> to increase AOV.</p>
                <button 
                  onClick={() => handleCreateBundle(bundle)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors w-full sm:w-auto"
                >
                  Create Bundle
                </button>
              </div>
            </div>
          ))}
          {data.bundles.length === 0 && <p className="text-gray-500">No logical bundles found in current catalog.</p>}
        </div>
      </section>

      {/* 3. Seasonal Picks */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Sun className="text-orange-500" /> Upcoming Seasonal Picks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.seasonal.map(product => (
            <div key={product._id} className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100 shadow-sm p-4 relative">
              <div className="flex gap-3 mb-3">
                <img src={getProductImageUrl(product.image)} alt={product.name} className="w-12 h-12 rounded-lg object-cover bg-white" />
                <div>
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2">{product.name}</h3>
                  <div className="flex items-center gap-1 mt-1 text-orange-600 text-xs font-bold">
                    {product.season === 'Summer' ? <Sun size={14} /> : <Snowflake size={14} />}
                    {product.season}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-3">{product.reason}</p>
              <div className="bg-white/60 rounded p-2 text-xs text-center border border-orange-200">
                Expected Demand: <span className="font-bold text-gray-800">{product.expectedDemand}</span>
              </div>
            </div>
          ))}
          {data.seasonal.length === 0 && <p className="text-gray-500">No seasonal trends detected.</p>}
        </div>
      </section>

      {/* 4. Slow Moving Recommendations */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Percent className="text-red-500" /> Discount Recommendations (Slow Moving)
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Current Stock</th>
                <th className="px-6 py-4 font-semibold">Total Sold</th>
                <th className="px-6 py-4 font-semibold">AI Reason</th>
                <th className="px-6 py-4 font-semibold">Suggested Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.slowMoving.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <img src={getProductImageUrl(product.image)} alt={product.name} className="w-8 h-8 rounded object-cover" />
                    <span className="font-medium text-gray-900">{product.name}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-red-600">{product.stock}</td>
                  <td className="px-6 py-4 text-gray-500">{product.totalSold}</td>
                  <td className="px-6 py-4 text-gray-600">{product.reason}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => handleApplyDiscount(product._id, product.suggestedDiscount)}
                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg transition-colors border border-red-200 flex items-center justify-center gap-1"
                      >
                        <Percent size={12} /> Apply {product.suggestedDiscount} Discount
                      </button>
                      <button 
                        onClick={() => handleMarkClearance(product._id)}
                        className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs font-bold rounded-lg transition-colors border border-orange-200 flex items-center justify-center gap-1"
                      >
                        <Tag size={12} /> Mark Clearance
                      </button>
                      <div className="flex gap-2">
                        <button className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors border border-gray-200">
                          Create Campaign
                        </button>
                        <button className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors border border-gray-200">
                          View Product
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {data.slowMoving.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No slow moving inventory detected. Great job!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
