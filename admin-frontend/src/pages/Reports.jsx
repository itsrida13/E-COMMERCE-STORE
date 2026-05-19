import React, { useState } from 'react';
import { 
  FileText, Download, Filter, FileSpreadsheet, 
  Calendar, CheckCircle, AlertCircle 
} from 'lucide-react';
import { API_BASE } from '../services/api';

export default function Reports() {
  const [reportType, setReportType] = useState('products');
  const [exportFormat, setExportFormat] = useState('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const categories = [
    "All",
    "Eyes",
    "Face",
    "Lips",
    "Skincare",
    "Brushes & Tools",
    "Body"
  ];

  const handleExport = () => {
    setLoading(true);
    setStatusMessage(null);

    const params = new URLSearchParams();

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    // Only send category filter for products and inventory reports
    if (category !== 'All' && ['products', 'inventory'].includes(reportType)) {
      params.append('category', category);
    }

    const token = localStorage.getItem("token");

    const url = `${API_BASE}/api/reports/${reportType}?${params.toString()}`;

    fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async response => {
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errText}`);
        }

        return response.blob();
      })
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = `${reportType}_report.csv`;

        document.body.appendChild(a);
        a.click();

        a.remove();
        window.URL.revokeObjectURL(downloadUrl);

        setLoading(false);
        setStatusMessage({
          type: 'success',
          text: `Successfully downloaded ${reportType} report as CSV.`
        });

        setTimeout(() => setStatusMessage(null), 3000);
      })
      .catch(err => {
        console.error("Export Error:", err);

        setLoading(false);
        setStatusMessage({
          type: 'error',
          text: 'Failed to generate report. Please check backend route or server console.'
        });
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-pink-900 tracking-tight flex items-center gap-2">
            <FileText className="text-pink-600" size={28} />
            Data Reports
          </h1>
          <p className="text-gray-500 mt-1">
            Export your store&apos;s data into CSV format for offline analysis.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden max-w-4xl">
        <div className="bg-gray-50 border-b border-gray-100 p-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <FileSpreadsheet className="text-gray-500" size={18} />
            Configure Export
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Select Report Type
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { id: 'products', label: 'Products' },
                { id: 'inventory', label: 'Inventory' },
                { id: 'sales', label: 'Sales' },
                { id: 'customers', label: 'Customers' },
                { id: 'ai-insights', label: 'AI Insights' },
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setReportType(type.id)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all flex justify-center items-center ${
                    reportType === type.id 
                      ? 'border-pink-500 bg-pink-50 text-pink-700 ring-1 ring-pink-500' 
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Filters */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                <Calendar size={16} />
                Date Range
              </label>

              <div className="flex gap-4">
                <div className="flex-1">
                  <span className="text-xs text-gray-500 block mb-1">
                    Start Date
                  </span>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div className="flex-1">
                  <span className="text-xs text-gray-500 block mb-1">
                    End Date
                  </span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className={`space-y-4 ${['products', 'inventory'].includes(reportType) ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                <Filter size={16} />
                Category Filter
              </label>

              <div>
                <span className="text-xs text-gray-500 block mb-1">
                  Filter by Category
                </span>

                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
            <div>
              {statusMessage && (
                <div className={`flex items-center gap-2 text-sm font-medium ${
                  statusMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {statusMessage.type === 'success' ? (
                    <CheckCircle size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  {statusMessage.text}
                </div>
              )}
            </div>

            <div className="flex gap-4 items-center">
              <select 
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white font-bold text-gray-700"
              >
                <option value="csv">Export as CSV</option>
              </select>

              <button
                onClick={handleExport}
                disabled={loading}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white font-bold transition-all shadow-sm ${
                  loading 
                    ? 'bg-pink-400 cursor-not-allowed' 
                    : 'bg-pink-600 hover:bg-pink-700 shadow-pink-200 shadow-md'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Download {exportFormat.toUpperCase()}
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-400 text-right flex items-center justify-end gap-2">
            <span className="bg-gray-100 px-2 py-1 rounded text-gray-500">
              Excel Support Coming Soon
            </span>
            <span className="bg-gray-100 px-2 py-1 rounded text-gray-500">
              PDF Support Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}