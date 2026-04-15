import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createOrder } from "../services/api";
import { useCart } from "../context/CartContext";

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const state = location.state;

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Card details state (mock)
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  useEffect(() => {
    if (!state) {
      navigate("/checkout");
    }
  }, [state, navigate]);

  if (!state) return null;

  const orderData = { 
    items: state.items, 
    totalPrice: state.finalTotal, 
    shippingAddress: state.shippingAddress 
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate mock card if selected
    if (paymentMethod === "card") {
      if (cardNumber.length < 16) {
         setError("Please enter a valid 16-digit card number.");
         setLoading(false);
         return;
      }
      if (expiry.length < 5) {
         setError("Please enter a valid expiry date (MM/YY).");
         setLoading(false);
         return;
      }
      if (cvc.length < 3) {
         setError("Please enter a valid CVC.");
         setLoading(false);
         return;
      }
    }

    // Simulate payment processing delay (2 seconds)
    setTimeout(async () => {
      try {
        await createOrder(orderData);
        clearCart();
        navigate("/", { state: { message: `Payment successful! Order placed.` } });
      } catch(err) {
        setError(err.response?.data || "Order creation failed. Please contact support.");
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  return (
    <div className="page payment-page">
      <div className="container">
        <h1 className="page-title">Select Payment Method</h1>
        <div className="payment-container">
          <div className="payment-options card">
            <div 
              className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              <div className="option-icon">💳</div>
              <div className="option-details">
                <h3>Credit / Debit Card</h3>
                <p>Pay securely with your bank card</p>
              </div>
              <div className="radio-circle"></div>
            </div>

            <div 
              className={`payment-option ${paymentMethod === 'paypal' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('paypal')}
            >
              <div className="option-icon">🅿️</div>
              <div className="option-details">
                <h3>PayPal</h3>
                <p>Redirect to PayPal to complete</p>
              </div>
              <div className="radio-circle"></div>
            </div>

            <div 
              className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('cod')}
            >
              <div className="option-icon">🚚</div>
              <div className="option-details">
                <h3>Cash on Delivery</h3>
                <p>Pay when you receive the order</p>
              </div>
              <div className="radio-circle"></div>
            </div>
          </div>

          <div className="payment-details card">
            <h2>Payment Details</h2>
            <div className="order-summary-box">
               <span>Total Amount:</span>
               <span className="amount">${state.finalTotal.toFixed(2)}</span>
            </div>

            <form onSubmit={handlePayment} className="mock-payment-form">
              {paymentMethod === 'card' && (
                <div className="card-input-group animate-in">
                  <div className="form-group">
                    <label>Card Number</label>
                    <input 
                      type="text" 
                      placeholder="1234 5678 9101 1121" 
                      maxLength="16"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Expiry (MM/YY)</label>
                      <input 
                        type="text" 
                        placeholder="MM/YY" 
                        maxLength="5"
                        value={expiry}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length >= 3) {
                             val = val.slice(0,2) + '/' + val.slice(2,4);
                          }
                          setExpiry(val);
                        }}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>CVC</label>
                      <input 
                        type="password" 
                        placeholder="123" 
                        maxLength="4"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'paypal' && (
                <div className="paypal-info animate-in">
                  <p>You will be redirected to PayPal's secure portal to complete your purchase after clicking the button below.</p>
                </div>
              )}

              {paymentMethod === 'cod' && (
                <div className="cod-info animate-in">
                  <p>Please have the exact amount ready when our delivery partner arrives at your shipping address.</p>
                </div>
              )}

              {error && <div className="error-message">{error}</div>}

              <button disabled={loading} className="btn btn-primary submit-btn">
                {loading ? "Processing Payment..." : `Pay $${state.finalTotal.toFixed(2)}`}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .payment-page { padding: 40px 0; }
        .payment-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          max-width: 900px;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .payment-container { grid-template-columns: 1fr; }
        }
        .payment-options, .payment-details {
          padding: 24px;
        }
        .payment-option {
          display: flex;
          align-items: center;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .payment-option:hover {
          border-color: #be185d;
          background: #fdf2f8;
        }
        .payment-option.selected {
          border-color: #be185d;
          background: #fdf2f8;
          box-shadow: 0 0 0 1px #be185d;
        }
        .option-icon { font-size: 24px; margin-right: 16px; }
        .option-details { flex: 1; }
        .option-details h3 { font-size: 16px; font-weight: 600; margin-bottom: 4px; color: #111827; }
        .option-details p { font-size: 13px; color: #6b7280; }
        .radio-circle {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #d1d5db;
        }
        .payment-option.selected .radio-circle {
          border-color: #be185d;
          background: #be185d;
          box-shadow: inset 0 0 0 4px #fff;
        }
        
        .payment-details h2 { font-size: 18px; margin-bottom: 20px; }
        .order-summary-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f3f4f6;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-weight: 600;
        }
        .order-summary-box .amount { font-size: 20px; color: #be185d; }
        
        .mock-payment-form .form-group { margin-bottom: 16px; }
        .mock-payment-form label { display: block; margin-bottom: 6px; font-size: 14px; font-weight: 500; }
        .mock-payment-form input {
          width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px;
        }
        .mock-payment-form input:focus { outline: none; border-color: #be185d; }
        .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        
        .submit-btn { width: 100%; padding: 14px; font-size: 16px; margin-top: 16px; justify-content: center; }
        .error-message { color: #dc2626; margin-top: 10px; font-size: 14px; text-align: center; background: #fee2e2; padding: 10px; border-radius: 6px;}
        
        .animate-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        
        .paypal-info, .cod-info { padding: 16px; background: #f9fafb; border-radius: 6px; color: #4b5563; font-size: 14px; line-height: 1.5; }
      `}</style>
    </div>
  );
}
