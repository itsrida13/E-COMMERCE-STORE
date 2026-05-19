import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

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

// Products
export const getProducts = (params) => api.get("/products", { params });

export const searchAutocomplete = (q) =>
  api.get("/products/autocomplete", {
    params: { q },
  });

export const getProduct = (id) => api.get(`/products/${id}`);

export const createProduct = (data) => api.post("/products", data);

export const updateProduct = (id, data) => api.put(`/products/${id}`, data);

export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Orders
export const createOrder = (data) => api.post("/orders", data);
export const getOrders = () => api.get("/orders");
export const getUserOrders = () => api.get("/orders/my-orders");

export const updateOrderStatus = (id, orderStatus) =>
  api.put(`/orders/${id}/status`, { orderStatus });

// Wishlist
export const getWishlist = () => api.get("/wishlist");

export const addToWishlist = (productId) =>
  api.post(`/wishlist/${productId}`, {});

export const removeFromWishlist = (productId) =>
  api.delete(`/wishlist/${productId}`);

// Payment
export const createPaymentIntent = (amount) =>
  api.post("/payment/create-payment-intent", { amount });

// Recommendations
export const getRecommendations = (params) =>
  api.get("/products/recommendations", { params });

// Chatbot
export const sendChatbotMessage = (message) => api.post("/chat", { message });

// Analytics
export const getAnalyticsDashboard = (days = 90) =>
  api.get("/analytics/dashboard", { params: { days } });

// Bundles
export const getActiveBundles = () => api.get("/bundles/active");
export const getBundles = () => api.get("/bundles");
export const createBundle = (data) => api.post("/bundles", data);
export const deleteBundle = (id) => api.delete(`/bundles/${id}`);

export { API_BASE };
export default api;