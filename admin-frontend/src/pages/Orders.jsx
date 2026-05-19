import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getUserOrders } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Helmet } from "react-helmet-async";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await getUserOrders();
        setOrders(data);
      } catch (err) {
        setError(err.response?.data || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="page container">
        <h2>Please log in to view your orders</h2>
        <Link to="/login" className="btn btn-primary mt-4">Login</Link>
      </div>
    );
  }

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="page container">
      <Helmet>
        <title>My Orders | Glamour Beauty Store</title>
      </Helmet>
      <h1>My Orders</h1>
      {orders.length === 0 ? (
        <div className="empty-cart">
          <p>You have no orders yet.</p>
          <Link to="/products" className="btn btn-primary mt-4">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="card order-card">
              <div className="order-header">
                <span>Order #{order._id?.slice(-6)}</span>
                <span>
  {new Date(order.createdAt).toLocaleString("en-PK", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}
</span>
              </div>
              <p className="order-status-badge">Status: {order.orderStatus}</p>
              <ul className="order-items">
                {order.items?.map((item, i) => (
                  <li key={i}>
                    {item.productId?.name} x {item.quantity} - $
                    {(item.productId?.price * item.quantity).toFixed(2)}
                  </li>
                ))}
              </ul>
              <p className="order-total">Total: ${order.totalPrice?.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
      <style>{`
        .mt-4 { margin-top: 16px; }
        .orders-list { max-width: 800px; margin: 0 auto; }
        .order-card { padding: 20px; margin-bottom: 16px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .order-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 600; font-size: 16px; }
        .order-status-badge { color: #db2777; font-weight: 500; font-size: 14px; margin-bottom: 12px; text-transform: capitalize; }
        .order-items { list-style: none; margin-bottom: 12px; padding-left: 0; }
        .order-items li { padding: 4px 0; color: #4b5563; }
        .order-total { font-weight: 700; margin-bottom: 0; font-size: 18px; color: #111827; }
      `}</style>
    </div>
  );
}
