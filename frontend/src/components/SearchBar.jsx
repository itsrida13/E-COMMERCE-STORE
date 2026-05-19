import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { searchAutocomplete } from "../services/api";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(async () => {
      if (query.trim().length > 1) {
        setLoading(true);
        try {
          const { data } = await searchAutocomplete(query);
          setSuggestions(data);
          setIsOpen(true);
        } catch (err) {
          console.error("Autocomplete error", err);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      navigate(`/products?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="search-bar-wrapper" ref={wrapperRef}>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search products, categories..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setIsOpen(true) }}
        />
        <button type="submit" aria-label="Search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </button>
      </form>

      {isOpen && (
        <div className="autocomplete-dropdown">
          {loading ? (
            <div className="ac-loading">Searching...</div>
          ) : suggestions.length > 0 ? (
            <>
              <div className="ac-header">Smart Suggestions</div>
              {suggestions.map((item) => (
                  <Link
                  to={`/products/${item.slug || item._id}`}
                  key={item._id}
                  className="ac-item"
                  onClick={() => setIsOpen(false)}
                >
                  <img src={item.image ? (item.image.startsWith("http") ? item.image : `http://localhost:5000${item.image}`) : "/placeholder.png"} alt={item.name} className="ac-img" />
                  <div className="ac-info">
                    <div className="ac-name">{item.name}</div>
                    <div className="ac-price">${item.price.toFixed(2)}</div>
                  </div>
                </Link>
              ))}
              <div className="ac-footer" onClick={handleSearch}>
                See all results for "{query}"
              </div>
            </>
          ) : (
            query.length > 1 && <div className="ac-empty">No results found for "{query}"</div>
          )}
        </div>
      )}

      <style>{`
        .search-bar-wrapper {
          position: relative;
          width: 300px;
          margin-left: auto;
          margin-right: 20px;
        }
        .search-form {
          display: flex;
          align-items: center;
          background: #f3f4f6;
          border-radius: 20px;
          padding: 4px 12px;
          border: 1px solid transparent;
          transition: border-color 0.2s;
        }
        .search-form:focus-within {
          border-color: #f472b6;
          background: white;
        }
        .search-form input {
          border: none;
          background: transparent;
          outline: none;
          padding: 6px;
          width: 100%;
          font-size: 14px;
        }
        .search-form button {
          background: transparent;
          border: none;
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .search-form button:hover {
          color: #be185d;
        }
        .autocomplete-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 8px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          border: 1px solid #e5e7eb;
          z-index: 1000;
          overflow: hidden;
        }
        .ac-header {
          font-size: 11px;
          text-transform: uppercase;
          color: #6b7280;
          font-weight: 600;
          padding: 10px 12px;
          background: #f9fafb;
          border-bottom: 1px solid #f3f4f6;
        }
        .ac-loading, .ac-empty {
          padding: 16px;
          text-align: center;
          font-size: 14px;
          color: #6b7280;
        }
        .ac-item {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          text-decoration: none;
          color: inherit;
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.15s;
        }
        .ac-item:hover {
          background: #fdf2f8;
        }
        .ac-img {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 4px;
          margin-right: 12px;
        }
        .ac-info {
          flex: 1;
        }
        .ac-name {
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }
        .ac-price {
          font-size: 13px;
          color: #be185d;
          font-weight: 600;
        }
        .ac-footer {
          padding: 12px;
          text-align: center;
          font-size: 13px;
          color: #be185d;
          font-weight: 600;
          cursor: pointer;
          background: #fdf2f8;
        }
        .ac-footer:hover {
          background: #fce7f3;
        }
      `}</style>
    </div>
  );
}
