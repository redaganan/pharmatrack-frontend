import React, { useEffect, useMemo, useState } from "react";
import "../../styles/History.css"; // calendar + charts styles
import "../../styles/OrdersBody.css"; // reuse table/button styles
import { recentOrders } from "../apis/orderApi";
import CalendarMonthRange from "./CalendarMonthRange";

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
