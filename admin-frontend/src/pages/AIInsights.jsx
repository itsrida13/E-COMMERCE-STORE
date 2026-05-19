import React, { useState, useEffect } from 'react';
import { getAiInsights } from '../services/api';
import { 
  Lightbulb, AlertTriangle, TrendingUp, Package, 
  DollarSign, Sun, Activity, Filter, ListOrdered
} from 'lucide-react';

export default function AIInsights() {
  const [insights, setInsights] = useState([]);
  const [filteredInsights, setFilteredInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await getAiInsights();
      setInsights(res.data);
      setFilteredInsights(res.data);
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : msg?.error || "Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (type) => {
    setActiveFilter(type);
    if (type === "All") {
      setFilteredInsights(insights);
    } else {
      setFilteredInsights(insights.filter(i => i.type === type));
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Inventory': return <Package size={18} className="text-orange-500" />;
      case 'Sales': return <TrendingUp size={18} className="text-green-500" />;
      case 'Pricing': return <DollarSign size={18} className="text-blue-500" />;
      case 'Seasonal': return <Sun size={18} className="text-pink-500" />;
      default: return <Activity size={18} className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Analyzing store data...</p>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-center max-w-lg mx-auto mt-10">
        <AlertTriangle size={32} className="mx-auto mb-3" />
        <h3 className="text-lg font-bold mb-2">Engine Error</h3>
        <p>{error || "No insights available."}</p>
        <button onClick={fetchInsights} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-pink-900 tracking-tight flex items-center gap-2">
            <Lightbulb className="text-pink-600" size={28} />
            AI Intelligence Hub
          </h1>
          <p className="text-gray-500 mt-1">Actionable insights generated from your live inventory and sales data.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <Filter size={18} className="text-gray-400 mr-2" />
        {["All", "Inventory", "Sales", "Seasonal", "Pricing"].map(type => (
          <button
            key={type}
            onClick={() => handleFilter(type)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeFilter === type 
                ? 'bg-pink-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type}
          </button>
        ))}
        
        <div className="ml-auto flex items-center text-sm text-gray-500">
          <ListOrdered size={16} className="mr-1" /> Sorted by Priority
        </div>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredInsights.map((insight, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                    {getTypeIcon(insight.type)}
                  </div>
                  <span className="font-bold text-gray-700 text-sm uppercase tracking-wider">{insight.type}</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(insight.priority)}`}>
                  {insight.priority} Priority
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">{insight.title}</h3>
              <p className="text-gray-600 mb-4">{insight.message}</p>
              
              {(insight.productName || insight.category) && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4 text-sm">
                  {insight.productName && <div className="text-gray-800"><span className="text-gray-500 font-medium">Product:</span> {insight.productName}</div>}
                  {insight.category && <div className="text-gray-800 mt-1"><span className="text-gray-500 font-medium">Category:</span> {insight.category}</div>}
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 border-t border-gray-100 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-1 w-full">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">AI Confidence</span>
                  <span className="text-xs font-bold text-pink-600">{insight.confidenceScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-pink-400 to-pink-600 h-2 rounded-full" style={{ width: `${insight.confidenceScore}%` }}></div>
                </div>
              </div>
              
              <button className="whitespace-nowrap px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors w-full sm:w-auto">
                {insight.recommendedAction}
              </button>
            </div>
          </div>
        ))}
        
        {filteredInsights.length === 0 && (
          <div className="col-span-1 lg:col-span-2 py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            <Lightbulb size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-bold text-gray-700">No Insights Found</h3>
            <p>Your store is currently running optimally in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
