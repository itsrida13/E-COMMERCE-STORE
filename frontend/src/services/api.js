import axios from "axios";

const API_BASE = "http://localhost:5000";
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
export const getProducts = (params) => axios.get("http://localhost:5000/api/products", { params });
export const searchAutocomplete = (q) => axios.get(`http://localhost:5000/api/products/autocomplete`, { params: { q } });
export const getProduct = (id) => axios.get(`http://localhost:5000/api/products/${id}`);
export const createProduct = (data) => axios.post("http://localhost:5000/api/products", data, {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});
export const updateProduct = (id, data) => axios.put(`http://localhost:5000/api/products/${id}`, data, {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});
export const deleteProduct = (id) => axios.delete(`http://localhost:5000/api/products/${id}`, {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

// Orders
export const createOrder = (data) => api.post("/orders", data);
export const getOrders = () => api.get("/orders");
export const getUserOrders = () => api.get("/orders/user");
export const updateOrderStatus = (id, orderStatus) =>
  api.put(`/orders/${id}/status`, { orderStatus });

// Wishlist
export const getWishlist = () => api.get("/wishlist");
export const addToWishlist = (productId) => api.post(`/wishlist/${productId}`);
export const removeFromWishlist = (productId) => api.delete(`/wishlist/${productId}`);

// Payment
export const createPaymentIntent = (amount) => api.post("/payment/create-payment-intent", { amount });

// Recommendations (Public)
export const getRecommendations = (params) => axios.get("http://localhost:5000/api/products/recommendations", { params });

// Chatbot (Auth optional)
export const sendChatbotMessage = (message) => api.post("/chat", { message });

export { API_BASE };
export default api;
