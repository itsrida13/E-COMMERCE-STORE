import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-section footer-about">
          <h2>Glamour Beauty</h2>
          <p>
            Glamour Beauty brings you premium makeup and beauty essentials
            designed to make your everyday look elegant, confident, and effortless.
          </p>

          <div className="footer-socials">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>

            <a
              href="https://wa.me/923001234567"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h3>Quick Links</h3>
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/orders">My Orders</Link>
        </div>

        <div className="footer-section">
          <h3>Customer Service</h3>
          <Link to="/contact">Contact Us</Link>
          <Link to="/faqs">FAQs</Link>
          <Link to="/shipping-policy">Shipping Policy</Link>
          <Link to="/return-policy">Return Policy</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
        </div>

        <div className="footer-section">
          <h3>Contact Info</h3>
          <p>Email: support@glamourbeauty.com</p>
          <p>Phone: +92 315 2106903</p>
          <p>WhatsApp: +92 315 2106903</p>
          <p>Address: Johar Town,Lahore, Pakistan</p>
        </div>

        <div className="footer-section footer-newsletter">
          <h3>Newsletter Signup</h3>
          <p>
            Subscribe to receive new arrivals, beauty tips, and exclusive offers.
          </p>

          <form
            className="newsletter-form"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Thank you for subscribing!");
            }}
          >
            <input type="email" placeholder="Enter your email" required />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Glamour Beauty. All rights reserved.</p>
      </div>

      <style>{`
        .footer {
          background: linear-gradient(135deg, #831843, #be185d);
          color: white;
          margin-top: 70px;
          padding-top: 52px;
        }

        .footer-container {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1.2fr 1.4fr;
          gap: 34px;
        }

        .footer-section h2 {
          font-size: 26px;
          margin-bottom: 14px;
          letter-spacing: 0.04em;
          color: #ffffff;
        }

        .footer-section h3 {
          font-size: 16px;
          margin-bottom: 16px;
          color: #fce7f3;
        }

        .footer-section p {
          color: #fdf2f8;
          font-size: 14px;
          line-height: 1.7;
          margin-bottom: 8px;
        }

        .footer-section a {
          display: block;
          color: #fdf2f8;
          font-size: 14px;
          margin-bottom: 10px;
          text-decoration: none;
          transition: 0.2s ease;
        }

        .footer-section a:hover {
          color: white;
          transform: translateX(4px);
        }

        .footer-socials {
          display: flex;
          gap: 12px;
          margin-top: 18px;
          flex-wrap: wrap;
        }

        .footer-socials a {
          border: 1px solid rgba(255,255,255,0.45);
          padding: 8px 13px;
          border-radius: 999px;
          margin-bottom: 0;
        }

        .footer-socials a:hover {
          background: white;
          color: #be185d;
          transform: none;
        }

        .newsletter-form {
          display: flex;
          gap: 8px;
          margin-top: 14px;
        }

        .newsletter-form input {
          flex: 1;
          padding: 11px 12px;
          border: none;
          border-radius: 8px;
          outline: none;
          font-size: 14px;
        }

        .newsletter-form button {
          background: white;
          color: #be185d;
          border: none;
          padding: 11px 15px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
        }

        .newsletter-form button:hover {
          background: #fce7f3;
        }

        .footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.25);
          margin-top: 42px;
          padding: 18px 20px;
          text-align: center;
        }

        .footer-bottom p {
          font-size: 14px;
          color: #fdf2f8;
          margin: 0;
        }

        @media (max-width: 1100px) {
          .footer-container {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .footer-container {
            grid-template-columns: 1fr;
          }

          .newsletter-form {
            flex-direction: column;
          }
        }
      `}</style>
    </footer>
  );
}