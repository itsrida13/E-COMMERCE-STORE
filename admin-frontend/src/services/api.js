import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://observant-truth-production-f7df.up.railway.app";

const API_URL = `${API_BASE}/api`;

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (data) => api.post("/auth/register", data);
export const adminRegister = (data) => api.post("/auth/admin/register", data);
export const login = (data) => api.post("/auth/login", data);
export const getUsers = () => api.get("/auth/users");

// Products
export const getProducts = () => api.get("/products");
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post("/products", data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const generateSEO = (data) => api.post("/products/generate-seo", data);

// Orders
export const createOrder = (data) => api.post("/orders", data);
export const getOrders = () => api.get("/orders");
export const getUserOrders = () => api.get("/orders/user");
export const updateOrderStatus = (id, orderStatus) =>
  api.put(`/orders/${id}/status`, { orderStatus });
export const updateOrder = (id, data) =>
  api.put(`/orders/${id}`, data);

export const getAnalyticsDashboard = (days = 90) =>
  api.get("/analytics/dashboard", { params: { days } });
export const getSalesPredictions = () => api.get("/analytics/sales-predictions");
export const getRecommendations = () => api.get("/analytics/recommendations");
export const getAiInsights = () => api.get("/analytics/ai-insights");
export const applyProductDiscount = (id, percentage) => api.put(`/products/${id}/apply-discount`, { percentage });
export const markProductClearance = (id) => api.put(`/products/${id}/mark-clearance`);
export const removeProductDiscount = (id) => api.put(`/products/${id}/remove-discount`);

// Bundles
export const getBundles = () => api.get("/bundles");
export const getActiveBundles = () => api.get("/bundles/active");
export const createBundle = (data) => api.post("/bundles", data);
export const deleteBundle = (id) => api.delete(`/bundles/${id}`);

// Wishlist
export const getWishlist = () => api.get("/wishlist");
export const addToWishlist = (productId) => api.post(`/wishlist/${productId}`);
export const removeFromWishlist = (productId) => api.delete(`/wishlist/${productId}`);

// Inventory
export const getInventory = () => api.get("/inventory");
export const getLowStock = () => api.get("/inventory/low-stock");
export const getOutOfStock = () => api.get("/inventory/out-of-stock");
export const getStockAlerts = () => api.get("/inventory/stock-alerts");
export const adjustStock = (productId, data) => api.put(`/inventory/${productId}/adjust-stock`, data);
export const restockProduct = (productId, data) => api.put(`/inventory/${productId}/restock`, data);
export const getStockHistory = (productId) => api.get(`/inventory/${productId}/history`);

// Settings
export const getSettings = () => api.get("/settings");
export const updateSettings = (data) => api.put("/settings", data);

export { API_BASE };
export default api;