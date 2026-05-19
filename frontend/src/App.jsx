import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Contact from "./pages/Contact";
import FAQs from "./pages/FAQs";
import ShippingPolicy from "./pages/ShippingPolicy";
import ReturnPolicy from "./pages/ReturnPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import Wishlist from "./pages/Wishlist";
import Orders from "./pages/Orders";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import ChatWidget from "./components/ChatWidget";
import { HelmetProvider } from "react-helmet-async";

function AppLayout() {
  const location = useLocation();

  const hideFooter =
    location.pathname.startsWith("/admin") ||
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <>
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/contact" element={<Contact />} />

          <Route path="/faqs" element={<FAQs />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/return-policy" element={<ReturnPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Routes>
      </main>

      {!hideFooter && <Footer />}

      <ChatWidget />
    </>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}