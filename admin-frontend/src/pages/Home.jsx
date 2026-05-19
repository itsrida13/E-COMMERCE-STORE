import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getProducts } from "../services/api";
import ProductCard from "../components/ProductCard";
import { Helmet } from "react-helmet-async";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const successMessage = location.state?.message;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await getProducts();
        setProducts(data);
      } catch (err) {
        setError(err.response?.data || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) return <div className="loading">Loading products...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="page">
      <Helmet>
        <title>Glamour Beauty Store | Your Ultimate Makeup Destination</title>
        <meta name="description" content="Discover our latest makeup and skincare products. Elevate your look with our premium makeup collection." />
        <meta name="keywords" content="makeup, beauty, cosmetics, lipstick, foundation" />
      </Helmet>
      <div className="container">
        {successMessage && <div className="success">{successMessage}</div>}
        <div className="hero-banner">
          <h1 className="page-title">Glamour Beauty Store</h1>
          <p className="page-subtitle">Elevate your look with our premium makeup collection.</p>
        </div>
        <div className="product-grid">
          {products.length === 0 ? (
            <p className="empty">No products yet.</p>
          ) : (
            products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))
          )}
        </div>
      </div>
      <style>{`
        .page {
          padding: 40px 0;
        }
        .hero-banner {
          text-align: center;
          padding: 60px 20px;
          background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
          border-radius: 12px;
          margin-bottom: 40px;
        }
        .page-title {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 12px;
          color: #be185d;
        }
        .page-subtitle {
          font-size: 18px;
          color: #831843;
          margin-bottom: 0;
        }
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 24px;
        }
        .empty {
          grid-column: 1 / -1;
          text-align: center;
          color: #6b7280;
          padding: 40px;
        }
      `}</style>
    </div>
  );
}
