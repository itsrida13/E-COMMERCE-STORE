import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  const handleAdminClick = (e) => {
    e.preventDefault();

    const adminToken =
      localStorage.getItem("adminToken") ||
      localStorage.getItem("token");

    const adminData = localStorage.getItem("admin");

    if (adminToken || adminData) {
      window.location.href = "https://glamourbeauty-admin-production.up.railway.app/admin";
    } else {
      window.location.href = "https://glamourbeauty-admin-production.up.railway.app/admin/login";
    }
  };

  return (
    <nav className="navbar">
      <div className="container nav-inner">
        <a href="https://glamourbeauty-admin-production.up.railway.app/admin" onClick={handleAdminClick} className="nav-brand">
          Glamour Beauty Admin
        </a>

        <div className="nav-links">
          <a href="https://glamourbeauty-admin-production.up.railway.app/admin" onClick={handleAdminClick} className="nav-admin-btn">
            Dashboard
          </a>

          

          {user ? (
            <>
              <span className="nav-user">{user.name}</span>
              <button onClick={logout} className="btn btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
              <a href="https://glamourbeauty-admin-production.up.railway.app/admin/register">Admin Root Access</a>
              <a href="https://glamourbeauty-admin-production.up.railway.app/admin/login" className="btn btn-primary">
                Admin Login
              </a>
            </>
          )}
        </div>
      </div>

      <style>{`
        .navbar {
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .nav-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
        }
        .nav-brand {
          font-weight: 700;
          font-size: 18px;
          color: #be185d;
          text-decoration: none;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .nav-links a {
          color: #4b5563;
          font-weight: 500;
          text-decoration: none;
        }
        .nav-links a:hover {
          color: #be185d;
        }
        .nav-admin-btn {
          background-color: #fbcfe8;
          color: #831843 !important;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600 !important;
        }
        .nav-admin-btn:hover {
          background-color: #f9a8d4;
        }
        .nav-user {
          color: #6b7280;
          font-size: 14px;
        }
        .cart-badge {
          background: #be185d;
          color: white;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 10px;
          margin-left: 4px;
        }
      `}</style>
    </nav>
  );
}