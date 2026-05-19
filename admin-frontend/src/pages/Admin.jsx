import { useState, useEffect } from "react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  updateOrderStatus,
  updateOrder,
  generateSEO,
} from "../services/api";
import { Link, useSearchParams } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import { getProductImageUrl } from "../utils/image";

function AdminContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "products";
  const setTab = (newTab) => {
    setSearchParams({ tab: newTab });
  };
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "", brand: "", category: "", shade: "", price: "", stock: "", description: "", 
    metaTitle: "", metaDescription: "", metaKeywords: "", slug: "", imageAltText: "",
    costPrice: "", sellingPrice: "", competitorPrice: "", reorderLevel: "", maxStockLevel: "", 
    supplierName: "", supplierDeliveryDays: "", lastRestockedAt: "", expiryDate: "", 
    batchNumber: "", skinType: "", seasonTag: "", demandLevel: ""
  });
  const [generatingSEO, setGeneratingSEO] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      const { data } = await getProducts();
      setProducts(data);
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : msg?.error || "Failed to load products");
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await getOrders();
      setOrders(data);
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : msg?.error || "Failed to load orders");
    }
  };

  useEffect(() => {
    setLoading(true);
    setError("");
    const load = async () => {
      if (tab === "products") await fetchProducts();
      else await fetchOrders();
      setLoading(false);
    };
    load();
  }, [tab]);

  const resetForm = () => {
    setFormData({
      name: "", brand: "", category: "", shade: "", price: "", stock: "", description: "", 
      metaTitle: "", metaDescription: "", metaKeywords: "", slug: "", imageAltText: "",
      costPrice: "", sellingPrice: "", competitorPrice: "", reorderLevel: "", maxStockLevel: "", 
      supplierName: "", supplierDeliveryDays: "", lastRestockedAt: "", expiryDate: "", 
      batchNumber: "", skinType: "", seasonTag: "", demandLevel: ""
    });
    setImageFile(null);
    setImagePreview("");
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      brand: product.brand || "",
      category: product.category || "",
      shade: product.shade || "",
      price: product.price ?? "",
      stock: product.stock ?? "",
      description: product.description || "",
      metaTitle: product.metaTitle || "",
      metaDescription: product.metaDescription || "",
      metaKeywords: product.metaKeywords || "",
      slug: product.slug || "",
      imageAltText: product.imageAltText || "",
      costPrice: product.costPrice ?? "",
      sellingPrice: product.sellingPrice ?? "",
      competitorPrice: product.competitorPrice ?? "",
      reorderLevel: product.reorderLevel ?? "",
      maxStockLevel: product.maxStockLevel ?? "",
      supplierName: product.supplierName || "",
      supplierDeliveryDays: product.supplierDeliveryDays ?? "",
      lastRestockedAt: product.lastRestockedAt ? new Date(product.lastRestockedAt).toISOString().split('T')[0] : "",
      expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : "",
      batchNumber: product.batchNumber || "",
      skinType: product.skinType || "",
      seasonTag: product.seasonTag || "",
      demandLevel: product.demandLevel || ""
    });
    setImageFile(null);
    setImagePreview(product.image || "");
    setShowForm(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!/^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.type)) {
        setError("Please select an image (jpeg, png, gif, webp)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be less than 5MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(editingProduct?.image || "");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, typeof value === 'string' ? value.trim() : String(value));
      });

      if (imageFile) {
        payload.append("image", imageFile);
      } else if (editingProduct?.image) {
        payload.append("image", editingProduct.image);
      }

      if (editingProduct) {
        await updateProduct(editingProduct._id, payload);
      } else {
        await createProduct(payload);
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : msg?.error || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateSEO = async () => {
    try {
      setGeneratingSEO(true);
      setError("");
      // Using basic data we have in form
      const aiPayload = {
        name: formData.name,
        category: formData.category,
        brand: formData.brand,
        price_range: formData.price,
        shade: formData.shade,
        features: formData.description
      };
      
      const { data } = await generateSEO(aiPayload);
      
      setFormData(prev => ({
        ...prev,
        metaTitle: data.seoTitle || prev.metaTitle,
        metaDescription: data.metaDescription || prev.metaDescription,
        metaKeywords: data.keywords || prev.metaKeywords,
        slug: data.slug || prev.slug,
        imageAltText: data.imageAltText || prev.imageAltText
      }));
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : msg?.error || "Failed to generate SEO");
    } finally {
      setGeneratingSEO(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      fetchProducts();
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : msg?.error || "Failed to delete");
    }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      // Map to correct casing (Processing, Delivered, Cancelled)
      const mappedStatus = 
        status.toLowerCase() === "processing" ? "Processing" :
        status.toLowerCase() === "delivered" ? "Delivered" :
        status.toLowerCase() === "cancelled" ? "Cancelled" : "Processing";

      await updateOrder(orderId, { status: mappedStatus });
      fetchOrders();
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : msg?.error || "Failed to update status");
    }
  };

  const handlePaymentStatusChange = async (orderId, paymentStatus) => {
    try {
      // Map to correct casing (Pending, Paid, Failed, Refunded)
      const mappedPaymentStatus = 
        paymentStatus.toLowerCase() === "pending" ? "Pending" :
        paymentStatus.toLowerCase() === "paid" ? "Paid" :
        paymentStatus.toLowerCase() === "failed" ? "Failed" :
        paymentStatus.toLowerCase() === "refunded" ? "Refunded" : "Pending";

      await updateOrder(orderId, { paymentStatus: mappedPaymentStatus });
      fetchOrders();
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : msg?.error || "Failed to update payment status");
    }
  };

  return (
    <div className="page admin-page">
      <div className="container">
        <h1 className="page-title" style={{ marginTop: '0', paddingTop: '20px' }}>Admin Dashboard</h1>
        <div className="admin-tabs">
          <button
            className={tab === "products" ? "active" : ""}
            onClick={() => setTab("products")}
          >
            Products
          </button>
          <button
            className={tab === "orders" ? "active" : ""}
            onClick={() => setTab("orders")}
          >
            Orders
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {tab === "products" && (
          <>
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary btn-add"
              >
                Add Product
              </button>
            ) : (
              <div className="card admin-form-card">
                <h2>{editingProduct ? "Edit Product" : "Add Product"}</h2>
                <form onSubmit={handleSubmit} className="admin-product-form">
                  <div className="form-section">
                    <h3>Basic Info</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Product Name *</label>
                        <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Velvet Lipstick" />
                      </div>
                      <div className="form-group">
                        <label>Brand</label>
                        <input value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="e.g. GlowMart" />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Category</label>
                        <input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Lipstick" />
                      </div>
                      <div className="form-group">
                        <label>Shade</label>
                        <input value={formData.shade} onChange={e => setFormData({ ...formData, shade: e.target.value })} placeholder="e.g. Ruby Red" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={4} placeholder="Product description..." />
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Pricing</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Price *</label>
                        <input type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required placeholder="0.00" />
                      </div>
                      <div className="form-group">
                        <label>Cost Price</label>
                        <input type="number" step="0.01" min="0" value={formData.costPrice} onChange={e => setFormData({ ...formData, costPrice: e.target.value })} placeholder="0.00" />
                      </div>
                      <div className="form-group">
                        <label>Selling Price</label>
                        <input type="number" step="0.01" min="0" value={formData.sellingPrice} onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })} placeholder="0.00" />
                      </div>
                      <div className="form-group">
                        <label>Competitor Price</label>
                        <input type="number" step="0.01" min="0" value={formData.competitorPrice} onChange={e => setFormData({ ...formData, competitorPrice: e.target.value })} placeholder="0.00" />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Inventory</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Current Stock</label>
                        <input type="number" min="0" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} placeholder="0" />
                      </div>
                      <div className="form-group">
                        <label>Reorder Level</label>
                        <input type="number" min="0" value={formData.reorderLevel} onChange={e => setFormData({ ...formData, reorderLevel: e.target.value })} placeholder="10" />
                      </div>
                      <div className="form-group">
                        <label>Max Stock Level</label>
                        <input type="number" min="0" value={formData.maxStockLevel} onChange={e => setFormData({ ...formData, maxStockLevel: e.target.value })} placeholder="100" />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Supplier Name</label>
                        <input value={formData.supplierName} onChange={e => setFormData({ ...formData, supplierName: e.target.value })} placeholder="e.g. BeautyCorp" />
                      </div>
                      <div className="form-group">
                        <label>Delivery Days</label>
                        <input type="number" min="0" value={formData.supplierDeliveryDays} onChange={e => setFormData({ ...formData, supplierDeliveryDays: e.target.value })} placeholder="e.g. 5" />
                      </div>
                      <div className="form-group">
                        <label>Last Restocked</label>
                        <input type="date" value={formData.lastRestockedAt} onChange={e => setFormData({ ...formData, lastRestockedAt: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Makeup Details</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Skin Type</label>
                        <input value={formData.skinType} onChange={e => setFormData({ ...formData, skinType: e.target.value })} placeholder="e.g. Oily, Dry, All" />
                      </div>
                      <div className="form-group">
                        <label>Season Tag</label>
                        <input value={formData.seasonTag} onChange={e => setFormData({ ...formData, seasonTag: e.target.value })} placeholder="e.g. Summer, Winter" />
                      </div>
                      <div className="form-group">
                        <label>Demand Level</label>
                        <select value={formData.demandLevel} onChange={e => setFormData({ ...formData, demandLevel: e.target.value })}>
                          <option value="">Select...</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Batch Number</label>
                        <input value={formData.batchNumber} onChange={e => setFormData({ ...formData, batchNumber: e.target.value })} placeholder="e.g. BATCH-2023" />
                      </div>
                      <div className="form-group">
                        <label>Expiry Date</label>
                        <input type="date" value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="seo-section form-section">
                    <div className="seo-header">
                      <h3>SEO Metadata</h3>
                      <button 
                        type="button" 
                        onClick={handleGenerateSEO} 
                        className="btn btn-secondary btn-sm"
                        disabled={generatingSEO || !formData.name}
                        title={!formData.name ? "Please enter product name first" : "Generate SEO with AI"}
                      >
                        {generatingSEO ? "Generating..." : "✨ AI Auto-Generate SEO"}
                      </button>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>URL Slug</label>
                        <input
                          value={formData.slug}
                          onChange={(e) =>
                            setFormData({ ...formData, slug: e.target.value })
                          }
                          placeholder="e.g. velvet-lipstick"
                        />
                      </div>
                      <div className="form-group">
                        <label>SEO Title (Meta Title)</label>
                        <input
                          value={formData.metaTitle}
                          onChange={(e) =>
                            setFormData({ ...formData, metaTitle: e.target.value })
                          }
                          placeholder="e.g. Buy Velvet Lipstick | Glamour"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>SEO Keywords</label>
                        <input
                          value={formData.metaKeywords}
                          onChange={(e) =>
                            setFormData({ ...formData, metaKeywords: e.target.value })
                          }
                          placeholder="e.g. lipstick, makeup, beauty"
                        />
                      </div>
                      <div className="form-group">
                        <label>Image ALT Text</label>
                        <input
                          value={formData.imageAltText}
                          onChange={(e) =>
                            setFormData({ ...formData, imageAltText: e.target.value })
                          }
                          placeholder="e.g. Red Velvet Lipstick product view"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>SEO Description (Meta Description)</label>
                      <textarea
                          value={formData.metaDescription}
                          onChange={(e) =>
                            setFormData({ ...formData, metaDescription: e.target.value })
                          }
                          rows={2}
                          placeholder="Short description for search engines..."
                        />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Product Image</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageChange}
                    />
                    {imagePreview && (
                      <div className="image-preview">
                        <img src={imagePreview.startsWith("blob:") ? imagePreview : getProductImageUrl(imagePreview)} alt="Preview" />
                      </div>
                    )}
                    <p className="form-hint">JPG, PNG, GIF or WebP. Max 5MB.</p>
                  </div>
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? "Saving..." : editingProduct ? "Update" : "Create"}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <div className="admin-table-wrap card">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Brand</th>
                      <th>Category</th>
                      <th>Shade</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p._id}>
                        <td>
                          <div className="table-img">
                            {p.image ? (
                              <img src={getProductImageUrl(p.image)} alt={p.name} />
                            ) : (
                              <span>—</span>
                            )}
                          </div>
                        </td>
                        <td>{p.name}</td>
                        <td>{p.brand || "—"}</td>
                        <td>{p.category || "—"}</td>
                        <td>{p.shade || "—"}</td>
                        <td>${p.price?.toFixed(2)}</td>
                        <td>{p.stock ?? "—"}</td>
                        <td>
                          <button
                            onClick={() => handleEdit(p)}
                            className="btn btn-secondary btn-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(p._id)}
                            className="btn btn-danger btn-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length === 0 && (
                  <p className="empty-msg">No products yet. Add your first product!</p>
                )}
              </div>
            )}
          </>
        )}

        {tab === "orders" && (
          <>
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <div className="orders-list">
                {orders.length === 0 ? (
                  <div className="card empty-card">No orders yet.</div>
                ) : (
                  orders.map((order) => (
                    <div key={order._id} className="card order-card">
                      <div className="order-header">
                        <span>Order #{order._id?.slice(-6)}</span>
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="order-badges" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <span className={`badge status-badge ${(order.status || order.orderStatus || "processing").toLowerCase()}`}>
                          {order.status || order.orderStatus}
                        </span>
                        <span className="badge method-badge">
                          {(order.paymentMethod || "").toLowerCase() === "card" && "💳 Card"}
                          {(order.paymentMethod || "").toLowerCase() === "paypal" && "🅿️ PayPal"}
                          {(order.paymentMethod || "").toLowerCase() === "cod" && "🚚 Cash on Delivery"}
                          {((order.paymentMethod || "").toLowerCase() === "cash on delivery") && "🚚 Cash on Delivery"}
                          {!order.paymentMethod && "🚚 Cash on Delivery"}
                        </span>
                        <span className={`badge payment-badge ${(order.paymentStatus || "pending").toLowerCase()}`}>
                          {order.paymentStatus || "pending"}
                        </span>
                      </div>
                      <p className="order-user">
                        Customer: {order.customerName || order.userId?.name || order.user?.name || "Guest"} ({order.email || order.userId?.email || order.user?.email || "N/A"})
                      </p>
                      {order.shippingAddress && (
                        <div className="order-shipping">
                          <strong>Ship to:</strong> {order.customerName || order.shippingAddress.fullName || "Guest"},{" "}
                          {order.shippingAddress.address},{" "}
                          {order.shippingAddress.city}{" "}
                          {order.shippingAddress.postalCode},{" "}
                          {order.shippingAddress.country}
                          <br />
                          Phone: {order.phone || order.shippingAddress.phone || "N/A"}
                        </div>
                      )}
                      <ul className="order-items">
                        {(order.orderItems && order.orderItems.length > 0
                          ? order.orderItems.map((item, i) => ({
                              name: item.name || item.product?.name || "Product",
                              quantity: item.quantity,
                              price: item.price || item.product?.price || 0
                            }))
                          : (order.items || []).map((item, i) => ({
                              name: item.productId?.name || "Product",
                              quantity: item.quantity,
                              price: item.productId?.price || 0
                            }))
                        ).map((item, i) => (
                          <li key={i}>
                            {item.name} x {item.quantity} - ${(item.price * item.quantity).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                      <p className="order-total">Total: ${order.totalPrice?.toFixed(2)}</p>
                      
                      <div className="order-actions-row" style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                        <div className="order-status" style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '600' }}>Status:</label>
                          <select
                            value={(order.status || order.orderStatus || "processing").toLowerCase()}
                            onChange={(e) =>
                              handleStatusChange(order._id, e.target.value)
                            }
                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                          >
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        
                        <div className="order-status" style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '600' }}>Payment Status:</label>
                          <select
                            value={(order.paymentStatus || "pending").toLowerCase()}
                            onChange={(e) =>
                              handlePaymentStatusChange(order._id, e.target.value)
                            }
                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
      <style>{`
        .admin-page { padding: 40px 0; }
        .admin-tabs { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 24px; }
        .admin-analytics-link {
          padding: 10px 18px;
          background: linear-gradient(135deg, #be185d, #ec4899);
          color: white;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
          font-size: 14px;
        }
        .admin-analytics-link:hover { opacity: 0.9; }
        .btn-add { margin-bottom: 20px; }
        .admin-form-card { padding: 24px; margin-bottom: 24px; }
        .admin-form-card h2 { margin-bottom: 20px; font-size: 20px; }
        .form-section { border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin-bottom: 24px; background: #fafafa; }
        .form-section h3 { margin: 0 0 16px; font-size: 16px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
        .form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px; }
        .form-group input[type="text"],
        .form-group input[type="number"],
        .form-group input[type="date"],
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          background: #fff;
        }
        .form-group input[type="file"] { margin-top: 4px; }
        .form-hint { font-size: 12px; color: #6b7280; margin-top: 4px; }
        .image-preview { margin-top: 12px; }
        .image-preview img {
          max-width: 120px;
          max-height: 120px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        .seo-section { background: #fdf2f8; padding: 16px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #fce7f3; }
        .seo-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .seo-header h3 { font-size: 16px; color: #be185d; margin: 0; }
        .form-actions { display: flex; gap: 12px; margin-top: 20px; }
        .admin-table-wrap { overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .admin-table th { background: #f9fafb; font-weight: 600; }
        .table-img { width: 48px; height: 48px; }
        .table-img img { width: 100%; height: 100%; object-fit: cover; border-radius: 6px; }
        .table-img span { color: #9ca3af; font-size: 14px; }
        .btn-sm { padding: 6px 12px; font-size: 13px; margin-right: 8px; }
        .empty-msg { padding: 24px; text-align: center; color: #6b7280; }
        .order-card { padding: 24px; margin-bottom: 20px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .order-header { display: flex; justify-content: space-between; margin-bottom: 12px; font-weight: 600; }
        .order-user { color: #4b5563; margin-bottom: 8px; font-size: 14px; }
        .order-shipping { font-size: 13px; color: #6b7280; margin-bottom: 16px; line-height: 1.5; background: #f9fafb; padding: 12px; border-radius: 6px; border: 1px solid #f3f4f6; }
        .order-items { list-style: none; margin-bottom: 16px; padding-left: 0; }
        .order-items li { padding: 4px 0; color: #1f2937; font-size: 14px; }
        .order-total { font-weight: 700; margin-bottom: 16px; font-size: 16px; color: #111827; }
        .order-status { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f3f4f6; }
        .order-status select { padding: 6px 12px; border-radius: 6px; border: 1px solid #d1d5db; background: #fff; font-size: 14px; }
        .empty-card { padding: 48px; text-align: center; }
        .badge { padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; display: inline-flex; align-items: center; }
        .status-badge.processing { background: #fef3c7; color: #d97706; }
        .status-badge.shipped { background: #dbeafe; color: #2563eb; }
        .status-badge.delivered { background: #d1fae5; color: #059669; }
        .status-badge.cancelled { background: #fee2e2; color: #dc2626; }
        .method-badge { background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; }
        .payment-badge.paid { background: #d1fae5; color: #059669; border: 1px solid #10b981; }
        .payment-badge.pending { background: #fef3c7; color: #d97706; border: 1px solid #f59e0b; }
      `}</style>
    </div>
  );
}

export default function Admin() {
  return (
    <ProtectedRoute adminOnly>
      <AdminContent />
    </ProtectedRoute>
  );
}
