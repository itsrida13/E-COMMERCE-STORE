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

  const formatPakistanTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("en-PK", {
      timeZone: "Asia/Karachi",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

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
        <Link to="/login" className="btn btn-primary mt-4">
          Login
        </Link>
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
          {orders.map((order) => {
            const displayItems =
              order.orderItems && order.orderItems.length > 0
                ? order.orderItems.map((item) => ({
                    name: item.name || item.product?.name || "Product",
                    quantity: item.quantity || 1,
                    price: item.price || item.product?.price || 0,
                  }))
                : (order.items || []).map((item) => ({
                    name: item.productId?.name || "Product",
                    quantity: item.quantity || 1,
                    price: item.productId?.price || 0,
                  }));

            return (
              <div key={order._id} className="card order-card">
                <div className="order-header">
                  <span>Order #{order._id?.slice(-6)}</span>
                  <span>{formatPakistanTime(order.createdAt)}</span>
                </div>

                <div className="order-badges">
                  <span
                    className={`badge status-badge ${(
                      order.status ||
                      order.orderStatus ||
                      "processing"
                    ).toLowerCase()}`}
                  >
                    Status: {order.status || order.orderStatus || "Processing"}
                  </span>

                  <span className="badge method-badge">
                    {(order.paymentMethod || "").toLowerCase() === "card" &&
                      "💳 Card"}
                    {(order.paymentMethod || "").toLowerCase() === "paypal" &&
                      "🅿️ PayPal"}
                    {(order.paymentMethod || "").toLowerCase() === "cod" &&
                      "🚚 Cash on Delivery"}
                    {(order.paymentMethod || "").toLowerCase() ===
                      "cash on delivery" && "🚚 Cash on Delivery"}
                    {!order.paymentMethod && "🚚 Cash on Delivery"}
                  </span>

                  <span
                    className={`badge payment-badge ${(
                      order.paymentStatus || "pending"
                    ).toLowerCase()}`}
                  >
                    Payment: {order.paymentStatus || "Pending"}
                  </span>
                </div>

                <ul className="order-items">
                  {displayItems.map((item, i) => (
                    <li key={i}>
                      {item.name} x {item.quantity} - $
                      {(item.price * item.quantity).toFixed(2)}
                    </li>
                  ))}
                </ul>

                <p className="order-total">
                  Total: ${order.totalPrice?.toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .mt-4 { margin-top: 16px; }
        .orders-list { max-width: 800px; margin: 0 auto; }
        .order-card { padding: 24px; margin-bottom: 20px; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .order-header { display: flex; justify-content: space-between; margin-bottom: 12px; font-weight: 600; font-size: 16px; }
        .order-badges { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .badge { padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; display: inline-flex; align-items: center; }
        .status-badge.processing { background: #fef3c7; color: #d97706; }
        .status-badge.shipped { background: #dbeafe; color: #2563eb; }
        .status-badge.delivered { background: #d1fae5; color: #059669; }
        .status-badge.cancelled { background: #fee2e2; color: #dc2626; }
        .method-badge { background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; }
        .payment-badge.paid { background: #d1fae5; color: #059669; border: 1px solid #10b981; }
        .payment-badge.pending { background: #fef3c7; color: #d97706; border: 1px solid #f59e0b; }
        .order-items { list-style: none; margin-bottom: 16px; padding-left: 0; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; padding: 12px 0; }
        .order-items li { padding: 4px 0; color: #4b5563; font-size: 14px; }
        .order-total { font-weight: 700; margin-bottom: 0; font-size: 18px; color: #111827; display: flex; justify-content: flex-end; }
      `}</style>
    </div>
  );
}