import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { sendChatbotMessage } from "../services/api";
import { useCart } from "../context/CartContext";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi there! I'm your Glamour Beauty assistant. You can ask me about products, cart help, order tracking, all your orders, return policy, shipping policy, privacy policy, contact details, FAQs, discounts, or checkout help.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { cart, addToCart } = useCart();

  useEffect(() => {
    if (cart && cart.length > 0 && messages.length === 1) {
      setMessages([
        {
          sender: "bot",
          text: `Hi there! I'm your Glamour Beauty assistant. I noticed you have ${cart.length} item(s) in your cart. You can ask me about checkout, products, return policy, shipping, privacy, contact details, FAQs, discounts, or your orders.`,
        },
      ]);
    }
  }, [cart]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await sendChatbotMessage(userText);

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.reply,
          intent: data.intent,
          products: data.products,
          orderData: data.data,
          orders: data.orders,
          action: data.action,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Oops! I encountered an error connecting to my brain. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getProductPrice = (product) => {
    if (product?.isDiscounted && product?.discountedPrice > 0) {
      return Number(product.discountedPrice || 0).toFixed(2);
    }

    return Number(product?.price || 0).toFixed(2);
  };

  const getProductImage = (image) => {
    if (!image) return "";
    return image.startsWith("http") ? image : `http://localhost:5000${image}`;
  };

  return (
    <div className={`chat-widget-container ${isOpen ? "open" : ""}`}>
      {!isOpen && (
        <button className="chat-fab" onClick={() => setIsOpen(true)}>
          <span className="sr-only">Open Chat</span>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="chat-window frosted-glass">
          <div className="chat-header">
            <h3>Glamour AI Assistant</h3>
            <button className="chat-close" onClick={() => setIsOpen(false)}>
              ×
            </button>
          </div>

          <div className="chat-body">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.sender}`}>
                <div className="chat-bubble">
                  <p>{msg.text}</p>

                  {/* Product Cards */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="chat-products">
                      {msg.products.map((p) => (
                        <Link
                          to={`/products/${p._id}`}
                          key={p._id}
                          className="chat-product-card"
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="cp-img">
                            {p.image ? (
                              <img src={getProductImage(p.image)} alt={p.name} />
                            ) : (
                              <div className="no-img" />
                            )}
                          </div>

                          <div className="cp-info">
                            <h4>{p.name}</h4>

                            {p.isDiscounted && p.discountedPrice > 0 ? (
                              <span>
                                <del>${Number(p.price || 0).toFixed(2)}</del>{" "}
                                ${getProductPrice(p)}
                              </span>
                            ) : (
                              <span>${getProductPrice(p)}</span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Latest Order Card */}
                  {msg.orderData && (
                    <div className="chat-order-card">
                      <p>
                        <strong>Order ID:</strong> #
                        {msg.orderData._id?.slice(-6)}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <span className="status-badge">
                          {msg.orderData.status ||
                            msg.orderData.orderStatus ||
                            "Processing"}
                        </span>
                      </p>
                      <p>
                        <strong>Payment:</strong>{" "}
                        {msg.orderData.paymentStatus || "Pending"}
                      </p>
                      <p>
                        <strong>Total:</strong> $
                        {Number(msg.orderData.totalPrice || 0).toFixed(2)}
                      </p>
                    </div>
                  )}

                  {/* Multiple Orders List */}
                  {msg.orders && msg.orders.length > 0 && (
                    <div className="chat-orders-list">
                      {msg.orders.map((order) => (
                        <div key={order._id} className="chat-order-card">
                          <p>
                            <strong>Order ID:</strong> #{order._id?.slice(-6)}
                          </p>
                          <p>
                            <strong>Status:</strong>{" "}
                            <span className="status-badge">
                              {order.status || order.orderStatus || "Processing"}
                            </span>
                          </p>
                          <p>
                            <strong>Payment:</strong>{" "}
                            {order.paymentStatus || "Pending"}
                          </p>
                          <p>
                            <strong>Total:</strong> $
                            {Number(order.totalPrice || 0).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add to Cart Action */}
                  {msg.action && msg.action.type === "ADD_TO_CART" && (
                    <div className="chat-action">
                      <div className="action-product-preview">
                        <img
                          src={getProductImage(msg.action.payload.image)}
                          alt={msg.action.payload.name}
                        />
                        <span>{msg.action.payload.name}</span>
                      </div>

                      <button
                        className="btn-chat-action"
                        onClick={() => {
                          addToCart(msg.action.payload, 1);
                          setMessages((prev) => [
                            ...prev,
                            {
                              sender: "bot",
                              text: `I've added ${msg.action.payload.name} to your cart!`,
                            },
                          ]);
                        }}
                      >
                        Add to Cart
                      </button>
                    </div>
                  )}

                  {/* Coupon Action */}
                  {msg.action && msg.action.type === "APPLY_COUPON" && (
                    <div className="chat-action">
                      <span className="coupon-code">{msg.action.payload}</span>

                      <button
                        className="btn-chat-action outline"
                        onClick={() => {
                          sessionStorage.setItem(
                            "savedCoupon",
                            msg.action.payload
                          );
                          setMessages((prev) => [
                            ...prev,
                            {
                              sender: "bot",
                              text: `Coupon ${msg.action.payload} applied! It will be used at checkout.`,
                            },
                          ]);
                        }}
                      >
                        Apply Coupon
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-message bot">
                <div className="chat-bubble typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={!input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}

      <style>{`
        .chat-widget-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 1000;
        }
        .chat-fab {
          background: linear-gradient(135deg, #db2777 0%, #be185d 100%);
          color: white;
          border: none;
          border-radius: 50%;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(190, 24, 93, 0.4);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .chat-fab:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(190, 24, 93, 0.5);
        }
        .chat-window {
          width: 350px;
          height: 500px;
          max-height: calc(100vh - 40px);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: all 0.3s ease;
          transform-origin: bottom right;
          animation: slideUp 0.3s ease forwards;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chat-header {
          background: linear-gradient(135deg, #db2777 0%, #be185d 100%);
          color: white;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .chat-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        .chat-close {
          background: transparent;
          border: none;
          color: white;
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
          opacity: 0.8;
        }
        .chat-close:hover { opacity: 1; }
        .chat-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .chat-message {
          display: flex;
          width: 100%;
        }
        .chat-message.user { justify-content: flex-end; }
        .chat-bubble {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.4;
        }
        .chat-message.user .chat-bubble {
          background: #fbcfe8;
          color: #831843;
          border-bottom-right-radius: 4px;
        }
        .chat-message.bot .chat-bubble {
          background: #f3f4f6;
          color: #1f2937;
          border-bottom-left-radius: 4px;
        }
        .chat-bubble p { margin: 0; }

        .chat-products {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .chat-product-card {
          display: flex;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          transition: border-color 0.2s;
        }
        .chat-product-card:hover { border-color: #f472b6; }
        .cp-img { width: 50px; height: 50px; background: #e5e7eb; }
        .cp-img img { width: 100%; height: 100%; object-fit: cover; }
        .cp-info { padding: 6px 10px; display: flex; flex-direction: column; justify-content: center; }
        .cp-info h4 { margin: 0; font-size: 13px; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
        .cp-info span { font-size: 12px; color: #be185d; font-weight: 600; margin-top: 2px; }
        .cp-info del { color: #9ca3af; margin-right: 4px; }

        .chat-orders-list {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .chat-order-card {
          margin-top: 10px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          font-size: 13px;
        }
        .chat-order-card p { margin-bottom: 4px !important; }
        .status-badge {
          background: #fbcfe8;
          color: #9d174d;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 600;
        }

        .chat-action {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border: 1px solid #fbcfe8;
          border-radius: 8px;
          padding: 12px;
          background: white;
        }
        .action-product-preview {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 500;
          font-size: 13px;
        }
        .action-product-preview img {
          width: 40px;
          height: 40px;
          border-radius: 4px;
          object-fit: cover;
        }
        .coupon-code {
          font-family: monospace;
          font-size: 16px;
          font-weight: bold;
          padding: 6px;
          background: #fdf2f8;
          color: #db2777;
          text-align: center;
          border-radius: 4px;
          border: 1px dashed #f472b6;
        }
        .btn-chat-action {
          background: #be185d;
          color: white;
          padding: 8px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          text-align: center;
          font-size: 13px;
          transition: background 0.2s;
        }
        .btn-chat-action:hover { background: #9d174d; }
        .btn-chat-action.outline {
          background: white;
          color: #be185d;
          border: 1px solid #be185d;
        }
        .btn-chat-action.outline:hover { background: #fdf2f8; }

        .chat-input-area {
          padding: 12px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 8px;
          background: white;
        }
        .chat-input-area input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid #d1d5db;
          border-radius: 20px;
          outline: none;
          transition: border-color 0.2s;
        }
        .chat-input-area input:focus { border-color: #f472b6; }
        .chat-input-area button {
          background: #be185d;
          color: white;
          border: none;
          padding: 0 16px;
          border-radius: 20px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .chat-input-area button:hover:not(:disabled) { background: #9d174d; }
        .chat-input-area button:disabled { opacity: 0.5; cursor: not-allowed; }

        .typing {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
          align-items: center;
        }
        .dot {
          width: 6px;
          height: 6px;
          background: #9ca3af;
          border-radius: 50%;
          animation: blink 1.4s infinite both;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}