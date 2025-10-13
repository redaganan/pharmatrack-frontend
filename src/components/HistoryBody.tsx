import React, { useEffect, useMemo, useState } from "react";
import "../../styles/History.css"; // calendar + charts styles
import "../../styles/OrdersBody.css"; // reuse table/button styles
import { recentOrders } from "../apis/orderApi";
import CalendarMonthRange from "./CalendarMonthRange";
import jsPDF from "jspdf";

type Order = {
  orderId: string;
  productId: string;
  product: string;
  quantity: number;
  totalAmount: number;
  purchaseDate: string; // ISO string
};

const toLocalYMD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const HistoryBody: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  // Start with no selected range; user must choose dates before data appears
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const data = await recentOrders(
          "http://localhost:8000/api/orders/recent-orders"
        );
        setOrders(Array.isArray(data) ? (data as Order[]) : []);
        setError(null);
      } catch (e) {
        setError("Failed to fetch order history");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filtered = useMemo(() => {
    // If no complete range selected, show nothing
    if (!rangeStart || !rangeEnd) return [] as Order[];
    const s = startOfDay(rangeStart).getTime();
    const e = startOfDay(rangeEnd).getTime();
    const [minT, maxT] = s <= e ? [s, e] : [e, s];
    return orders.filter((o) => {
      const t = startOfDay(new Date(o.purchaseDate)).getTime();
      return t >= minT && t <= maxT;
    });
  }, [orders, rangeStart, rangeEnd]);

  const revenue = useMemo(
    () => filtered.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0),
    [filtered]
  );

  const count = filtered.length;

  const setToday = () => {
    const d = startOfDay(new Date());
    setRangeStart(d);
    setRangeEnd(d);
    console.log(filtered);
  };

  const setThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setRangeStart(startOfDay(start));
    setRangeEnd(startOfDay(end));
  };

  const setLast7 = () => {
    const end = startOfDay(new Date());
    const start = addDays(end, -6);
    setRangeStart(start);
    setRangeEnd(end);
  };

  const clearRange = () => {
    setRangeStart(null);
    setRangeEnd(null);
  };

  // Build per-day series for charts
  const dayKeys: string[] = useMemo(() => {
    if (!rangeStart || !rangeEnd) return [];
    const s = startOfDay(rangeStart);
    const e = startOfDay(rangeEnd);
    const forward = s.getTime() <= e.getTime();
    const start = forward ? s : e;
    const end = forward ? e : s;
    const keys: string[] = [];
    for (
      let d = new Date(start);
      d.getTime() <= end.getTime();
      d = addDays(d, 1)
    ) {
      keys.push(toLocalYMD(d));
    }
    return keys;
  }, [rangeStart, rangeEnd]);

  const series = useMemo(() => {
    const revMap = new Map<string, number>();
    const cntMap = new Map<string, number>();
    for (const o of filtered) {
      const key = toLocalYMD(new Date(o.purchaseDate));
      revMap.set(key, (revMap.get(key) || 0) + (Number(o.totalAmount) || 0));
      cntMap.set(key, (cntMap.get(key) || 0) + 1);
    }
    const revenue = dayKeys.map((k) => revMap.get(k) || 0);
    const count = dayKeys.map((k) => cntMap.get(k) || 0);
    return { revenue, count };
  }, [filtered, dayKeys]);

  const maxRevenue = Math.max(0, ...series.revenue);
  const maxCount = Math.max(0, ...series.count);

  const exportHistory = () => {
    if (!rangeStart || !rangeEnd || filtered.length === 0) return;

    // Prepare document
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const pageMargin = 40; // left/right
    const lineHeight = 18;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const innerWidth = pageWidth - pageMargin * 2;

    const title = "Order History";
    const rangeStr = `${toLocalYMD(startOfDay(rangeStart))} to ${toLocalYMD(
      startOfDay(rangeEnd)
    )}`;

    // Columns
    const baseCols = [
      { key: "date", label: "Date", width: 90 },
      { key: "time", label: "Time", width: 80 },
      { key: "product", label: "Product", width: 220 },
      { key: "qty", label: "Qty", width: 60, align: "right" as const },
      {
        key: "total",
        label: "Total (PHP)",
        width: 110,
        align: "right" as const,
      },
    ];
    const baseTableWidth = baseCols.reduce((s, c) => s + c.width, 0);
    const scale = Math.min(1, innerWidth / baseTableWidth);
    const cols = baseCols.map((c) => ({
      ...c,
      width: Math.floor(c.width * scale),
    }));
    const tableWidth = cols.reduce((s, c) => s + c.width, 0);
    const tableStartX = pageMargin + Math.max(0, (innerWidth - tableWidth) / 2);

    let y = pageMargin;

    const drawHeader = () => {
      doc.setFontSize(16);
      doc.text(title, pageMargin, y);
      y += lineHeight;
      doc.setFontSize(11);
      doc.text(`Range: ${rangeStr}`, pageMargin, y);
      y += lineHeight * 1.2;

      // table header
      doc.setFontSize(11);
      // set bold style for headers
      doc.setFont("helvetica", "bold");
      let x = tableStartX;
      cols.forEach((c) => {
        const tx = c.align === "right" ? x + c.width : x;
        const align = c.align || "left";
        doc.text(c.label, tx, y, { align });
        x += c.width;
      });
      // reset to normal style
      doc.setFont("helvetica", "normal");
      y += lineHeight * 0.9;
      doc.setDrawColor(200);
      doc.line(tableStartX, y, tableStartX + tableWidth, y);
      y += lineHeight * 0.3;
    };

    const addPageIfNeeded = () => {
      if (y + lineHeight * 2 > pageHeight - pageMargin) {
        doc.addPage();
        y = pageMargin;
        drawHeader();
      }
    };

    drawHeader();

    // rows
    const rows = filtered
      .slice()
      .sort(
        (a, b) =>
          new Date(a.purchaseDate).getTime() -
          new Date(b.purchaseDate).getTime()
      )
      .map((o) => {
        const d = new Date(o.purchaseDate);
        return {
          date: d.toLocaleDateString(),
          time: d.toLocaleTimeString(),
          product: o.product,
          qty: String(o.quantity),
          total: Number(o.totalAmount || 0).toFixed(2),
        };
      });

    doc.setFontSize(11);
    rows.forEach((r) => {
      addPageIfNeeded();
      let x = tableStartX;
      cols.forEach((c) => {
        const text = r[c.key as keyof typeof r] as string;
        const tx = c.align === "right" ? x + c.width : x;
        const align = c.align || "left";
        doc.text(String(text), tx, y, { align, maxWidth: c.width });
        x += c.width;
      });
      y += lineHeight;
    });

    // Summary
    addPageIfNeeded();
    y += lineHeight * 0.2;
    doc.setDrawColor(200);
    doc.line(tableStartX, y, tableStartX + tableWidth, y);
    y += lineHeight;
    doc.setFont("helvetica", "bold");
    doc.text(
      `Orders: ${count}    Revenue: PHP ${revenue.toFixed(2)}`,
      tableStartX,
      y
    );
    doc.setFont("helvetica", "normal");

    // Save
    const fileName = `history_${rangeStr.replace(/[^0-9a-zA-Z_-]+/g, "_")}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="orders-body">
      {/* reuse spacing/background */}
      <div className="history-controls">
        <CalendarMonthRange
          start={rangeStart}
          end={rangeEnd}
          onChange={(s, e) => {
            setRangeStart(s);
            setRangeEnd(e);
          }}
        />
        <div className="spacer" />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-secondary" onClick={setToday}>
            Today
          </button>
          <button className="btn-secondary" onClick={setLast7}>
            Last 7 days
          </button>
          <button className="btn-secondary" onClick={setThisMonth}>
            This month
          </button>
          <button className="btn-link" onClick={clearRange}>
            Clear
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, margin: "8px 0 16px" }}>
        <div
          style={{
            background: "#fafafa",
            padding: "10px 12px",
            borderRadius: 8,
            boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ color: "#6b6b6b", fontSize: 12 }}>Orders</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{count}</div>
        </div>
        <div
          style={{
            background: "#fafafa",
            padding: "10px 12px",
            borderRadius: 8,
            boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ color: "#6b6b6b", fontSize: 12 }}>Revenue (PHP)</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            {revenue.toFixed(2)}
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading history...</p>
      ) : error ? (
        <p className="empty">{error}</p>
      ) : !rangeStart || !rangeEnd ? (
        <p className="empty">Select a date range to view orders</p>
      ) : filtered.length === 0 ? (
        <p className="empty">No orders for the selected range</p>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              margin: "0 0 12px",
            }}
          >
            <button className="btn-primary" onClick={exportHistory}>
              Export History
            </button>
          </div>
          <div className="history-charts">
            <div className="chart-card">
              <div className="chart-title">
                <span>Revenue by Day</span>
                <span className="small-note">PHP</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <div
                  className="bar-chart"
                  style={{ minWidth: Math.max(300, dayKeys.length * 20) }}
                >
                  {series.revenue.map((v, i) => {
                    const h =
                      maxRevenue > 0 ? Math.round((v / maxRevenue) * 100) : 0;
                    return (
                      <div
                        className="bar"
                        key={`rev-${i}`}
                        style={{ height: `${h}%` }}
                      >
                        <div className="tip">
                          {dayKeys[i]} • {v.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div
                  className="bar-labels"
                  style={{ minWidth: Math.max(300, dayKeys.length * 20) }}
                >
                  {dayKeys.map((k, i) => (
                    <div key={`rv-l-${i}`}>{k.slice(5)}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-title">
                <span>Orders by Day</span>
                <span className="small-note">count</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <div
                  className="bar-chart"
                  style={{ minWidth: Math.max(300, dayKeys.length * 20) }}
                >
                  {series.count.map((v, i) => {
                    const h =
                      maxCount > 0 ? Math.round((v / maxCount) * 100) : 0;
                    return (
                      <div
                        className="bar"
                        key={`cnt-${i}`}
                        style={{ height: `${h}%`, background: "#3498db" }}
                      >
                        <div className="tip">
                          {dayKeys[i]} • {v}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div
                  className="bar-labels"
                  style={{ minWidth: Math.max(300, dayKeys.length * 20) }}
                >
                  {dayKeys.map((k, i) => (
                    <div key={`ct-l-${i}`}>{k.slice(5)}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="orders-table-container" style={{ overflowX: "auto" }}>
            <table className="orders-table history-orders-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th className="right price-col">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.purchaseDate).getTime() -
                      new Date(a.purchaseDate).getTime()
                  )
                  .map((o) => {
                    const d = new Date(o.purchaseDate);
                    return (
                      <tr key={o.orderId}>
                        <td className="nowrap">{d.toLocaleDateString()}</td>
                        <td className="nowrap">{d.toLocaleTimeString()}</td>
                        <td className="product-col">{o.product}</td>
                        <td>{o.quantity}</td>
                        <td className="right price-col">
                          <span className="amount">
                            {Number(o.totalAmount || 0).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default HistoryBody;
