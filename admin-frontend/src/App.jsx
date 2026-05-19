import { Navigate, Route, Routes, BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import Admin from "./pages/Admin";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import InventoryManagement from "./pages/InventoryManagement";
import SalesPrediction from "./pages/SalesPrediction";
import AIRecommendations from "./pages/AIRecommendations";
import AIInsights from "./pages/AIInsights";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import CategoryAnalysis from "./pages/CategoryAnalysis";
import Customers from "./pages/Customers";
import AdminLayout from "./components/AdminLayout";
import { HelmetProvider } from "react-helmet-async";

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/admin" replace />} />

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/register" element={<AdminRegister />} />

              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Admin />} />
                <Route path="analytics" element={<AnalyticsDashboard />} />
                <Route path="inventory" element={<InventoryManagement />} />
                <Route path="sales-prediction" element={<SalesPrediction />} />
                <Route path="category-analysis" element={<CategoryAnalysis />} />
                <Route path="customers" element={<Customers />} />
                <Route path="ai-recommendations" element={<AIRecommendations />} />
                <Route path="ai-insights" element={<AIInsights />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}