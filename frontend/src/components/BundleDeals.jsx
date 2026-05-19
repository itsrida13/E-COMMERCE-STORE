import { useEffect, useState } from "react";
import { getActiveBundles } from "../services/api";
import { useCart } from "../context/CartContext";
import { getProductImageUrl } from "../utils/image";

export default function BundleDeals() {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addBundleToCart } = useCart();
  const [addedMap, setAddedMap] = useState({});

  useEffect(() => {
    const fetchBundles = async () => {
      try {
        const { data } = await getActiveBundles();
        setBundles(data);
      } catch (err) {
        console.error("Failed to fetch bundles:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBundles();
  }, []);

  const handleAddBundle = (bundle) => {
    addBundleToCart(bundle);
    setAddedMap((prev) => ({ ...prev, [bundle._id]: true }));
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [bundle._id]: false }));
    }, 2000);
  };

  if (loading) return null; // Render silently on home if loading
  if (bundles.length === 0) return null; // Do not render if no active bundles

  return (
    <div className="bundle-deals-section">
      <div className="container">
        <div className="section-header">
          <h2>AI-Curated Exclusive Bundle Deals</h2>
          <p>Get up to 25% off when you buy these matching products together!</p>
        </div>
        <div className="bundles-grid">
          {bundles.map((bundle) => (
            <div key={bundle._id} className="bundle-card">
              <div className="bundle-badge">{bundle.discountPercentage}% OFF</div>
              <h3 className="bundle-title">{bundle.name}</h3>
              {bundle.reason && <p className="bundle-reason">“{bundle.reason}”</p>}
              
              <div className="bundle-products">
                {bundle.products?.map((prod, index) => (
                  <div key={prod._id || index} className="bundle-prod-row">
                    <div className="prod-img">
                      {prod.image ? (
                        <img src={getProductImageUrl(prod.image)} alt={prod.name} />
                      ) : (
                        <div className="placeholder">No Image</div>
                      )}
                    </div>
                    <div className="prod-details">
                      <h4>{prod.name}</h4>
                      <p className="prod-price">${prod.price?.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bundle-footer">
                <div className="bundle-prices">
                  <span className="original-price">${bundle.originalPrice?.toFixed(2)}</span>
                  <span className="bundle-price">${bundle.bundlePrice?.toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => handleAddBundle(bundle)} 
                  className={`btn-add-bundle ${addedMap[bundle._id] ? "added" : ""}`}
                  disabled={addedMap[bundle._id]}
                >
                  {addedMap[bundle._id] ? "Added to Cart!" : "Add Bundle to Cart"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .bundle-deals-section {
          padding: 60px 0;
          background: linear-gradient(180deg, #fff 0%, #fff5f7 100%);
          border-top: 1px solid #fce7f3;
          border-bottom: 1px solid #fce7f3;
          margin: 40px 0;
        }
        .section-header {
          text-align: center;
          margin-bottom: 40px;
        }
        .section-header h2 {
          font-size: 28px;
          color: #be185d;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .section-header p {
          color: #6b7280;
          font-size: 16px;
        }
        .bundles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 32px;
        }
        .bundle-card {
          background: white;
          border: 1px solid #fbcfe8;
          border-radius: 16px;
          padding: 24px;
          position: relative;
          box-shadow: 0 4px 20px rgba(219, 39, 119, 0.05);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          display: flex;
          flex-direction: column;
        }
        .bundle-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(219, 39, 119, 0.1);
        }
        .bundle-badge {
          position: absolute;
          top: -14px;
          right: 20px;
          background: #db2777;
          color: white;
          font-size: 12px;
          font-weight: 800;
          padding: 6px 12px;
          border-radius: 9999px;
          box-shadow: 0 2px 10px rgba(219, 39, 119, 0.4);
        }
        .bundle-title {
          font-size: 20px;
          color: #1f2937;
          font-weight: 700;
          margin-bottom: 6px;
          margin-top: 8px;
        }
        .bundle-reason {
          font-size: 13px;
          color: #9d174d;
          font-style: italic;
          background: #fdf2f8;
          padding: 6px 12px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .bundle-products {
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex-grow: 1;
          margin-bottom: 24px;
        }
        .bundle-prod-row {
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px dashed #f5d0fe;
          padding-bottom: 12px;
        }
        .bundle-prod-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .prod-img {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          overflow: hidden;
          background: #f3f4f6;
          flex-shrink: 0;
        }
        .prod-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .prod-details h4 {
          font-size: 14px;
          color: #374151;
          font-weight: 600;
          margin-bottom: 2px;
          line-height: 1.3;
        }
        .prod-price {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }
        .placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: #9ca3af;
        }
        .bundle-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #f3f4f6;
          padding-top: 18px;
        }
        .bundle-prices {
          display: flex;
          flex-direction: column;
        }
        .original-price {
          font-size: 13px;
          text-decoration: line-through;
          color: #9ca3af;
        }
        .bundle-price {
          font-size: 22px;
          font-weight: 800;
          color: #db2777;
        }
        .btn-add-bundle {
          background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
        }
        .btn-add-bundle:hover {
          opacity: 0.9;
        }
        .btn-add-bundle:active {
          transform: scale(0.97);
        }
        .btn-add-bundle.added {
          background: #10b981;
          cursor: default;
        }
      `}</style>
    </div>
  );
}
