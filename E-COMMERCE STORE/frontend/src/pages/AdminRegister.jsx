import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminRegister } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function AdminRegister() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await adminRegister({ name: name.trim(), email: email.trim(), password });
      loginUser(data.user, data.token);
      navigate("/admin", { replace: true });
    } catch (err) {
      const msg = err.response?.data;
      if (typeof msg === "string") setError(msg);
      else if (msg?.error) setError(msg.error);
      else if (!err.response) setError("Cannot reach server. Is the backend running?");
      else setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page admin-auth-bg">
      <div className="auth-card card admin-auth-card">
        <h1 className="admin-title">Create Admin Account</h1>
        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary admin-btn" disabled={loading}>
            {loading ? "Registering..." : "Provision Admin Portal"}
          </button>
        </form>
        <p className="auth-footer">
          Already have an administrator account? <Link to="/admin/login">Login Here</Link>
        </p>
      </div>
      <style>{`
        .admin-auth-bg {
          background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
        }
        .admin-auth-card {
           box-shadow: 0 10px 25px rgba(190, 24, 93, 0.1);
           border-top: 4px solid #be185d;
        }
        .admin-title {
           color: #831843;
           font-size: 22px !important;
           text-align: center;
        }
        .admin-btn {
           background-color: #be185d;
        }
        .admin-btn:hover {
           background-color: #9d174d;
        }
        .auth-page {
          min-height: calc(100vh - 200px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }
        .auth-card {
          width: 100%;
          max-width: 400px;
          padding: 32px;
        }
        .auth-card h1 { margin-bottom: 24px; font-size: 24px; }
        .auth-card .btn { width: 100%; margin-top: 8px; }
        .auth-footer { margin-top: 20px; text-align: center; color: #6b7280; }
        .auth-footer a { color: #be185d; font-weight: 600; }
      `}</style>
    </div>
  );
}
