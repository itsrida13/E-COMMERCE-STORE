import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts } from "../services/api";
import ProductCard from "../components/ProductCard";
import { Helmet } from "react-helmet-async";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    brand: searchParams.get("brand") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    rating: searchParams.get("rating") || "",
  });

  const searchQuery = searchParams.get("search") || "";

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = { ...filters };
        if (searchQuery) params.search = searchQuery;
        
        // Remove empty filters
        Object.keys(params).forEach(key => {
          if (!params[key]) delete params[key];
        });

        const { data } = await getProducts(params);
        setProducts(data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchQuery, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    // Optionally push to URL
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    Object.keys(filters).forEach(k => {
      if (filters[k]) params.set(k, filters[k]);
    });
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({ category: "", brand: "", minPrice: "", maxPrice: "", rating: "" });
    if (searchQuery) {
      setSearchParams({ search: searchQuery });
    } else {
      setSearchParams({});
    }
  };

  if (error) return <div className="error">{error}</div>;

  return (
    <div className="page products-page">
      <Helmet>
        <title>All Products | Glamour Beauty Store</title>
        <meta name="description" content="Browse our complete catalog of premium makeup and beauty products." />
      </Helmet>
      
      <div className="container products-layout">
        <aside className="filters-sidebar">
          <h3>Filters</h3>
          
          <div className="filter-group">
            <label>Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              <option value="Lips">Lips</option>
              <option value="Face">Face</option>
              <option value="Eyes">Eyes</option>
              <option value="Skincare">Skincare</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Brand</label>
            <input type="text" name="brand" value={filters.brand} onChange={handleFilterChange} placeholder="e.g. Fenty, MAC" />
          </div>

          <div className="filter-group">
            <label>Price Range</label>
            <div className="price-inputs">
              <input type="number" name="minPrice" value={filters.minPrice} onChange={handleFilterChange} placeholder="Min $" min="0"/>
              <span>-</span>
              <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} placeholder="Max $" min="0"/>
            </div>
          </div>

          <div className="filter-group">
            <label>Minimum Rating</label>
            <select name="rating" value={filters.rating} onChange={handleFilterChange}>
              <option value="">Any Rating</option>
              <option value="4">4 Stars & Up</option>
              <option value="3">3 Stars & Up</option>
              <option value="2">2 Stars & Up</option>
            </select>
          </div>

          <div className="filter-actions">
            <button className="btn btn-primary" onClick={applyFilters}>Apply Filters</button>
            <button className="btn btn-secondary" onClick={clearFilters}>Clear</button>
          </div>
        </aside>

        <div className="products-main">
          <div className="products-header">
            <h1 className="page-title">
              {searchQuery ? `Search Results for "${searchQuery}"` : "All Products"}
            </h1>
            <p className="results-count">Showing {products.length} results</p>
          </div>

          {loading ? (
             <div className="loading">Loading products...</div>
          ) : (
            <div className="product-grid">
              {products.length === 0 ? (
                <div className="empty-state">
                  <p>No products found matching your criteria.</p>
                  <button className="btn" onClick={clearFilters}>Clear Filters</button>
                </div>
              ) : (
                products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`
        .products-page { padding: 40px 0; background: #fdf2f8; min-height: calc(100vh - 80px); }
        .products-layout {
          display: flex;
          gap: 32px;
          align-items: flex-start;
        }
        .filters-sidebar {
          width: 250px;
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          position: sticky;
          top: 100px;
          flex-shrink: 0;
        }
        .filters-sidebar h3 {
          margin-top: 0;
          margin-bottom: 20px;
          font-size: 18px;
          color: #1f2937;
          border-bottom: 2px solid #fbcfe8;
          padding-bottom: 8px;
        }
        .filter-group {
          margin-bottom: 20px;
        }
        .filter-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #4b5563;
          margin-bottom: 8px;
        }
        .filter-group select, .filter-group input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
        }
        .filter-group select:focus, .filter-group input:focus { border-color: #f472b6; }
        .price-inputs {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .price-inputs input { width: 100%; }
        .filter-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 24px;
        }
        .filter-actions .btn { width: 100%; padding: 10px; }
        
        .products-main {
          flex: 1;
        }
        .products-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .page-title {
          font-size: 28px;
          margin: 0;
          color: #1f2937;
        }
        .results-count {
          color: #6b7280;
          font-size: 14px;
        }
        
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 24px;
        }
        .empty-state { grid-column: 1 / -1; text-align: center; color: #6b7280; padding: 60px 20px; background: white; border-radius: 12px; }
        .empty-state p { margin-bottom: 16px; font-size: 16px; }
        
        @media (max-width: 768px) {
          .products-layout { flex-direction: column; }
          .filters-sidebar { width: 100%; position: static; }
        }
      `}</style>
    </div>
  );
}
