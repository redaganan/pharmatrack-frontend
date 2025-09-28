import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import logoImg from "../../images/LJ-LOGO.png";
import { getDashboardData, notifyOwners } from "../apis/dashboardApi";
import { recentOrders } from "../apis/orderApi";

const DashboardBody: React.FC = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getDashboardData(
          "http://localhost:8000/api/dashboard/data"
        );
        setDashboard(res.data);
      } catch (err) {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    const fetchOrders = async () => {
      try {
        const data = await recentOrders(
          "http://localhost:8000/api/orders/recent-orders"
        );
        setOrders(Array.isArray(data) ? data : []);
        setOrdersError(null);
      } catch (e) {
        setOrdersError("Failed to load orders for analytics");
      }
    };
    fetchData();
    fetchOrders();
  }, []);

  const analytics = useMemo(() => {
    if (!orders.length) {
      return {
        bestSellers: [] as { product: string; qty: number }[],
        unsold: [] as string[],
        suggestion: "No data yet.",
      };
    }
    const now = new Date();
    const thirtyAgo = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 30
    ).getTime();
    const recent = orders.filter(
      (o) => new Date(o.purchaseDate).getTime() >= thirtyAgo
    );
    const qtyMap = new Map<string, number>();
    for (const o of recent) {
      qtyMap.set(o.product, (qtyMap.get(o.product) || 0) + o.quantity);
    }
    // Best sellers: only products that sold at least 40 units in the last 30 days
    const BEST_SELLER_THRESHOLD = 40;
    const bestSellers = Array.from(qtyMap.entries())
      .filter(([_, qty]) => qty >= BEST_SELLER_THRESHOLD)
      .sort((a, b) => b[1] - a[1])
      .map(([product, qty]) => ({ product, qty }));
    // Inactive products logic
    const lastSold = new Map<string, number>();
    for (const o of orders) {
      lastSold.set(
        o.product,
        Math.max(
          lastSold.get(o.product) || 0,
          new Date(o.purchaseDate).getTime()
        )
      );
    }
    const unsold: string[] = [];
    for (const [prod, last] of lastSold.entries()) {
      if (last < thirtyAgo) unsold.push(prod);
    }
    let suggestion = "";
    if (bestSellers.length) {
      const top = bestSellers[0];
      suggestion += `Top product: ${top.product} (${top.qty} sold last 30d). `;
    }
    if (unsold.length) {
      suggestion += `Consider promotion / discount: ${unsold
        .slice(0, 3)
        .join(", ")}${unsold.length > 3 ? "…" : ""}.`;
    } else if (bestSellers.length) {
      suggestion += "No inactive products in last 30 days.";
    }
    if (!suggestion) suggestion = "Insufficient data for suggestions.";
    return { bestSellers, unsold, suggestion };
  }, [orders]);

  const exportReport = async () => {
    const doc = new jsPDF();
    // Attempt to embed logo as header (assumes webpack/vite will inline or copy asset)
    try {
      // Load image into an HTMLImageElement to ensure it's ready before adding
      const img = new Image();
      img.src = logoImg;
      await new Promise((res, rej) => {
        img.onload = () => res(true);
        img.onerror = () => rej(new Error("Failed to load logo image"));
      });
      // Add image: x=14, y=8, width ~40, height auto (keep aspect ratio). Adjust if needed.
      doc.addImage(img, "PNG", 14, 6, 40, 18);
    } catch (e) {
      // If image fails, continue without blocking report generation.
      // Optionally could log e for debugging.
    }
    let y = 28; // Push content below logo
    doc.setFontSize(16);
    doc.text("PharmaTrack Analytics Report", 14, y);
    doc.setFontSize(10);
    y += 6;
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y);
    y += 6;
    doc.text("Window: Last 30 Days", 14, y);
    y += 8;
    doc.setFontSize(12);
    doc.text("Best Sellers", 14, y);
    doc.setFontSize(10);
    y += 5;
    if (analytics.bestSellers.length === 0) {
      doc.text("No sales recorded.", 18, y);
      y += 5;
    } else {
      analytics.bestSellers.forEach((b) => {
        const line = `${b.product} - ${b.qty} sold`;
        doc.text(line, 18, y);
        y += 5;
      });
    }
    y += 2;
    doc.setFontSize(12);
    doc.text("Inactive Products", 14, y);
    doc.setFontSize(10);
    y += 5;
    if (analytics.unsold.length === 0) {
      doc.text("None (all sold recently)", 18, y);
      y += 5;
    } else {
      analytics.unsold.slice(0, 30).forEach((p) => {
        if (y > 270) {
          doc.addPage();
          y = 14;
        }
        doc.text(p, 18, y);
        y += 5;
      });
      if (analytics.unsold.length > 30) {
        if (y > 270) {
          doc.addPage();
          y = 14;
        }
        doc.text(`+${analytics.unsold.length - 30} more...`, 18, y);
        y += 5;
      }
    }
    y += 2;
    doc.setFontSize(12);
    doc.text("Suggestion", 14, y);
    doc.setFontSize(10);
    y += 5;
    const suggestionLines: string[] = doc.splitTextToSize(
      analytics.suggestion,
      180
    ) as string[];
    suggestionLines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage();
        y = 14;
      }
      doc.text(line, 18, y);
      y += 5;
    });
    doc.save(`PharmaTrack-Analytics-${Date.now()}.pdf`);
  };

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>{error}</div>;
  if (!dashboard) return null;

  const handleNotify = async () => {
    try {
      await notifyOwners("http://localhost:8000/api/dashboard/notify-expiry");
      alert("The owner has been notified about the Soon to expire Products.");
    } catch (error) {
      alert("Failed to notify owner");
    }
  };

  return (
    <div className="dashboard-body">
      <div className="stats-grid">
        <div className="stat-card stat-products">
          <div className="stat-title">TOTAL PRODUCTS</div>
          <div className="stat-value">{dashboard.totalProducts}</div>
        </div>
        <div className="stat-card stat-stock">
          <div className="stat-title">TOTAL STOCK</div>
          <div className="stat-value">{dashboard.totalProductsStock}</div>
        </div>
        <div className="stat-card stat-orders">
          <div className="stat-title">ORDER TODAY</div>
          <div className="stat-value">{dashboard.recentOrdersToday}</div>
        </div>
        <div className="stat-card stat-revenue">
          <div className="stat-title">REVENUE</div>
          <div className="stat-value">₱ {dashboard.revenueToday}</div>
        </div>
      </div>
      <div className="lists-row">
        <div className="list-card soon-expire">
          <div className="list-card-header">
            <h3>Soon to expire Products</h3>
            <div className="notify-box">
              <button
                type="button"
                className="btn-notify"
                onClick={() => handleNotify()}
              >
                NOTIFY!
              </button>
            </div>
          </div>
          {dashboard.soonToExpireProducts.length === 0 ? (
            <p className="empty">None</p>
          ) : (
            <ul>
              {dashboard.soonToExpireProducts.map(
                (item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                )
              )}
            </ul>
          )}
        </div>
        <div className="list-card out-of-stock">
          <h3>Out of stock Products</h3>
          {dashboard.outOfStockProducts.length === 0 ? (
            <p className="empty">None</p>
          ) : (
            <ul>
              {dashboard.outOfStockProducts.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="list-card low-stock">
          <h3>Low stock Products</h3>
          {dashboard.lowStockProducts.name.length === 0 ? (
            <p className="empty">None</p>
          ) : (
            <ul>
              {dashboard.lowStockProducts.name.map(
                (name: string, idx: number) => (
                  <li key={idx}>
                    {name} — {dashboard.lowStockProducts.quantity[idx]}
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      </div>
      <div className="list-card analytics-card" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>Analytics Insights (30 Days)</h3>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: -10,
            marginBottom: 8,
          }}
        >
          <button
            onClick={() => exportReport()}
            className="btn-secondary"
            style={{ fontSize: 12 }}
          >
            Export Report
          </button>
        </div>
        {ordersError && <p className="empty">{ordersError}</p>}
        {!ordersError && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
            <div style={{ minWidth: 220, flex: "1 1 240px" }}>
              <h4 style={{ margin: "4px 0 6px", fontSize: 14 }}>
                Best Sellers
              </h4>
              {analytics.bestSellers.length === 0 ? (
                <p className="empty" style={{ margin: 0 }}>
                  No sales in last 30 days.
                </p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {analytics.bestSellers.map((b) => (
                    <li key={b.product} style={{ fontSize: 13 }}>
                      <strong>{b.product}</strong> — {b.qty} sold
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div style={{ minWidth: 220, flex: "1 1 240px" }}>
              <h4 style={{ margin: "4px 0 6px", fontSize: 14 }}>
                Inactive Products
              </h4>
              {analytics.unsold.length === 0 ? (
                <p className="empty" style={{ margin: 0 }}>
                  None (all sold recently)
                </p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {analytics.unsold.slice(0, 8).map((p) => (
                    <li key={p} style={{ fontSize: 13 }}>
                      {p}
                    </li>
                  ))}
                  {analytics.unsold.length > 8 && (
                    <li style={{ fontSize: 12, color: "#666" }}>
                      +{analytics.unsold.length - 8} more…
                    </li>
                  )}
                </ul>
              )}
            </div>
            <div style={{ flex: "2 1 320px", minWidth: 260 }}>
              <h4 style={{ margin: "4px 0 6px", fontSize: 14 }}>Suggestion</h4>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.4 }}>
                {analytics.suggestion}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardBody;
