import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
// @ts-ignore - image resides outside src tree resolution scope for TS checker tool
import logoImg from "../../images/LJ-LOGO.png"; // path relative to src/components -> ../../images
import { getDashboardData, notifyOwners } from "../apis/dashboardApi";
import { recentOrders } from "../apis/orderApi";
import { getProducts } from "../apis/productApi";

const DashboardBody: React.FC = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  type ProductType = {
    _id: string;
    name: string;
    category?: { name?: string } | string;
    createdAt?: string;
  };
  const [products, setProducts] = useState<ProductType[]>([]);

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
    const fetchProductsList = async () => {
      try {
        const list = await getProducts(
          "http://localhost:8000/api/products/get-product"
        );
        setProducts(Array.isArray(list) ? list : []);
      } catch (e) {
        // silently ignore
      }
    };
    fetchData();
    fetchOrders();
    fetchProductsList();
  }, []);

  const analytics = useMemo(() => {
    if (!orders.length) {
      return {
        bestSellers: [] as {
          productId: string;
          product: string;
          qty: number;
        }[],
        unsold: [] as { productId: string; product: string }[],
        slowMovers: [] as { productId: string; product: string; qty: number }[],
        categoryTotals: [] as { category: string; totalQty: number }[],
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

    // Build product lookup maps from current catalog
    const nameById = new Map<string, string>();
    const productById = new Map<string, any>();
    const idByName = new Map<string, string>();
    for (const p of products) {
      nameById.set(p._id, p.name);
      productById.set(p._id, p);
      if (p.name) idByName.set(p.name, p._id);
    }

    // Build quantity map but ONLY for products that still exist in the current catalog.
    // If an order references a deleted product, we ignore it for analytics export.
    const qtyMap = new Map<string, number>();
    for (const o of recent) {
      const id: string | undefined = o.productId;
      const name: string | undefined = o.product;
      let key: string | undefined;
      if (id && productById.has(id)) {
        key = id; // valid live product
      } else if (name && idByName.has(name)) {
        key = idByName.get(name)!; // map by current name
      } else {
        // product no longer exists -> skip
        continue;
      }
      qtyMap.set(key, (qtyMap.get(key) || 0) + (o.quantity || 0));
    }

    const BEST_SELLER_THRESHOLD = 40;
    const SLOW_MOVER_MAX = 20; // inclusive upper bound

    // Helper to resolve a human name for a product id
    const resolveName = (key: string) => nameById.get(key) || key;

    const bestSellers = Array.from(qtyMap.entries())
      .filter(([, qty]) => qty >= BEST_SELLER_THRESHOLD)
      .sort((a, b) => b[1] - a[1])
      .map(([productId, qty]) => ({
        productId,
        product: resolveName(productId),
        qty,
      }));

    const slowMovers = Array.from(qtyMap.entries())
      .filter(([, qty]) => qty > 0 && qty <= SLOW_MOVER_MAX)
      .filter(([id]) => !bestSellers.find((b) => b.productId === id))
      .sort((a, b) => a[1] - b[1]) // ascending (slowest first)
      .map(([productId, qty]) => ({
        productId,
        product: resolveName(productId),
        qty,
      }));

    // Unsold logic (product older than 30 days and zero sales ever)
    const soldIds = new Set<string>();
    for (const o of orders) {
      const key = o.productId || o.product;
      soldIds.add(key);
    }
    const unsold: { productId: string; product: string }[] = [];
    for (const p of products) {
      const createdAtTime = p.createdAt
        ? new Date(p.createdAt).getTime()
        : null;
      if (
        createdAtTime &&
        createdAtTime < thirtyAgo &&
        !soldIds.has(p._id) &&
        !soldIds.has(p.name)
      ) {
        unsold.push({ productId: p._id, product: p.name });
      }
    }

    // Category aggregation for top 3 chart later
    const categoryTotalsMap = new Map<string, number>();
    for (const [pid, qty] of qtyMap.entries()) {
      const prod = productById.get(pid);
      const categoryName =
        prod?.category?.name || prod?.category || "Uncategorized";
      categoryTotalsMap.set(
        categoryName,
        (categoryTotalsMap.get(categoryName) || 0) + qty
      );
    }
    const categoryTotals = Array.from(categoryTotalsMap.entries())
      .map(([category, totalQty]) => ({ category, totalQty }))
      .sort((a, b) => b.totalQty - a.totalQty);

    let suggestion = "";
    if (bestSellers.length) {
      const top = bestSellers[0];
      suggestion += `Top product: ${top.product} (${top.qty} sold last 30d). `;
    }
    if (slowMovers.length) {
      suggestion += `Monitor slow movers: ${slowMovers
        .slice(0, 2)
        .map((s) => s.product)
        .join(", ")}${slowMovers.length > 2 ? "…" : ""}. `;
    }
    if (unsold.length) {
      suggestion += `Consider promotion / discount: ${unsold
        .slice(0, 3)
        .map((u) => u.product)
        .join(", ")}${unsold.length > 3 ? "…" : ""}.`;
    } else if (bestSellers.length && !slowMovers.length) {
      suggestion += "Overall healthy sales distribution.";
    }
    if (!suggestion) suggestion = "Insufficient data for suggestions.";

    return { bestSellers, unsold, slowMovers, categoryTotals, suggestion };
  }, [orders, products]);

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

    // Summary Dashboard removed per user request; proceed directly to Best Sellers section
    y += 2; // slight spacing before first table

    doc.setFontSize(12);
    doc.text("Best Sellers", 14, y);
    doc.setFontSize(10);
    y += 5;
    // Best Sellers table (Product | Units Sold). Revenue & Trend columns need source data we don't have
    // without altering logic; we'll only include the two available metrics plus placeholder if desired.
    if (analytics.bestSellers.length === 0) {
      doc.text("No sales recorded.", 18, y);
      y += 5;
    } else {
      const pageWidth2 = doc.internal.pageSize.getWidth();
      const colWidths = [115, 25];
      const tableWidth2 = colWidths.reduce((a, b) => a + b, 0);
      const tableX = (pageWidth2 - tableWidth2) / 2; // center best sellers table
      const startY = y;
      // colWidths already defined
      const cellHeight = 8;
      const headerBg = [212, 235, 248];
      let cx = tableX;
      doc.setDrawColor(150, 150, 150);
      ["Product", "Units Sold"].forEach((h, idx) => {
        doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
        doc.rect(cx, startY, colWidths[idx], cellHeight, "FD");
        doc.setFontSize(9);
        doc.text(h, cx + 2, startY + 5);
        cx += colWidths[idx];
      });
      let rowY = startY + cellHeight;
      analytics.bestSellers.slice(0, 15).forEach((b) => {
        if (rowY > 270) {
          doc.addPage();
          rowY = 14; // reset top margin
          // Redraw header on new page for continuity
          let headerX = tableX;
          ["Product", "Units Sold"].forEach((h, idx) => {
            doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
            doc.rect(headerX, rowY, colWidths[idx], cellHeight, "FD");
            doc.setFontSize(9);
            doc.text(h, headerX + 2, rowY + 5);
            headerX += colWidths[idx];
          });
          rowY += cellHeight;
        }
        let cxi = tableX;
        const rowData = [b.product, String(b.qty)];
        rowData.forEach((val, i) => {
          doc.rect(cxi, rowY, colWidths[i], cellHeight, "S");
          const wrapped = doc.splitTextToSize(val, colWidths[i] - 4);
          doc.setFontSize(8.5);
          doc.text(wrapped as string[], cxi + 2, rowY + 5, {
            baseline: "middle",
          });
          cxi += colWidths[i];
        });
        rowY += cellHeight;
      });
      y = rowY + 10;
    }
    // Slow Movers section (not shown on dashboard UI)
    y += 2;
    doc.setFontSize(12);
    doc.text("Slow Movers ", 14, y);
    doc.setFontSize(10);
    y += 5;
    if (analytics.slowMovers.length === 0) {
      doc.text("None", 18, y);
      y += 5;
    } else {
      analytics.slowMovers.forEach((s) => {
        if (y > 270) {
          doc.addPage();
          y = 14;
        }
        doc.text(`${s.product} - ${s.qty} sold`, 18, y);
        y += 5;
      });
    }
    y += 2;
    // Top Categories Pie (only if we have data)
    if (analytics.categoryTotals.length) {
      doc.setFontSize(12);
      doc.text("Top Categories (Qty Share)", 14, y);
      doc.setFontSize(10);
      y += 5;
      try {
        const top3 = analytics.categoryTotals.slice(0, 3);
        // Draw pie on an offscreen canvas
        const canvas = document.createElement("canvas");
        const pieSize = 120;
        canvas.width = pieSize;
        canvas.height = pieSize;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const total = top3.reduce((s, c) => s + c.totalQty, 0) || 1;
          let start = 0;
          const colors = ["#4a90e2", "#50e3c2", "#f5a623"]; // reuse palette
          top3.forEach((c, idx) => {
            const slice = (c.totalQty / total) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(pieSize / 2, pieSize / 2);
            ctx.arc(
              pieSize / 2,
              pieSize / 2,
              pieSize / 2,
              start,
              start + slice
            );
            ctx.closePath();
            ctx.fillStyle = colors[idx % colors.length];
            ctx.fill();
            start += slice;
          });
          const imgData = canvas.toDataURL("image/png");
          // Add image (x=14, y=current, width ~40mm maintaining ratio). jsPDF default unit is mm.
          // Convert pixels to mm roughly: assume 96 dpi -> 25.4mm per inch -> 1px ≈ 0.2645mm
          const pxToMm = 0.2645;
          const targetWidthMm = pieSize * pxToMm; // ~31.7mm
          const targetHeightMm = pieSize * pxToMm;
          if (y + targetHeightMm > 280) {
            doc.addPage();
            y = 14;
          }
          doc.addImage(imgData, "PNG", 14, y, targetWidthMm, targetHeightMm);
          // Legend to right of pie
          let legendY = y + 2;
          const legendX = 14 + targetWidthMm + 4;
          ctx.font = "12px sans-serif";
          top3.forEach((c, idx) => {
            const pct = ((c.totalQty / total) * 100).toFixed(1);
            if (legendY > 280) {
              doc.addPage();
              legendY = 14;
            }
            doc.setDrawColor(255, 255, 255);
            const colorTuple =
              idx === 0
                ? [74, 144, 226]
                : idx === 1
                ? [80, 227, 194]
                : [245, 166, 35];
            doc.setFillColor(colorTuple[0], colorTuple[1], colorTuple[2]);
            doc.rect(legendX, legendY - 3.5, 4, 4, "F");
            doc.setTextColor(0, 0, 0);
            doc.text(`${c.category} (${pct}%)`, legendX + 6, legendY);
            legendY += 6;
          });
          y += targetHeightMm + 4;
        }
      } catch (err) {
        // If canvas unavailable (e.g., in non-browser context), skip silently
        doc.setFontSize(10);
        doc.text("Category chart unavailable in this environment.", 14, y);
        y += 6;
      }
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
        doc.text(p.product, 18, y);
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

  // Small inline pie chart component (top 3 categories)
  const CategoryPie: React.FC<{
    categories: { category: string; totalQty: number }[];
  }> = ({ categories }) => {
    const total = categories.reduce((s, c) => s + c.totalQty, 0) || 1;
    const size = 140;
    const radius = size / 2;
    let cumulative = 0;
    const colors = ["#4a90e2", "#50e3c2", "#f5a623"]; // fallback palette
    const slices = categories.map((c, idx) => {
      const value = c.totalQty;
      const startAngle = (cumulative / total) * Math.PI * 2;
      const endAngle = ((cumulative + value) / total) * Math.PI * 2;
      cumulative += value;
      const x1 = radius + radius * Math.sin(startAngle);
      const y1 = radius - radius * Math.cos(startAngle);
      const x2 = radius + radius * Math.sin(endAngle);
      const y2 = radius - radius * Math.cos(endAngle);
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
      const pathData = `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      return (
        <path
          key={c.category}
          d={pathData}
          fill={colors[idx % colors.length]}
          stroke="#fff"
          strokeWidth={1}
        />
      );
    });
    return (
      <div style={{ display: "flex", gap: 12 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices}
        </svg>
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            fontSize: 12,
            alignSelf: "center",
          }}
        >
          {categories.map((c, idx) => (
            <li
              key={c.category}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  background: colors[idx % colors.length],
                  display: "inline-block",
                  borderRadius: 2,
                }}
              />
              <span style={{ fontWeight: 600 }}>{c.category}</span>
              <span style={{ color: "#666" }}>
                ({((c.totalQty / total) * 100).toFixed(0)}%)
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

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
                    <li key={b.productId} style={{ fontSize: 13 }}>
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
                    <li key={p.productId} style={{ fontSize: 13 }}>
                      {p.product}
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
            <div style={{ flex: "1 1 260px", minWidth: 240 }}>
              <h4 style={{ margin: "4px 0 6px", fontSize: 14 }}>
                Top Categories
              </h4>
              {analytics.categoryTotals.length === 0 ? (
                <p className="empty" style={{ margin: 0 }}>
                  No category data
                </p>
              ) : (
                <CategoryPie
                  categories={analytics.categoryTotals.slice(0, 3)}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardBody;
