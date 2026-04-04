import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createOrder } from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
  country: "",
};

function validateForm(form) {
  const errors = {};

  const fullName = form.fullName?.trim();
  if (!fullName) errors.fullName = "Full name is required";
  else if (fullName.length < 2) errors.fullName = "Name must be at least 2 characters";
  else if (fullName.length > 100) errors.fullName = "Name is too long";

  const email = form.email?.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) errors.email = "Email is required";
  else if (!emailRegex.test(email)) errors.email = "Enter a valid email address";

  const phone = form.phone?.replace(/\D/g, "");
  if (!form.phone?.trim()) errors.phone = "Phone number is required";
  else if (phone.length < 10) errors.phone = "Phone must have at least 10 digits";

  const address = form.address?.trim();
  if (!address) errors.address = "Address is required";
  else if (address.length < 5) errors.address = "Enter a valid address";
  else if (address.length > 200) errors.address = "Address is too long";

  const city = form.city?.trim();
  if (!city) errors.city = "City is required";
  else if (city.length < 2) errors.city = "Enter a valid city";

  const postalCode = form.postalCode?.trim();
  if (!postalCode) errors.postalCode = "Postal / ZIP code is required";
  else if (postalCode.length < 3 || postalCode.length > 12) {
    errors.postalCode = "Enter a valid postal code";
  }

  const country = form.country?.trim();
  if (!country) errors.country = "Country is required";
  else if (country.length < 2) errors.country = "Enter a valid country";

  return errors;
}

const FormField = ({ name, label, type = "text", placeholder, required = true, form, handleChange, handleBlur, fieldErrors, touched }) => (
  <div className="form-group">
    <label htmlFor={name}>
      {label} {required && <span className="required">*</span>}
    </label>
    <input
      id={name}
      name={name}
      type={type}
      value={form[name] || ""}
      onChange={handleChange}
      onBlur={() => handleBlur(name)}
      placeholder={placeholder}
      required={required}
      className={fieldErrors[name] && touched[name] ? "input-error" : ""}
      autoComplete={name === "email" ? "email" : name === "fullName" ? "name" : "address-line1"}
    />
    {fieldErrors[name] && touched[name] && (
      <span className="field-error">{fieldErrors[name]}</span>
    )}
  </div>
);

function CheckoutContent() {
  const { cart, cartTotal, clearCart, cartCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => ({
    ...initialForm,
    fullName: user?.name || "",
    email: user?.email || "",
  }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errors = validateForm({ ...form, [name]: form[name] });
    if (errors[name]) setFieldErrors((prev) => ({ ...prev, [name]: errors[name] }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError("");
    const errors = validateForm(form);
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      setFieldErrors(errors);
      setTouched(Object.fromEntries(Object.keys(form).map((k) => [k, true])));
      setError("Please fix the errors below.");
      return;
    }

    setLoading(true);
    try {
      const items = cart.map((item) => ({
        productId: item.product._id,
        quantity: item.quantity,
      }));
      const shippingAddress = {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country.trim(),
      };
      await createOrder({ items, totalPrice: cartTotal, shippingAddress });
      clearCart();
      navigate("/", { state: { message: "Order placed successfully!" } });
    } catch (err) {
      setError(err.response?.data || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (cartCount === 0) {
    return (
      <div className="page">
        <div className="container">
          <h1 className="page-title">Checkout</h1>
          <div className="card checkout-empty">
            <p>Your cart is empty.</p>
            <Link to="/cart" className="btn btn-primary">View Cart</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page checkout-page">
      <div className="container">
        <h1 className="page-title">Checkout</h1>

        <form onSubmit={handlePlaceOrder} className="checkout-form">
          {error && <div className="error">{error}</div>}

          <section className="checkout-section card">
            <h2>Shipping Details</h2>
            <div className="form-grid">
              <FormField name="fullName" label="Full Name" placeholder="John Doe" form={form} handleChange={handleChange} handleBlur={handleBlur} fieldErrors={fieldErrors} touched={touched} />
              <FormField name="email" label="Email" type="email" placeholder="john@example.com" form={form} handleChange={handleChange} handleBlur={handleBlur} fieldErrors={fieldErrors} touched={touched} />
              <FormField name="phone" label="Phone" type="tel" placeholder="+1 234 567 8900" form={form} handleChange={handleChange} handleBlur={handleBlur} fieldErrors={fieldErrors} touched={touched} />
              <FormField name="address" label="Address" placeholder="123 Main St, Apt 4" form={form} handleChange={handleChange} handleBlur={handleBlur} fieldErrors={fieldErrors} touched={touched} />
              <div className="form-row-2">
                <FormField name="city" label="City" placeholder="New York" form={form} handleChange={handleChange} handleBlur={handleBlur} fieldErrors={fieldErrors} touched={touched} />
                <FormField name="postalCode" label="Postal / ZIP Code" placeholder="10001" form={form} handleChange={handleChange} handleBlur={handleBlur} fieldErrors={fieldErrors} touched={touched} />
              </div>
              <FormField name="country" label="Country" placeholder="United States" form={form} handleChange={handleChange} handleBlur={handleBlur} fieldErrors={fieldErrors} touched={touched} />
            </div>
          </section>

          <section className="checkout-section card">
            <h2>Order Summary</h2>
            <ul className="order-items">
              {cart.map((item) => (
                <li key={item.product._id}>
                  <span>{item.product.name} x {item.quantity}</span>
                  <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <p className="order-total">Total: ${cartTotal.toFixed(2)}</p>
          </section>

          <p className="checkout-note">
            Payment will be collected at delivery. By placing your order you agree to our terms.
          </p>

          <button
            type="submit"
            className="btn btn-primary btn-submit"
            disabled={loading}
          >
            {loading ? "Placing Order..." : "Place Order"}
          </button>
        </form>
      </div>
      <style>{`
        .checkout-page { padding: 40px 0; }
        .checkout-empty {
          text-align: center;
          padding: 48px;
        }
        .checkout-empty p { margin-bottom: 16px; color: #6b7280; }
        .checkout-form { max-width: 600px; }
        .checkout-section {
          padding: 24px;
          margin-bottom: 24px;
        }
        .checkout-section h2 {
          font-size: 18px;
          margin-bottom: 20px;
          color: #1f2937;
        }
        .form-grid { display: flex; flex-direction: column; gap: 0; }
        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 500px) {
          .form-row-2 { grid-template-columns: 1fr; }
        }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px; }
        .form-group .required { color: #dc2626; }
        .form-group input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }
        .form-group input:focus {
          outline: none;
          border-color: #be185d;
          box-shadow: 0 0 0 2px rgba(190, 24, 93, 0.2);
        }
        .form-group input.input-error {
          border-color: #dc2626;
        }
        .form-group input.input-error:focus {
          box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
        }
        .field-error {
          display: block;
          color: #dc2626;
          font-size: 12px;
          margin-top: 4px;
        }
        .order-items {
          list-style: none;
          margin-bottom: 16px;
        }
        .order-items li {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .order-total {
          font-size: 20px;
          font-weight: 700;
          color: #be185d;
        }
        .checkout-note {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 24px;
        }
        .btn-submit {
          padding: 14px 32px;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}

export default function Checkout() {
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
  );
}
