import { useEffect, useState } from "react";
import { getRecommendations } from "../services/api";
import ProductCard from "./ProductCard";

export default function RecommendationEngine({ title, type, productId, category }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const { data } = await getRecommendations({ type, productId, category });
        setProducts(data);
      } catch (err) {
        console.error("Failed to load recommendations", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, [type, productId, category]);

  if (loading || products.length === 0) return null;

  return (
    <div className="recommendations-wrap">
      <h3 className="section-title">{title || "You Might Also Like"}</h3>
      <div className="recommendations-grid">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
      <style>{`
        .recommendations-wrap {
          margin-top: 48px;
          border-top: 1px solid #e5e7eb;
          padding-top: 32px;
        }
        .section-title {
          font-size: 24px;
          color: #1f2937;
          margin-bottom: 24px;
        }
        .recommendations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 24px;
        }
      `}</style>
    </div>
  );
}
