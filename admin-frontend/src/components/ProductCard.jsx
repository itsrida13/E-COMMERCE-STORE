import { Link } from "react-router-dom";
import { getProductImageUrl } from "../utils/image";

export default function ProductCard({ product }) {
  return (
    <Link to={`/products/${product._id}`} className="product-card">
      <div className="product-image">
        {product.image ? (
          <img src={getProductImageUrl(product.image)} alt={product.name} />
        ) : (
          <div className="product-placeholder">No Image</div>
        )}
      </div>
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="product-brand">{product.brand}</p>
        {product.shade && <p className="product-shade">Shade: {product.shade}</p>}
        <p className="product-price">${product.price?.toFixed(2)}</p>
      </div>
      <style>{`
        .product-card {
          display: block;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .product-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transform: translateY(-2px);
        }
        .product-image {
          aspect-ratio: 1;
          background: #f3f4f6;
          overflow: hidden;
        }
        .product-image img {
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
          font-size: 14px;
        }
        .product-info {
          padding: 16px;
        }
        .product-info h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
          color: #1f2937;
        }
        .product-brand {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .product-shade {
          font-size: 13px;
          color: #db2777; /* Rose pink for makeup theme */
          margin-bottom: 8px;
        }
        .product-price {
          font-size: 18px;
          font-weight: 700;
          color: #6366f1;
        }
      `}</style>
    </Link>
  );
}
