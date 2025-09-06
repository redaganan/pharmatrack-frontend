import React from "react";

type Product = { id: number; name: string; qty: number; price: number };

const sampleProducts: Product[] = [
  { id: 1, name: "Paracetamol 500mg", qty: 10, price: 8.5 },
  { id: 2, name: "Cetirizine 10mg", qty: 2, price: 12.0 },
  { id: 3, name: "Amoxicillin 500mg", qty: 0, price: 45.0 },
  { id: 4, name: "Multivitamins", qty: 4, price: 120.0 },
  { id: 5, name: "Ibuprofen 200mg", qty: 20, price: 10.0 },
  { id: 6, name: "Loperamide 2mg", qty: 1, price: 15.0 },
];

const DashboardBody: React.FC = () => {
  const products = sampleProducts;
  const totalProducts = products.length;
  const totalStock = products.reduce((s, p) => s + p.qty, 0);
  const revenue = products.reduce((s, p) => s + p.qty * p.price, 0).toFixed(2);
  // For demo `ordersToday` use a small derived value
  const ordersToday = 6;

  const outOfStock = products.filter((p) => p.qty === 0);
  const lowStock = products.filter((p) => p.qty > 0 && p.qty <= 5);

  return (
    <div className="dashboard-body">
      <div className="stats-grid">
        <div className="stat-card stat-products">
          <div className="stat-title">TOTAL PRODUCTS</div>
          <div className="stat-value">{totalProducts}</div>
        </div>

        <div className="stat-card stat-stock">
          <div className="stat-title">TOTAL STOCK</div>
          <div className="stat-value">{totalStock}</div>
        </div>

        <div className="stat-card stat-orders">
          <div className="stat-title">ORDER TODAY</div>
          <div className="stat-value">{ordersToday}</div>
        </div>

        <div className="stat-card stat-revenue">
          <div className="stat-title">REVENUE</div>
          <div className="stat-value">₱ {revenue}</div>
        </div>
      </div>

      <div className="lists-row">
        <div className="list-card out-of-stock">
          <h3>Out of stock Products</h3>
          {outOfStock.length === 0 ? (
            <p className="empty">None</p>
          ) : (
            <ul>
              {outOfStock.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="list-card low-stock">
          <h3>Low stock Products</h3>
          {lowStock.length === 0 ? (
            <p className="empty">None</p>
          ) : (
            <ul>
              {lowStock.map((p) => (
                <li key={p.id}>
                  {p.name} — {p.qty}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardBody;
