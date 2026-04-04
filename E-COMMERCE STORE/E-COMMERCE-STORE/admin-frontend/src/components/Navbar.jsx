import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="container nav-inner">
        <Link to="/admin" className="nav-brand">
          Glamour Beauty Admin
        </Link>
        <div className="nav-links">
          <Link to="/admin" className="nav-admin-btn">Dashboard Home</Link>
          {user ? (
            <>
              <Link to="/wishlist">Wishlist</Link>
              <Link to="/orders">Orders</Link>
              <span className="nav-user">{user.name}</span>
              <button onClick={logout} className="btn btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/admin/register">Admin Root Access</Link>
              <Link to="/admin/login" className="btn btn-primary">
                Admin Login
              </Link>
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
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .nav-links a {
          color: #4b5563;
          font-weight: 500;
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
