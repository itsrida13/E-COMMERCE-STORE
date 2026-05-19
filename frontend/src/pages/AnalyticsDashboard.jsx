import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { getAnalyticsDashboard } from "../services/api";
import ProtectedRoute from "../components/ProtectedRoute";
import { Link } from "react-router-dom";

const COLORS = ["#8b5cf6", "#ec4899", "#06b6d4", "#f59e0b", "#10b981", "#6366f1", "#f43f5e"];

function KpiCard({ label, value, sub, trend }) {
  return (
    <div className="kpi-card">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
      {sub && <span className="kpi-sub">{sub}</span>}
      {trend != null && (
        <span className={`kpi-trend ${trend >= 0 ? "up" : "down"}`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </span>
      )}
    </div>
  );
}

function AnalyticsContent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(90);
  const [dark, setDark] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: res } = await getAnalyticsDashboard(days);
      setData(res);
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : msg?.error || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  const exportJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `analytics-${days}d.json`;
    a.click();
  };

  if (loading && !data) {
    return <div className="analytics-loading">Loading AI analytics...</div>;
  }
  if (error && !data) {
    return (
      <div className="analytics-error">
        <p>{error}</p>
        <button type="button" className="btn-analytics" onClick={load}>Retry</button>
      </div>
    );
  }
  if (!data) return null;

  const { kpis, salesForecast, categoryAnalysis, topProducts, inventory, pricingInsights, customerAnalytics, recommendations, heatmap, insights } = data;

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "forecast", label: "Sales Prediction" },
    { id: "categories", label: "Categories" },
    { id: "inventory", label: "Inventory" },
    { id: "pricing", label: "Pricing" },
    { id: "customers", label: "Customers" },
    { id: "recommendations", label: "AI Recommendations" },
    { id: "insights", label: "AI Insights" },
  ];

  return (
    <div className={`analytics-root ${dark ? "dark" : "light"}`}>
      <aside className="analytics-sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">✦</span>
          <div>
            <strong>GlowMart AI</strong>
            <small>Analytics Hub</small>
          </div>
        </div>
        <nav>
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              className={activeSection === s.id ? "nav-active" : ""}
              onClick={() => setActiveSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>
        <Link to="/admin" className="sidebar-link">← Admin Panel</Link>
        <button type="button" className="theme-toggle" onClick={() => setDark(!dark)}>
          {dark ? "☀ Light" : "🌙 Dark"}
        </button>
      </aside>

      <main className="analytics-main">
        <header className="analytics-header">
          <div>
            <h1>AI Dashboard Analytics</h1>
            <p>Real-time predictions, inventory intelligence & smart recommendations</p>
          </div>
          <div className="header-actions">
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 180 days</option>
              <option value={365}>Last year</option>
            </select>
            <button type="button" className="btn-analytics" onClick={load}>Refresh</button>
            <button type="button" className="btn-analytics secondary" onClick={exportJson}>Export</button>
          </div>
        </header>

        {(activeSection === "overview" || activeSection === "forecast") && (
          <div className="kpi-grid">
            <KpiCard label="Revenue" value={`$${kpis.revenue?.toLocaleString()}`} trend={kpis.revenueGrowth} />
            <KpiCard label="Orders" value={kpis.orders} />
            <KpiCard label="Customers" value={kpis.customers} sub={`${kpis.repeatRate}% repeat`} />
            <KpiCard label="Avg Order" value={`$${kpis.aov}`} />
            <KpiCard label="Products" value={kpis.productCount} />
            <KpiCard label="Stock Alerts" value={kpis.lowStockCount} sub="needs attention" />
          </div>
        )}

        {(activeSection === "overview" || activeSection === "forecast") && (
          <div className="chart-grid">
            <div className="chart-card wide">
              <h3>Monthly Revenue & Forecast</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={salesForecast.monthly}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
                  <XAxis dataKey="month" stroke={dark ? "#94a3b8" : "#64748b"} />
                  <YAxis stroke={dark ? "#94a3b8" : "#64748b"} />
                  <Tooltip contentStyle={{ background: dark ? "#1e293b" : "#fff", border: "none", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="url(#revGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <h3>Weekly Sales</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={salesForecast.weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
                  <XAxis dataKey="week" stroke={dark ? "#94a3b8" : "#64748b"} />
                  <YAxis stroke={dark ? "#94a3b8" : "#64748b"} />
                  <Tooltip contentStyle={{ background: dark ? "#1e293b" : "#fff", borderRadius: 8 }} />
                  <Bar dataKey="revenue" fill="#ec4899" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeSection === "forecast" && salesForecast.seasonal?.length > 0 && (
          <div className="forecast-cards">
            <h3>Seasonal Demand Prediction</h3>
            <div className="forecast-row">
              {salesForecast.seasonal.map((s, i) => (
                <div key={i} className="forecast-card">
                  <span className="fc-cat">{s.category}</span>
                  <span className="fc-trend">{s.trend}</span>
                  <p>{s.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeSection === "overview" || activeSection === "categories") && (
          <div className="chart-grid">
            <div className="chart-card">
              <h3>Category Sales</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={categoryAnalysis} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {categoryAnalysis.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card wide">
              <h3>Top 10 Products</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topProducts} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
                  <XAxis type="number" stroke={dark ? "#94a3b8" : "#64748b"} />
                  <YAxis type="category" dataKey="name" width={75} stroke={dark ? "#94a3b8" : "#64748b"} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeSection === "inventory" && (
          <div className="section-block">
            <h3>Smart Inventory & Stock Alerts</h3>
            <div className="alert-grid">
              {inventory.alerts.length === 0 ? (
                <p className="muted">All stock levels healthy.</p>
              ) : (
                inventory.alerts.map((a) => (
                  <div key={a.productId} className={`alert-card ${a.status}`}>
                    <strong>{a.name}</strong>
                    <p>{a.message}</p>
                    {a.restockQty && <span className="restock">Restock ~{a.restockQty} units</span>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeSection === "pricing" && (
          <div className="section-block">
            <h3>Dynamic Pricing Intelligence</h3>
            <div className="pricing-grid">
              {pricingInsights.map((p, i) => (
                <div key={i} className="pricing-card">
                  <h4>{p.category}</h4>
                  <p>Avg ${p.avgPrice} · Margin ~{p.profitMarginEst}%</p>
                  <p className="muted">{p.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "customers" && (
          <div className="chart-grid">
            <div className="chart-card">
              <h3>Customer Segments</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={customerAnalytics.segments} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {customerAnalytics.segments.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <p className="stat-line">Repeat rate: <strong>{customerAnalytics.repeatRate}%</strong></p>
            </div>
          </div>
        )}

        {activeSection === "recommendations" && (
          <div className="section-block">
            <h3>AI Recommendation Engine</h3>
            <div className="rec-grid">
              <div className="rec-col">
                <h4>Best Sellers</h4>
                <ul>{recommendations.topSelling?.map((p) => <li key={p._id}>{p.name} — ${p.revenue?.toFixed(2)}</li>)}</ul>
              </div>
              <div className="rec-col">
                <h4>Frequently Bought Together</h4>
                <ul>{recommendations.boughtTogether?.map((b, i) => <li key={i}>{b.message}</li>)}</ul>
              </div>
              <div className="rec-col">
                <h4>Seasonal Picks</h4>
                <ul>{recommendations.seasonal?.map((p) => <li key={p._id}>{p.name} ({p.category})</li>)}</ul>
              </div>
            </div>
          </div>
        )}

        {activeSection === "insights" && (
          <div className="insights-panel">
            <h3>✦ AI Insights Panel</h3>
            <ul className="insights-list">
              {insights.map((text, i) => (
                <li key={i}>{text}</li>
              ))}
            </ul>
          </div>
        )}

        {activeSection === "overview" && heatmap?.length > 0 && (
          <div className="chart-card wide section-block">
            <h3>Seasonal Demand Heatmap (units by month)</h3>
            <div className="heatmap-table-wrap">
              <table className="heatmap-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    {[...new Set(categoryAnalysis.map((c) => c.name))].slice(0, 6).map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmap.slice(-6).map((row) => (
                    <tr key={row.month}>
                      <td>{row.month}</td>
                      {[...new Set(categoryAnalysis.map((c) => c.name))].slice(0, 6).map((cat) => {
                        const val = row[cat] || 0;
                        const intensity = Math.min(1, val / 20);
                        return (
                          <td key={cat} style={{ background: `rgba(139, 92, 246, ${intensity * 0.6 + 0.1})` }}>
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .analytics-root { display: flex; min-height: 100vh; font-family: system-ui, sans-serif; }
        .analytics-root.dark { background: #0f172a; color: #e2e8f0; }
        .analytics-root.light { background: #f1f5f9; color: #1e293b; }
        .analytics-sidebar {
          width: 240px; padding: 24px 16px; border-right: 1px solid rgba(148,163,184,0.2);
          display: flex; flex-direction: column; gap: 8px;
          background: rgba(15,23,42,0.95);
        }
        .analytics-root.light .analytics-sidebar { background: #fff; border-color: #e2e8f0; }
        .sidebar-brand { margin-bottom: 24px; }
        .brand-icon { font-size: 24px; color: #a78bfa; }
        .analytics-sidebar nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .analytics-sidebar button {
          text-align: left; padding: 10px 14px; border: none; border-radius: 8px;
          background: transparent; color: inherit; cursor: pointer; font-size: 14px;
        }
        .analytics-sidebar button:hover { background: rgba(139,92,246,0.15); }
        .analytics-sidebar .nav-active { background: linear-gradient(135deg,#6366f1,#8b5cf6); color: white; }
        .sidebar-link { font-size: 13px; color: #a78bfa; margin-top: auto; }
        .theme-toggle { margin-top: 12px; padding: 8px; border-radius: 8px; border: 1px solid rgba(148,163,184,0.3); background: transparent; color: inherit; cursor: pointer; }
        .analytics-main { flex: 1; padding: 24px 32px; overflow-y: auto; max-width: 1400px; }
        .analytics-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
        .analytics-header h1 { font-size: 26px; margin: 0 0 4px; }
        .analytics-header p { margin: 0; opacity: 0.7; font-size: 14px; }
        .header-actions { display: flex; gap: 10px; align-items: center; }
        .header-actions select { padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(148,163,184,0.3); background: inherit; color: inherit; }
        .btn-analytics { padding: 8px 16px; border-radius: 8px; border: none; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: white; cursor: pointer; font-weight: 500; }
        .btn-analytics.secondary { background: rgba(148,163,184,0.2); color: inherit; }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .kpi-card {
          padding: 20px; border-radius: 12px;
          background: rgba(30,41,59,0.6); border: 1px solid rgba(148,163,184,0.15);
          backdrop-filter: blur(8px);
        }
        .analytics-root.light .kpi-card { background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .kpi-label { font-size: 12px; opacity: 0.7; display: block; }
        .kpi-value { font-size: 24px; font-weight: 700; display: block; margin: 4px 0; }
        .kpi-sub { font-size: 12px; opacity: 0.6; }
        .kpi-trend { font-size: 12px; }
        .kpi-trend.up { color: #34d399; }
        .kpi-trend.down { color: #f87171; }
        .chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        @media (max-width: 900px) { .chart-grid { grid-template-columns: 1fr; } }
        .chart-card { padding: 20px; border-radius: 12px; background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.12); }
        .analytics-root.light .chart-card { background: white; }
        .chart-card.wide { grid-column: 1 / -1; }
        .chart-card h3 { margin: 0 0 16px; font-size: 16px; }
        .forecast-cards h3, .section-block h3 { margin-bottom: 16px; }
        .forecast-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
        .forecast-card { padding: 16px; border-radius: 10px; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); }
        .fc-cat { font-weight: 600; display: block; }
        .fc-trend { font-size: 11px; text-transform: uppercase; color: #a78bfa; }
        .alert-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
        .alert-card { padding: 14px; border-radius: 10px; border-left: 4px solid #f59e0b; }
        .alert-card.critical, .alert-card.out { border-color: #ef4444; background: rgba(239,68,68,0.1); }
        .alert-card.low { border-color: #f59e0b; }
        .restock { font-size: 12px; color: #34d399; }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
        .pricing-card { padding: 16px; border-radius: 10px; background: rgba(30,41,59,0.4); }
        .analytics-root.light .pricing-card { background: #f8fafc; }
        .rec-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 768px) { .rec-grid { grid-template-columns: 1fr; } }
        .rec-col { padding: 16px; border-radius: 10px; background: rgba(30,41,59,0.4); }
        .rec-col ul { margin: 0; padding-left: 18px; font-size: 14px; }
        .insights-panel { padding: 24px; border-radius: 12px; background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(236,72,153,0.1)); border: 1px solid rgba(139,92,246,0.3); }
        .insights-list { margin: 0; padding-left: 20px; line-height: 1.8; }
        .heatmap-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .heatmap-table th, .heatmap-table td { padding: 8px; text-align: center; border: 1px solid rgba(148,163,184,0.2); }
        .analytics-loading, .analytics-error { padding: 48px; text-align: center; }
        .muted { opacity: 0.6; }
        .stat-line { margin-top: 12px; font-size: 14px; }
        .section-block { margin-bottom: 24px; }
      `}</style>
    </div>
  );
}

export default function AnalyticsDashboard() {
  return (
    <ProtectedRoute adminOnly>
      <AnalyticsContent />
    </ProtectedRoute>
  );
}
