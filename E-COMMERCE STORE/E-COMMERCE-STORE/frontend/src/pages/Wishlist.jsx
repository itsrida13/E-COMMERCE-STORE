import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getWishlist, removeFromWishlist } from "../services/api";
import { getProductImageUrl } from "../utils/image";
import { useAuth } from "../context/AuthContext";
import { Helmet } from "react-helmet-async";

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const { data } = await getWishlist();
        setWishlist(data);
      } catch (err) {
        setError(err.response?.data || "Failed to load wishlist");
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleRemove = async (productId) => {
    try {
      const { data } = await removeFromWishlist(productId);
      setWishlist(data);
    } catch (err) {
      alert("Failed to remove from wishlist");
    }
  };

  if (!user) {
    return (
      <div className="page container">
        <h2>Please log in to view your wishlist</h2>
        <Link to="/login" className="btn btn-primary mt-4">Login</Link>
      </div>
    );
  }

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="page container">
      <Helmet>
        <title>My Wishlist | Glamour Beauty Store</title>
      </Helmet>
      <h1>My Wishlist</h1>
      {wishlist.length === 0 ? (
        <div className="empty-cart">
          <p>Your wishlist is empty.</p>
          <Link to="/products" className="btn btn-primary mt-4">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="products-grid">
          {wishlist.map((product) => (
            <div key={product._id} className="product-card">
              <Link to={`/products/${product._id}`} className="product-img-wrap">
                {product.image ? (
                  <img src={getProductImageUrl(product.image)} alt={product.name} />
                ) : (
                  <div className="product-placeholder">No Image</div>
                )}
              </Link>
              <div className="product-info">
                <span className="product-category">{product.category}</span>
                <h3>{product.name}</h3>
                <p className="product-price">${product.price?.toFixed(2)}</p>
                <div className="wishlist-actions mt-4">
                  <button
                    onClick={() => handleRemove(product._id)}
                    className="btn btn-secondary btn-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`
        .mt-4 { margin-top: 16px; }
        .wishlist-actions { display: flex; gap: 8px; }
      `}</style>
    </div>
  );
}
