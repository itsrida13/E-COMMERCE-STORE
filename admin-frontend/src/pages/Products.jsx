import { useEffect, useState } from "react";
import { getProducts } from "../services/api";
import ProductCard from "../components/ProductCard";
import { Helmet } from "react-helmet-async";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        <title>All Products | Glamour Beauty Store</title>
        <meta name="description" content="Browse our complete catalog of premium makeup and beauty products." />
      </Helmet>
      <div className="container">
        <h1 className="page-title">All Products</h1>
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
        .page { padding: 40px 0; }
        .page-title { font-size: 28px; margin-bottom: 32px; color: #1f2937; }
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 24px;
        }
        .empty { grid-column: 1 / -1; text-align: center; color: #6b7280; padding: 40px; }
      `}</style>
    </div>
  );
}
