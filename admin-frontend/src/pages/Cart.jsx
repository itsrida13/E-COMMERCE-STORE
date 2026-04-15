import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { getProductImageUrl } from "../utils/image";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();

  if (cartCount === 0) {
    return (
      <div className="page">
        <div className="container">
          <h1 className="page-title">Your Cart</h1>
          <div className="cart-empty card">
            <p>Your cart is empty.</p>
            <Link to="/products" className="btn btn-primary">Browse Products</Link>
          </div>
        </div>
        <style>{`
          .page { padding: 40px 0; }
          .page-title { margin-bottom: 24px; }
          .cart-empty {
            text-align: center;
            padding: 48px;
          }
          .cart-empty p { margin-bottom: 16px; color: #6b7280; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">Your Cart ({cartCount} items)</h1>
        <div className="cart-list">
          {cart.map((item) => (
            <div key={item.product._id} className="cart-item card">
              <div className="cart-item-image">
                {item.product.image ? (
                  <img src={getProductImageUrl(item.product.image)} alt={item.product.name} />
                ) : (
                  <div className="placeholder">No Image</div>
                )}
              </div>
              <div className="cart-item-details">
                <h3>{item.product.name}</h3>
                <p className="brand">{item.product.brand}</p>
                {item.product.shade && <p className="shade">Shade: {item.product.shade}</p>}
                <p className="price">${item.product.price?.toFixed(2)}</p>
              </div>
              <div className="cart-item-qty">
                <button onClick={() => updateQuantity(item.product._id, item.quantity - 1)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product._id, item.quantity + 1)}>+</button>
              </div>
              <p className="cart-item-total">
                ${(item.product.price * item.quantity).toFixed(2)}
              </p>
              <button
                onClick={() => removeFromCart(item.product._id)}
                className="btn btn-danger"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="cart-summary card">
          <h2>Total: ${cartTotal.toFixed(2)}</h2>
          <Link to="/checkout" className="btn btn-primary">Proceed to Checkout</Link>
        </div>
      </div>
      <style>{`
        .page { padding: 40px 0; }
        .page-title { margin-bottom: 24px; }
        .cart-list { margin-bottom: 24px; }
        .cart-item {
          display: grid;
          grid-template-columns: 80px 1fr auto auto auto;
          gap: 24px;
          align-items: center;
          padding: 20px;
          margin-bottom: 16px;
        }
        @media (max-width: 600px) {
          .cart-item {
            grid-template-columns: 60px 1fr;
          }
          .cart-item-qty, .cart-item-total { grid-column: 2; }
        }
        .cart-item-image {
          width: 80px;
          height: 80px;
          background: #f3f4f6;
          border-radius: 6px;
          overflow: hidden;
        }
        .cart-item-image img { width: 100%; height: 100%; object-fit: cover; }
        .placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #9ca3af;
        }
        .cart-item-details h3 { font-size: 16px; margin-bottom: 4px; }
        .brand { color: #6b7280; font-size: 14px; margin-bottom: 4px; }
        .shade { color: #db2777; font-size: 13px; margin-bottom: 4px; font-weight: 500; }
        .price { font-weight: 600; color: #be185d; }
        .cart-item-qty {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cart-item-qty button {
          width: 32px;
          height: 32px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          font-size: 18px;
        }
        .cart-item-total { font-weight: 700; font-size: 18px; }
        .cart-summary {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        .cart-summary .btn { padding: 12px 24px; }
      `}</style>
    </div>
  );
}
