import React, { useState, useEffect, useMemo } from "react";
import {
  getInventory,
  getStockAlerts,
  adjustStock,
  restockProduct,
  getStockHistory,
  API_BASE,
} from "../services/api";

export default function InventoryManagement() {
  const [products, setProducts] = useState([]);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeModal, setActiveModal] = useState(null); // restock, adjust, history
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);

  const [adjustData, setAdjustData] = useState({
    quantity: "",
    reason: "",
    note: "",
  });

  const [restockData, setRestockData] = useState({
    quantity: "",
    supplierName: "",
    purchaseCost: "",
    batchNumber: "",
    expiryDate: "",
    note: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const normalizeResponse = (response) => {
    return response?.data !== undefined ? response.data : response;
  };

  const fetchData = async () => {
    setLoading(true);

    try {
      const [invRes, alertRes] = await Promise.all([
        getInventory(),
        getStockAlerts(),
      ]);

      const inventoryData = normalizeResponse(invRes);
      const alertData = normalizeResponse(alertRes);

      setProducts(Array.isArray(inventoryData) ? inventoryData : []);
      setAlerts(alertData || null);
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
      setProducts([]);
      setAlerts(null);
    } finally {
      setLoading(false);
    }
  };

  const computedSummary = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let overstockCount = 0;
    let expiringSoonCount = 0;

    products.forEach((product) => {
      const stock = Number(product.stock || 0);
      const reorderLevel = Number(product.reorderLevel || 10);
      const maxStockLevel = Number(product.maxStockLevel || 100);
      const valuePrice = Number(
        product.costPrice || product.sellingPrice || product.price || 0
      );

      totalStockValue += stock * valuePrice;

      if (stock <= 0) {
        outOfStockCount += 1;
      } else if (stock <= reorderLevel) {
        lowStockCount += 1;
      }

      if (stock > maxStockLevel) {
        overstockCount += 1;
      }

      if (product.expiryDate) {
        const expiry = new Date(product.expiryDate);
        if (expiry > today && expiry <= thirtyDaysFromNow) {
          expiringSoonCount += 1;
        }
      }
    });

    return {
      totalStockValue,
      lowStockCount,
      outOfStockCount,
      overstockCount,
      expiringSoonCount,
    };
  }, [products]);

  const summary = {
    totalStockValue:
      alerts?.totalStockValue !== undefined
        ? Number(alerts.totalStockValue || 0)
        : computedSummary.totalStockValue,
    lowStockCount:
      alerts?.lowStockCount !== undefined
        ? Number(alerts.lowStockCount || 0)
        : computedSummary.lowStockCount,
    outOfStockCount:
      alerts?.outOfStockCount !== undefined
        ? Number(alerts.outOfStockCount || 0)
        : computedSummary.outOfStockCount,
    overstockCount:
      alerts?.overstockCount !== undefined
        ? Number(alerts.overstockCount || 0)
        : computedSummary.overstockCount,
    expiringSoonCount:
      alerts?.expiringSoonCount !== undefined
        ? Number(alerts.expiringSoonCount || 0)
        : computedSummary.expiringSoonCount,
  };

  const openAdjustModal = (product) => {
    setSelectedProduct(product);
    setAdjustData({
      quantity: "",
      reason: "",
      note: "",
    });
    setActiveModal("adjust");
  };

  const openRestockModal = (product) => {
    setSelectedProduct(product);
    setRestockData({
      quantity: "",
      supplierName:
        product.supplierName && product.supplierName !== "No supplier"
          ? product.supplierName
          : "",
      purchaseCost: product.costPrice || "",
      batchNumber:
        product.batchNumber && product.batchNumber !== "No batch"
          ? product.batchNumber
          : "",
      expiryDate: product.expiryDate
        ? new Date(product.expiryDate).toISOString().split("T")[0]
        : "",
      note: "",
    });
    setActiveModal("restock");
  };

  const openHistoryModal = async (product) => {
    setSelectedProduct(product);
    setActiveModal("history");
    setHistoryLogs([]);

    try {
      const response = await getStockHistory(product._id);
      const data = normalizeResponse(response);
      setHistoryLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch stock history:", err);
      setHistoryLogs([]);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedProduct(null);
    setHistoryLogs([]);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProduct) return;

    const quantityChange = Number(adjustData.quantity);

    if (Number.isNaN(quantityChange)) {
      alert("Please enter a valid stock adjustment number.");
      return;
    }

    if (quantityChange === 0) {
      alert("Adjustment quantity cannot be 0.");
      return;
    }

    try {
      await adjustStock(selectedProduct._id, {
        quantity: quantityChange,
        reason: adjustData.reason,
        note: adjustData.note,
      });

      closeModal();
      await fetchData();
    } catch (err) {
      console.error("Adjust stock error:", err);
      alert("Failed to adjust stock. Please check backend console.");
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProduct) return;

    const quantity = Number(restockData.quantity);

    if (Number.isNaN(quantity) || quantity <= 0) {
      alert("Restock quantity must be greater than 0.");
      return;
    }

    try {
      await restockProduct(selectedProduct._id, {
        quantity,
        supplierName: restockData.supplierName,
        purchaseCost: restockData.purchaseCost,
        batchNumber: restockData.batchNumber,
        expiryDate: restockData.expiryDate,
        note: restockData.note,
      });

      closeModal();
      await fetchData();
    } catch (err) {
      console.error("Restock error:", err);
      alert("Failed to restock. Please check backend console.");
    }
  };

  const getStockStatus = (product) => {
    const stock = Number(product.stock || 0);
    const reorderLevel = Number(product.reorderLevel || 10);
    const maxStockLevel = Number(product.maxStockLevel || 100);

    if (stock <= 0) return "Out of Stock";
    if (stock <= reorderLevel) return "Low Stock";
    if (stock > maxStockLevel) return "Overstock";

    return product.stockStatus || "In Stock";
  };

  const getStatusBadgeColor = (status) => {
    if (status === "In Stock") return "bg-green-100 text-green-800";
    if (status === "Low Stock") return "bg-yellow-100 text-yellow-800";
    if (status === "Out of Stock") return "bg-red-100 text-red-800";
    if (status === "Overstock") return "bg-blue-100 text-blue-800";
    if (status === "Expiring Soon") return "bg-purple-100 text-purple-800";

    return "bg-gray-100 text-gray-800";
  };

  const getProductImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/48?text=No+Image";
    if (imagePath.startsWith("http")) return imagePath;
    return `${API_BASE}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
  };

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (date) => {
    if (!date) return "No expiry";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-pink-900 tracking-tight">
              Stock Management
            </h1>
            <p className="text-gray-500 mt-1">
              Monitor, adjust, and replenish your beauty inventory.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        {loading ? (
          <div className="h-32 bg-white animate-pulse rounded-xl shadow-sm border border-gray-100"></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Total Value
              </h3>
              <p className="text-2xl font-bold text-pink-900 mt-2">
                ${formatCurrency(summary.totalStockValue)}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-sm font-medium text-yellow-600 uppercase tracking-wider">
                Low Stock
              </h3>
              <p className="text-2xl font-bold text-yellow-700 mt-2">
                {summary.lowStockCount}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-red-200 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-sm font-medium text-red-600 uppercase tracking-wider">
                Out of Stock
              </h3>
              <p className="text-2xl font-bold text-red-700 mt-2">
                {summary.outOfStockCount}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-sm font-medium text-blue-600 uppercase tracking-wider">
                Overstock
              </h3>
              <p className="text-2xl font-bold text-blue-700 mt-2">
                {summary.overstockCount}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-sm font-medium text-purple-600 uppercase tracking-wider">
                Expiring Soon
              </h3>
              <p className="text-2xl font-bold text-purple-700 mt-2">
                {summary.expiringSoonCount}
              </p>
            </div>
          </div>
        )}

        {/* Main Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-800">
              Inventory Status
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Stock</th>
                  <th className="px-6 py-4 font-medium text-right">
                    Reorder/Max
                  </th>
                  <th className="px-6 py-4 font-medium">Supplier</th>
                  <th className="px-6 py-4 font-medium">Expiry</th>
                  <th className="px-6 py-4 font-medium text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="p-8 text-center text-gray-400 animate-pulse"
                    >
                      Loading inventory data...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-500">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const status = getStockStatus(product);

                    return (
                      <tr
                        key={product._id}
                        className="hover:bg-pink-50/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={getProductImageUrl(product.image)}
                              alt={product.name}
                              className="w-10 h-10 rounded-md object-cover border border-gray-200"
                            />
                            <div>
                              <p className="font-semibold text-gray-800">
                                {product.name || "Unnamed Product"}
                              </p>
                              <p className="text-xs text-gray-500 truncate max-w-[150px]">
                                Batch: {product.batchNumber || "No batch"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {product.category || "Uncategorized"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          {Number(product.stock || 0)}
                        </td>

                        <td className="px-6 py-4 text-right text-gray-500">
                          {Number(product.reorderLevel || 10)} /{" "}
                          {Number(product.maxStockLevel || 100)}
                        </td>

                        <td className="px-6 py-4 text-gray-600 truncate max-w-[140px]">
                          {product.supplierName || "No supplier"}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {formatDate(product.expiryDate)}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openRestockModal(product)}
                              className="px-3 py-1.5 bg-pink-600 text-white text-xs font-medium rounded-md hover:bg-pink-700 transition-colors shadow-sm"
                            >
                              Restock
                            </button>

                            <button
                              onClick={() => openAdjustModal(product)}
                              className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                            >
                              Adjust
                            </button>

                            <button
                              onClick={() => openHistoryModal(product)}
                              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-200 transition-colors shadow-sm"
                            >
                              History
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-900">
                {activeModal === "restock"
                  ? `Restock: ${selectedProduct.name}`
                  : activeModal === "adjust"
                  ? `Adjust Stock: ${selectedProduct.name}`
                  : `Stock History: ${selectedProduct.name}`}
              </h3>

              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {activeModal === "restock" && (
                <form onSubmit={handleRestockSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity Added *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                        value={restockData.quantity}
                        onChange={(e) =>
                          setRestockData({
                            ...restockData,
                            quantity: e.target.value,
                          })
                        }
                        placeholder="e.g. 50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Purchase Cost
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                        value={restockData.purchaseCost}
                        onChange={(e) =>
                          setRestockData({
                            ...restockData,
                            purchaseCost: e.target.value,
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Supplier
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                        value={restockData.supplierName}
                        onChange={(e) =>
                          setRestockData({
                            ...restockData,
                            supplierName: e.target.value,
                          })
                        }
                        placeholder="Supplier name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Batch Number
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                        value={restockData.batchNumber}
                        onChange={(e) =>
                          setRestockData({
                            ...restockData,
                            batchNumber: e.target.value,
                          })
                        }
                        placeholder="B-2026"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                      value={restockData.expiryDate}
                      onChange={(e) =>
                        setRestockData({
                          ...restockData,
                          expiryDate: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                      value={restockData.note}
                      onChange={(e) =>
                        setRestockData({
                          ...restockData,
                          note: e.target.value,
                        })
                      }
                      placeholder="Optional notes..."
                    ></textarea>
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 shadow-sm transition-colors"
                    >
                      Confirm Restock
                    </button>
                  </div>
                </form>
              )}

              {activeModal === "adjust" && (
                <form onSubmit={handleAdjustSubmit} className="space-y-4">
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-600">
                    Current stock:{" "}
                    <span className="font-bold text-gray-900">
                      {selectedProduct.stock}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity Adjustment *
                    </label>
                    <input
                      type="number"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                      value={adjustData.quantity}
                      onChange={(e) =>
                        setAdjustData({
                          ...adjustData,
                          quantity: e.target.value,
                        })
                      }
                      placeholder="-5 to reduce, 5 to add"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use negative numbers to reduce stock and positive numbers
                      to add stock.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                      value={adjustData.reason}
                      onChange={(e) =>
                        setAdjustData({
                          ...adjustData,
                          reason: e.target.value,
                        })
                      }
                    >
                      <option value="">Select reason...</option>
                      <option value="Damaged Goods">Damaged Goods</option>
                      <option value="Lost/Theft">Lost/Theft</option>
                      <option value="Inventory Correction">
                        Inventory Correction
                      </option>
                      <option value="Returned to Stock">
                        Returned to Stock
                      </option>
                      <option value="Dead Stock">Marked as Dead Stock</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                      value={adjustData.note}
                      onChange={(e) =>
                        setAdjustData({
                          ...adjustData,
                          note: e.target.value,
                        })
                      }
                      placeholder="Details..."
                    ></textarea>
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 shadow-sm transition-colors"
                    >
                      Apply Adjustment
                    </button>
                  </div>
                </form>
              )}

              {activeModal === "history" && (
                <div className="max-h-[400px] overflow-y-auto">
                  {historyLogs.length === 0 ? (
                    <p className="text-center text-gray-500 py-6">
                      No stock history recorded for this product yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {historyLogs.map((log) => (
                        <div
                          key={log._id}
                          className="p-3 border border-gray-100 rounded-lg bg-gray-50"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span
                              className={`text-xs font-bold uppercase tracking-wide ${
                                log.action === "restock"
                                  ? "text-green-600"
                                  : "text-blue-600"
                              }`}
                            >
                              {log.action}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <p className="text-sm text-gray-800">
                            Stock changed by{" "}
                            <strong>
                              {log.quantityChanged > 0 ? "+" : ""}
                              {log.quantityChanged}
                            </strong>
                            <span className="text-gray-500 ml-1">
                              ({log.previousStock} → {log.newStock})
                            </span>
                          </p>

                          {log.reason && (
                            <p className="text-xs text-gray-600 mt-1">
                              <span className="font-medium">Reason:</span>{" "}
                              {log.reason}
                            </p>
                          )}

                          {log.note && (
                            <p className="text-xs text-gray-600 mt-0.5">
                              <span className="font-medium">Note:</span>{" "}
                              {log.note}
                            </p>
                          )}

                          {log.supplierName && (
                            <p className="text-xs text-gray-600 mt-0.5">
                              <span className="font-medium">Supplier:</span>{" "}
                              {log.supplierName}
                            </p>
                          )}

                          {log.batchNumber && (
                            <p className="text-xs text-gray-600 mt-0.5">
                              <span className="font-medium">Batch:</span>{" "}
                              {log.batchNumber}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}