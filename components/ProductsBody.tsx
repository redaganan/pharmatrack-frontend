import React, { useState } from "react";
// Uses global button classes from index.css (.btn-primary / .btn-secondary)

type Category =
  | "Baby & Child Care"
  | "Personal Care & Hygiene"
  | "Medical Supplies"
  | "Medicines";

const CATEGORY_OPTIONS: Category[] = [
  "Baby & Child Care",
  "Personal Care & Hygiene",
  "Medical Supplies",
  "Medicines",
];

type Product = {
  id: number;
  name: string;
  qty: number;
  price: number;
  expiry: string; // ISO date
  category: Category;
};

const initialProducts: Product[] = [
  {
    id: 1,
    name: "Paracetamol 500mg (Biogesic)",
    qty: 10,
    price: 8.5,
    expiry: "2026-06-30",
    category: "Medicines",
  },
  {
    id: 2,
    name: "Cetirizine 10mg (Allercet)",
    qty: 15,
    price: 12.0,
    expiry: "2025-12-31",
    category: "Medicines",
  },
  {
    id: 3,
    name: "Amoxicillin 500mg (Amoxil)",
    qty: 5,
    price: 45.0,
    expiry: "2026-03-15",
    category: "Medicines",
  },
  {
    id: 4,
    name: "Multivitamins (Centrum)",
    qty: 8,
    price: 120.0,
    expiry: "2027-01-01",
    category: "Medicines",
  },
  {
    id: 5,
    name: "Ibuprofen 200mg (Advil)",
    qty: 20,
    price: 10.0,
    expiry: "2026-09-30",
    category: "Medicines",
  },
];

const ProductsBody: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState<number>(1);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newExpiry, setNewExpiry] = useState<string>("");
  const [newCategory, setNewCategory] = useState<Category>("Medicines");

  // editing state for Edit action
  const [editing, setEditing] = useState<Product | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editExpiry, setEditExpiry] = useState<string>("");
  const [editCategory, setEditCategory] = useState<Category>("Medicines");

  const deleteProduct = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const openAdd = () => {
    setNewName("");
    setNewQty(1);
    setNewPrice(0);
    setNewExpiry("");
    setNewCategory("Medicines");
    setIsAdding(true);
  };

  const closeAdd = () => setIsAdding(false);

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const nextId = products.reduce((m, p) => Math.max(m, p.id), 0) + 1;
    const product: Product = {
      id: nextId,
      name: newName.trim(),
      qty: Math.max(0, Math.floor(newQty)),
      price: Math.max(0, Number(newPrice)),
      expiry: newExpiry || new Date().toISOString().slice(0, 10),
      category: newCategory,
    };
    setProducts((prev) => [product, ...prev]);
    setIsAdding(false);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setEditQty(p.qty);
    setEditPrice(p.price);
    setEditExpiry(p.expiry || new Date().toISOString().slice(0, 10));
    setEditCategory(p.category);
  };

  const closeEdit = () => setEditing(null);

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === editing.id
          ? {
              ...p,
              qty: Math.max(0, Math.floor(editQty)),
              price: Number(editPrice),
              expiry: editExpiry,
              category: editCategory,
            }
          : p
      )
    );
    setEditing(null);
  };

  return (
    <div className="products-box">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <h3 style={{ margin: 0 }}>Product List</h3>
        <button className="add-product-btn" onClick={openAdd}>
          + Add Product
        </button>
      </div>

      <div className="products-header">
        <div>Product</div>
        <div className="center">Category</div>
        <div className="center">Expiry</div>
        <div className="center">Quantity</div>
        <div className="center">Price (PHP)</div>
        <div className="center">Subtotal</div>
        <div className="center">Actions</div>
      </div>

      {products.map((p) => (
        <div className="product-row" key={p.id}>
          <div className="product-name">{p.name}</div>

          <div className="product-category center">{p.category}</div>

          <div className="product-expiry center">{p.expiry}</div>

          <div className="product-qty center">{p.qty}</div>

          <div className="product-price center">{p.price.toFixed(2)}</div>

          <div className="product-subtotal center">
            {(p.qty * p.price).toFixed(2)}
          </div>

          <div className="product-action center">
            <button className="btn-secondary" onClick={() => openEdit(p)}>
              Edit
            </button>
            <button
              className="delete-btn"
              onClick={() => deleteProduct(p.id)}
              style={{ marginLeft: 8 }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      <div className="products-total">
        <div>Total</div>
        <div />
        <div />
        <div />
        <div />
        <div className="center">
          {products.reduce((s, p) => s + p.qty * p.price, 0).toFixed(2)}
        </div>
        <div />
      </div>

      {isAdding && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Add Product</h3>
            <form onSubmit={submitAdd}>
              <label>
                Name
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </label>
              <label>
                Category
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as Category)}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  min="0"
                  value={newQty}
                  onChange={(e) => setNewQty(Number(e.target.value))}
                />
              </label>
              <label>
                Price (PHP)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                />
              </label>
              <label>
                Expiry
                <input
                  type="date"
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                />
              </label>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <button
                  type="button"
                  onClick={closeAdd}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Edit Product</h3>
            <form onSubmit={submitEdit}>
              <label>
                Category
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as Category)}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  min="0"
                  value={editQty}
                  onChange={(e) => setEditQty(Number(e.target.value))}
                />
              </label>

              <label>
                Price (PHP)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                />
              </label>

              <label>
                Expiry
                <input
                  type="date"
                  value={editExpiry}
                  onChange={(e) => setEditExpiry(e.target.value)}
                />
              </label>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <button
                  type="button"
                  onClick={closeEdit}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsBody;
