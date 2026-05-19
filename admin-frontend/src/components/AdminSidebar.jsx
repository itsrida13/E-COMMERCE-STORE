import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  BarChart3,
  TrendingUp,
  Tag,
  Users,
  Wand2,
  Lightbulb,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store,
} from "lucide-react";
import "./AdminLayout.css";

export default function AdminSidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get("tab");

  const getAdminInfo = () => {
    try {
      const storedAdmin = localStorage.getItem("admin");
      const parsedAdmin = storedAdmin ? JSON.parse(storedAdmin) : {};

      return {
        name:
          parsedAdmin?.name ||
          parsedAdmin?.username ||
          parsedAdmin?.fullName ||
          "Admin",
        email: parsedAdmin?.email || "System Administrator",
        role: parsedAdmin?.role || "Admin",
      };
    } catch (error) {
      return {
        name: "Admin",
        email: "System Administrator",
        role: "Admin",
      };
    }
  };

  const adminInfo = getAdminInfo();

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard, exact: true },
    { name: "Product Management", path: "/admin?tab=products", icon: Package },
    { name: "Orders", path: "/admin?tab=orders", icon: ShoppingBag },
    { name: "Inventory Management", path: "/admin/inventory", icon: Boxes },
    { name: "Sales Analytics", path: "/admin/analytics", icon: BarChart3 },
    {
      name: "Sales Prediction",
      path: "/admin/sales-prediction",
      icon: TrendingUp,
    },
    {
      name: "Category Analysis",
      path: "/admin/category-analysis",
      icon: Tag,
    },
    { name: "Customers", path: "/admin/customers", icon: Users },
    {
      name: "AI Recommendations",
      path: "/admin/ai-recommendations",
      icon: Wand2,
    },
    { name: "AI Insights", path: "/admin/ai-insights", icon: Lightbulb },
    { name: "Reports", path: "/admin/reports", icon: FileText },
    { name: "Settings", path: "/admin/settings", icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    navigate("/admin/login");
  };

  const isActive = (path, exact) => {
    const [basePath, query] = path.split("?");
    const pathMatches = location.pathname === basePath;

    if (exact && path === "/admin") {
      return pathMatches && !currentTab;
    }

    if (query) {
      const targetTab = new URLSearchParams(query).get("tab");
      return pathMatches && currentTab === targetTab;
    }

    return pathMatches;
  };

  return (
    <>
      <div
        className={`admin-sidebar-overlay ${isOpen ? "mobile-open" : ""}`}
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={`admin-sidebar ${!isOpen ? "collapsed" : ""} ${
          isOpen ? "mobile-open" : ""
        }`}
      >
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            <div className="sidebar-logo">G</div>
            <span className="sidebar-title">Glamour Beauty</span>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="sidebar-toggle-btn"
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        <div className="sidebar-nav">
          <a
            href="https://e-commerce-store-production-74f2.up.railway.app/"
            className="sidebar-link"
            title="Back to Store"
          >
            <Store size={20} className="sidebar-link-icon" />
            <span className="sidebar-link-text">Back to Store</span>
          </a>

          <div className="sidebar-menu-label">Menu</div>

          {menuItems.map((item) => {
            const active = isActive(item.path, item.exact);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`sidebar-link ${active ? "active" : ""}`}
                title={!isOpen ? item.name : undefined}
                onClick={() => {
                  if (window.innerWidth <= 768) setIsOpen(false);
                }}
              >
                <item.icon size={20} className="sidebar-link-icon" />
                <span className="sidebar-link-text">{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="sidebar-profile">
          <div className="profile-info">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                adminInfo.name
              )}`}
              alt={adminInfo.name}
              className="profile-avatar"
            />

            <div className="profile-details">
              <span className="profile-name">{adminInfo.name}</span>
              <span className="profile-role">{adminInfo.email}</span>
            </div>
          </div>

          <button onClick={handleLogout} className="logout-btn" title="Logout">
            <LogOut size={18} className="logout-icon" />
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}