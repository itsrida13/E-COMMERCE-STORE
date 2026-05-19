import React, { useState, useEffect } from 'react';
import { getSalesPredictions, adjustStock, applyProductDiscount } from '../services/api';
import { 
  TrendingUp, AlertTriangle, ArrowUpRight, 
  ArrowDownRight, CheckCircle2, Sparkles, Tag
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function SalesPrediction() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const { data } = await getSalesPredictions();
      setPredictions(data.products || data);
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : msg?.error || "Failed to load predictions");
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = async (productId, name) => {
    const confirmRestock = window.confirm(`Restock 20 units of "${name}"?`);
    if (!confirmRestock) return;
    try {
      await adjustStock(productId, { method: "addition", quantity: 20, reason: "AI Predicted Restock" });
      alert("Stock restocked successfully!");
      fetchPredictions();
    } catch (err) {
      alert("Failed to restock: " + (err.response?.data?.error || err.message));
    }
  };

  const handleApplyDiscount = async (productId, name) => {
    const confirmDiscount = window.confirm(`Apply 20% discount to "${name}"?`);
    if (!confirmDiscount) return;
    try {
      await applyProductDiscount(productId, 20);
      alert("Discount applied successfully!");
      fetchPredictions();
    } catch (err) {
      alert("Failed to apply discount: " + (err.response?.data?.error || err.message));
    }
  };

  // Aggregated stats for summary cards
  const totalPredicted = predictions.reduce((acc, p) => acc + p.predictedDemand, 0);
  const urgentRestocks = predictions.filter(p => p.recommendedAction === 'Urgent Restock').length;
  const discountItems = predictions.filter(p => p.recommendedAction === 'Discount').length;
  const avgConfidence = predictions.length > 0 
    ? Math.round(predictions.reduce((acc, p) => acc + p.confidenceScore, 0) / predictions.length)
    : 0;

  // Data for category forecast chart
  const categories = [...new Set(predictions.map(p => p.category || 'Uncategorized'))];
  const chartData = categories.map(cat => {
    const catItems = predictions.filter(p => (p.category || 'Uncategorized') === cat);
    return {
      name: cat,
      Current: catItems.reduce((acc, p) => acc + p.monthlySales, 0),
      Predicted: catItems.reduce((acc, p) => acc + p.predictedDemand, 0)
    };
  }).filter(d => d.Current > 0 || d.Predicted > 0).slice(0, 7); // Top 7 categories

  const getActionStyle = (action) => {
    switch(action) {
      case 'Urgent Restock': return 'bg-red-100 text-red-700 border-red-200';
      case 'Restock Soon': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Discount': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Price Review': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">AI is analyzing sales patterns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-center max-w-lg mx-auto mt-10">
        <AlertTriangle size={32} className="mx-auto mb-3" />
        <h3 className="text-lg font-bold mb-2">Prediction Engine Error</h3>
        <p>{error}</p>
        <button onClick={fetchPredictions} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-pink-900 tracking-tight flex items-center gap-2">
            <Sparkles className="text-pink-600" size={28} />
            AI Sales Predictions
          </h1>
          <p className="text-gray-500 mt-1">Rule-based AI forecasting based on seasonal trends and velocity.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Predicted (30d)</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{totalPredicted} units</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <TrendingUp size={24} />
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Avg Confidence</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{avgConfidence}%</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-red-500 font-medium">Urgent Restocks</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{urgentRestocks}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Discount Targets</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{discountItems}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
            <Tag size={24} />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Category Demand Forecast (Next 30 Days)</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{fill: '#f9fafb'}}
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
              />
              <Legend />
              <Bar dataKey="Current" fill="#9ca3af" radius={[4, 4, 0, 0]} name="Current Month" />
              <Bar dataKey="Predicted" fill="#be185d" radius={[4, 4, 0, 0]} name="Predicted Next Month" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">Product Demand Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-white border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Current Stock</th>
                <th className="px-6 py-4 font-semibold">Predicted Demand</th>
                <th className="px-6 py-4 font-semibold">Confidence</th>
                <th className="px-6 py-4 font-semibold w-1/3">AI Reasoning</th>
                <th className="px-6 py-4 font-semibold">Action Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {predictions.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.category}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${p.currentStock === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {p.currentStock}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{p.predictedDemand}</span>
                      {p.demandChangePercentage > 0 ? (
                        <span className="flex items-center text-xs text-green-600 font-medium">
                          <ArrowUpRight size={14} /> +{p.demandChangePercentage}%
                        </span>
                      ) : p.demandChangePercentage < 0 ? (
                        <span className="flex items-center text-xs text-red-600 font-medium">
                          <ArrowDownRight size={14} /> {p.demandChangePercentage}%
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${p.confidenceScore >= 85 ? 'bg-green-500' : p.confidenceScore >= 75 ? 'bg-blue-500' : 'bg-orange-500'}`} 
                          style={{width: `${p.confidenceScore}%`}}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-600">{p.confidenceScore}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-2 rounded border border-gray-100">
                      {p.seasonReason}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getActionStyle(p.recommendedAction)}`}>
                        {p.recommendedAction}
                      </span>
                      {p.recommendedAction === "Urgent Restock" && (
                        <button
                          onClick={() => handleRestock(p.productId || p._id, p.name)}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 font-medium transition-colors"
                        >
                          Restock
                        </button>
                      )}
                      {p.recommendedAction === "Discount" && (
                        <button
                          onClick={() => handleApplyDiscount(p.productId || p._id, p.name)}
                          className="px-2 py-1 text-xs bg-pink-600 text-white rounded hover:bg-pink-700 font-medium transition-colors"
                        >
                          Apply Discount
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {predictions.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No active products found for prediction analysis.
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
