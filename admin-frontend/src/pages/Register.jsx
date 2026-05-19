import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
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
      const { data } = await register({ name: name.trim(), email: email.trim(), password });
      loginUser(data.user, data.token);
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err.response?.data;
      if (typeof msg === "string") setError(msg);
      else if (msg?.error) setError(msg.error);
     else if (!err.response) setError("Cannot reach server. Please check your internet connection or try again later.");
      else setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1>Register</h1>
        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
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
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
      <style>{`
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
        .auth-footer a { color: #6366f1; font-weight: 500; }
      `}</style>
    </div>
  );
}
