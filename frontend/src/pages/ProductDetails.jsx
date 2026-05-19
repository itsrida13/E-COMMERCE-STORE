import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProduct, addToWishlist } from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { getProductImageUrl } from "../utils/image";
import { Helmet } from "react-helmet-async";
import RecommendationEngine from "../components/RecommendationEngine";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [wishlistAdded, setWishlistAdded] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await getProduct(id);
        setProduct(data);
      } catch (err) {
        setError(err.response?.data || "Product not found");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      alert("Please log in to add to wishlist.");
      return;
    }
    try {
      await addToWishlist(product._id);
      setWishlistAdded(true);
      setTimeout(() => setWishlistAdded(false), 2000);
    } catch {
      alert("Failed to add to wishlist");
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!product) return null;

  return (
    <div className="page">
      <Helmet>
        <title>{product.metaTitle || `${product.name} | Glamour Beauty Store`}</title>
        <meta name="description" content={product.metaDescription || product.description || `Buy ${product.name} at Glamour Beauty Store.`} />
        {product.metaKeywords && <meta name="keywords" content={product.metaKeywords} />}
        {product.slug && <link rel="canonical" href={`${window.location.origin}/products/${product.slug}`} />}
      </Helmet>
      <div className="container">
        <div className="product-detail">
          <div className="product-detail-image">
            {product.image ? (
              <img src={getProductImageUrl(product.image)} alt={product.imageAltText || product.name} />
            ) : (
              <div className="product-placeholder">No Image</div>
            )}
          </div>
          <div className="product-detail-info">
            <p className="product-category">{product.category}</p>
            <h1>{product.name}</h1>
            <p className="product-brand">{product.brand}</p>
            {product.shade && <p className="product-shade">Shade: {product.shade}</p>}
            {product.isDiscounted && product.discountedPrice > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
                <span className="product-price" style={{ color: "#db2777", fontSize: "24px", fontWeight: "700", marginBottom: 0 }}>${product.discountedPrice.toFixed(2)}</span>
                <span style={{ fontSize: "18px", textDecoration: "line-through", color: "#9ca3af", fontWeight: "normal" }}>${product.price.toFixed(2)}</span>
                <span style={{ background: "#fff5f7", color: "#db2777", fontSize: "13px", fontWeight: "bold", padding: "4px 8px", borderRadius: "4px", border: "1px solid #ffe4e6" }}>{product.discountPercentage}% OFF</span>
              </div>
            ) : (
              <p className="product-price">${product.price?.toFixed(2)}</p>
            )}
            {product.description && (
              <p className="product-desc">{product.description}</p>
            )}
            <div className="quantity-row">
              <label>Quantity:</label>
              <input
                type="number"
                min="1"
                max={product.stock || 99}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="action-buttons">
              <button
                onClick={handleAddToCart}
                className="btn btn-primary"
                disabled={added}
              >
                {added ? "Added to Cart!" : "Add to Cart"}
              </button>
              <button
                onClick={handleAddToWishlist}
                className="btn btn-secondary"
                disabled={wishlistAdded}
              >
                {wishlistAdded ? "Added to Wishlist!" : "Add to Wishlist"}
              </button>
            </div>
          </div>
        </div>
        {/* RECOMMENDATION ENGINE: Customers Also Bought */}
        <RecommendationEngine
          title="Customers Also Bought"
          type="also_bought"
          productId={product._id}
          category={product.category}
        />
      </div>
      <style>{`
        .page { padding: 40px 0; }
        .product-detail {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .product-detail { grid-template-columns: 1fr; }
        }
        .product-detail-image {
          aspect-ratio: 1;
          background: #f3f4f6;
          border-radius: 8px;
          overflow: hidden;
        }
        .product-detail-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .product-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
        }
        .product-detail-info h1 { font-size: 28px; margin-bottom: 8px; text-transform: capitalize; }
        .product-category { color: #f472b6; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
        .product-brand { color: #6b7280; margin-bottom: 8px; }
        .product-shade { color: #db2777; font-weight: 500; margin-bottom: 12px; }
        .product-price { font-size: 24px; font-weight: 700; color: #be185d; margin-bottom: 16px; }
        .product-desc { color: #4b5563; margin-bottom: 24px; line-height: 1.6; }
        .quantity-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .quantity-row input {
          width: 80px;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
        }
        .action-buttons {
          display: flex;
          gap: 16px;
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
}
