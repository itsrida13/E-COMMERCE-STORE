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
  LineChart,
  Line,
} from "recharts";
import { getAnalyticsDashboard } from "../services/api";
import ProtectedRoute from "../components/ProtectedRoute";
import { Link } from "react-router-dom";

const COLORS = ["#be185d", "#ec4899", "#f472b6", "#f59e0b", "#8b5cf6", "#06b6d4", "#10b981"];

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
    a.download = `glamour-analytics-${days}d.json`;
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

  const {
    kpis,
    salesForecast,
    categoryAnalysis,
    categoryGrowth,
    topProducts,
    inventory,
    pricingInsights,
    customerAnalytics,
    recommendations,
    heatmap,
    insights,
    topCustomers,
    festivalForecast,
    productDemand,
    profitByCategory,
    priceTrendLine,
    competitorComparison,
    inventoryChart,
    fastestGrowingCategory,
    lowPerformingCategories,
    trendingProducts,
  } = data;

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "forecast", label: "Sales Prediction" },
    { id: "categories", label: "Categories" },
    { id: "inventory", label: "Inventory" },
    { id: "pricing", label: "Pricing" },
    { id: "customers", label: "Customers" },
    { id: "recommendations", label: "Recommendations" },
    { id: "insights", label: "AI Insights" },
  ];

  const gridStroke = dark ? "#334155" : "#e2e8f0";
  const axisStroke = dark ? "#94a3b8" : "#64748b";
  const tooltipBg = dark ? "#1e293b" : "#fff";

  return (
    <div className={`analytics-root ${dark ? "dark" : "light"}`}>
      <aside className="analytics-sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">✦</span>
          <div>
            <strong>Glamour Beauty</strong>
            <small>AI Analytics</small>
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
            <h1>AI Analytics Dashboard</h1>
            <p>Sales prediction · inventory · pricing · customer intelligence</p>
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
              <h3>Monthly Sales Forecast</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={salesForecast.monthly}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#be185d" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#be185d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="month" stroke={axisStroke} />
                  <YAxis stroke={axisStroke} />
                  <Tooltip contentStyle={{ background: tooltipBg, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#be185d" fill="url(#revGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <h3>Weekly Sales</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={salesForecast.weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="week" stroke={axisStroke} />
                  <YAxis stroke={axisStroke} />
                  <Tooltip contentStyle={{ background: tooltipBg, borderRadius: 8 }} />
                  <Bar dataKey="revenue" fill="#ec4899" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeSection === "forecast" && (
          <>
            {salesForecast.seasonal?.length > 0 && (
              <div className="section-block forecast-cards">
                <h3>Seasonal Demand (e.g. sunscreen in summer, lipstick in wedding season)</h3>
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
            {festivalForecast?.length > 0 && (
              <div className="section-block">
                <h3>Festival & Event Predictions</h3>
                <div className="forecast-row">
                  {festivalForecast.map((f, i) => (
                    <div key={i} className={`forecast-card ${f.upcoming ? "upcoming" : ""}`}>
                      <strong>{f.event}</strong>
                      <p>{f.prediction}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {productDemand?.length > 0 && (
              <div className="chart-card wide section-block">
                <h3>Future Demand Prediction (next 30 days)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={productDemand}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" stroke={axisStroke} tick={{ fontSize: 10 }} />
                    <YAxis stroke={axisStroke} />
                    <Tooltip contentStyle={{ background: tooltipBg }} />
                    <Bar dataKey="forecastUnits" fill="#be185d" name="Forecast units" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="currentUnits" fill="#fbcfe8" name="Current period" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        {(activeSection === "overview" || activeSection === "categories") && (
          <div className="chart-grid">
            <div className="chart-card">
              <h3>Category Sales (Pie)</h3>
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
              <h3>Top 10 Products by Revenue</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topProducts} layout="vertical" margin={{ left: 90 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis type="number" stroke={axisStroke} />
                  <YAxis type="category" dataKey="name" width={85} stroke={axisStroke} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: tooltipBg }} />
                  <Bar dataKey="revenue" fill="#be185d" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeSection === "categories" && categoryGrowth?.length > 0 && (
          <div className="chart-grid section-block">
            <div className="chart-card wide">
              <h3>Category Growth %</h3>
              {fastestGrowingCategory && (
                <p className="growth-highlight">
                  Fastest growing: <strong>{fastestGrowingCategory.name}</strong> (+{fastestGrowingCategory.growth}%)
                </p>
              )}
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={categoryGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="name" stroke={axisStroke} />
                  <YAxis stroke={axisStroke} />
                  <Tooltip contentStyle={{ background: tooltipBg }} />
                  <Bar dataKey="growth" fill="#10b981" name="Growth %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {lowPerformingCategories?.length > 0 && (
              <div className="chart-card">
                <h3>Low Performing Categories</h3>
                <ul className="simple-list">
                  {lowPerformingCategories.map((c) => (
                    <li key={c.name}>{c.name} — ${c.revenue} ({c.growth}% growth)</li>
                  ))}
                </ul>
              </div>
            )}
            {trendingProducts?.length > 0 && (
              <div className="chart-card">
                <h3>Trending (by units)</h3>
                <ul className="simple-list">
                  {trendingProducts.map((p) => (
                    <li key={p._id}>{p.name} — {p.units} units</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeSection === "inventory" && (
          <>
            <div className="section-block">
              <h3>Smart Inventory Alerts</h3>
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
            {inventoryChart?.length > 0 && (
              <div className="chart-card wide section-block">
                <h3>Inventory Health Graph</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={inventoryChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" stroke={axisStroke} tick={{ fontSize: 10 }} />
                    <YAxis stroke={axisStroke} />
                    <Tooltip contentStyle={{ background: tooltipBg }} />
                    <Bar dataKey="stock" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        {activeSection === "pricing" && (
          <>
            <div className="section-block">
              <h3>Dynamic Pricing Intelligence</h3>
              <div className="pricing-grid">
                {pricingInsights.map((p, i) => (
                  <div key={i} className="pricing-card">
                    <h4>{p.category}</h4>
                    <p>Avg ${p.avgPrice} · Est. margin {p.profitMarginEst}%</p>
                    <p className="muted">{p.message}</p>
                  </div>
                ))}
              </div>
            </div>
            {priceTrendLine?.length > 0 && (
              <div className="chart-card wide section-block">
                <h3>Price / Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={priceTrendLine}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="month" stroke={axisStroke} />
                    <YAxis stroke={axisStroke} />
                    <Tooltip contentStyle={{ background: tooltipBg }} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#be185d" strokeWidth={2} />
                    <Line type="monotone" dataKey="avgOrderValue" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {profitByCategory?.length > 0 && (
              <div className="chart-card wide section-block">
                <h3>Profit Margin by Category</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={profitByCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" stroke={axisStroke} />
                    <YAxis stroke={axisStroke} />
                    <Tooltip contentStyle={{ background: tooltipBg }} />
                    <Bar dataKey="profit" fill="#10b981" name="Est. profit" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="revenue" fill="#fbcfe8" name="Revenue" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {competitorComparison?.length > 0 && (
              <div className="chart-card wide section-block">
                <h3>Market Comparison (estimated)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={competitorComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="category" stroke={axisStroke} />
                    <YAxis stroke={axisStroke} />
                    <Tooltip contentStyle={{ background: tooltipBg }} />
                    <Legend />
                    <Bar dataKey="yourAvg" fill="#be185d" name="Your avg" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="marketEst" fill="#94a3b8" name="Market est." radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
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
              <p className="stat-line">Repeat rate: <strong>{customerAnalytics.repeatRate}%</strong> · AOV: <strong>${kpis.aov}</strong></p>
            </div>
            {topCustomers?.length > 0 && (
              <div className="chart-card wide">
                <h3>Most Active Customers</h3>
                <table className="data-table">
                  <thead>
                    <tr><th>Name</th><th>Orders</th><th>Spent</th></tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((c, i) => (
                      <tr key={i}>
                        <td>{c.name}</td>
                        <td>{c.orders}</td>
                        <td>${c.spent?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
            <h3>Seasonal Demand Heatmap</h3>
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
                          <td key={cat} style={{ background: `rgba(190, 24, 93, ${intensity * 0.5 + 0.1})` }}>
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
        .analytics-root { display: flex; min-height: 100vh; font-family: system-ui, sans-serif; margin: -20px 0 0; }
        .analytics-root.dark { background: #0f172a; color: #e2e8f0; }
        .analytics-root.light { background: #fdf2f8; color: #1e293b; }
        .analytics-sidebar {
          width: 220px; padding: 20px 14px; border-right: 1px solid rgba(148,163,184,0.2);
          display: flex; flex-direction: column; gap: 6px; flex-shrink: 0;
          background: rgba(15,23,42,0.95);
        }
        .analytics-root.light .analytics-sidebar { background: #fff; }
        .sidebar-brand { margin-bottom: 20px; }
        .brand-icon { font-size: 22px; color: #f472b6; }
        .analytics-sidebar nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .analytics-sidebar button {
          text-align: left; padding: 9px 12px; border: none; border-radius: 8px;
          background: transparent; color: inherit; cursor: pointer; font-size: 13px;
        }
        .analytics-sidebar button:hover { background: rgba(190,24,93,0.15); }
        .analytics-sidebar .nav-active { background: linear-gradient(135deg,#be185d,#ec4899); color: white; }
        .sidebar-link { font-size: 13px; color: #f472b6; margin-top: auto; text-decoration: none; }
        .theme-toggle { margin-top: 10px; padding: 8px; border-radius: 8px; border: 1px solid rgba(148,163,184,0.3); background: transparent; color: inherit; cursor: pointer; font-size: 13px; }
        .analytics-main { flex: 1; padding: 20px 28px; overflow-y: auto; }
        .analytics-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .analytics-header h1 { font-size: 24px; margin: 0 0 4px; }
        .analytics-header p { margin: 0; opacity: 0.7; font-size: 14px; }
        .header-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .header-actions select { padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(148,163,184,0.3); background: inherit; color: inherit; }
        .btn-analytics { padding: 8px 14px; border-radius: 8px; border: none; background: linear-gradient(135deg,#be185d,#ec4899); color: white; cursor: pointer; font-weight: 500; font-size: 14px; }
        .btn-analytics.secondary { background: rgba(148,163,184,0.2); color: inherit; }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }
        .kpi-card { padding: 16px; border-radius: 12px; background: rgba(30,41,59,0.6); border: 1px solid rgba(148,163,184,0.12); }
        .analytics-root.light .kpi-card { background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .kpi-label { font-size: 11px; opacity: 0.7; display: block; }
        .kpi-value { font-size: 22px; font-weight: 700; display: block; }
        .kpi-sub { font-size: 11px; opacity: 0.6; }
        .kpi-trend.up { color: #34d399; font-size: 12px; }
        .kpi-trend.down { color: #f87171; font-size: 12px; }
        .chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        @media (max-width: 900px) { .chart-grid { grid-template-columns: 1fr; } }
        .chart-card { padding: 18px; border-radius: 12px; background: rgba(30,41,59,0.5); border: 1px solid rgba(148,163,184,0.1); margin-bottom: 16px; }
        .analytics-root.light .chart-card { background: white; }
        .chart-card.wide { grid-column: 1 / -1; }
        .chart-card h3 { margin: 0 0 14px; font-size: 15px; }
        .forecast-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
        .forecast-card { padding: 14px; border-radius: 10px; background: rgba(190,24,93,0.1); border: 1px solid rgba(236,72,153,0.3); }
        .forecast-card.upcoming { border-color: #10b981; }
        .fc-cat { font-weight: 600; display: block; }
        .fc-trend { font-size: 10px; text-transform: uppercase; color: #f472b6; }
        .alert-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
        .alert-card { padding: 12px; border-radius: 8px; border-left: 4px solid #f59e0b; background: rgba(0,0,0,0.2); }
        .analytics-root.light .alert-card { background: #fff5f7; }
        .alert-card.critical, .alert-card.out { border-color: #ef4444; }
        .restock { font-size: 11px; color: #34d399; }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
        .pricing-card { padding: 14px; border-radius: 8px; background: rgba(30,41,59,0.4); }
        .analytics-root.light .pricing-card { background: #fff; }
        .rec-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        @media (max-width: 768px) { .rec-grid { grid-template-columns: 1fr; } }
        .rec-col { padding: 14px; border-radius: 8px; background: rgba(30,41,59,0.4); }
        .rec-col ul { margin: 0; padding-left: 16px; font-size: 13px; }
        .insights-panel { padding: 20px; border-radius: 12px; background: linear-gradient(135deg, rgba(190,24,93,0.12), rgba(236,72,153,0.08)); border: 1px solid rgba(236,72,153,0.3); }
        .insights-list { margin: 0; padding-left: 18px; line-height: 1.7; font-size: 14px; }
        .heatmap-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .heatmap-table th, .heatmap-table td { padding: 6px; text-align: center; border: 1px solid rgba(148,163,184,0.2); }
        .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .data-table th, .data-table td { padding: 8px; text-align: left; border-bottom: 1px solid rgba(148,163,184,0.2); }
        .simple-list { margin: 0; padding-left: 18px; font-size: 13px; }
        .growth-highlight { margin-bottom: 12px; font-size: 14px; }
        .section-block { margin-bottom: 20px; }
        .muted { opacity: 0.6; }
        .stat-line { margin-top: 10px; font-size: 13px; }
        .analytics-loading, .analytics-error { padding: 48px; text-align: center; width: 100%; }
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
