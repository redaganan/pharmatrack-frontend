import React, { useState } from "react";

import {
  addProduct as addProductApi,
  deleteProduct as deleteProductApi,
  getProducts,
  updateProduct as updateProductApi,
} from "../apis/productApi";

type Category =
  | "Baby & Child Care"
  | "Personal Care & Hygiene"
  | "Medical Supplies"
  | "Medicines"
  | "Household & Everyday Essentials"
  | "Senior & Special Care"
  | "Nutrition & Lifestyle"
  | "Sexual Health"
  | "Health & Wellness";

const CATEGORY_OPTIONS: Category[] = [
  "Baby & Child Care",
  "Personal Care & Hygiene",
  "Medical Supplies",
  "Medicines",
  "Household & Everyday Essentials",
  "Senior & Special Care",
  "Nutrition & Lifestyle",
  "Sexual Health",
  "Health & Wellness",
];

type Product = {
  _id: string;
  name: string;
  quantity: number;
  price: number;
  expiryDate: string; // ISO date
  category: Category;
};

const ProductsBody: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newExpiryDate, setNewExpiryDate] = useState<string>("");
  const [newCategory, setNewCategory] = useState<Category>("Medicines");

  const [editing, setEditing] = useState<Product | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>();
  const [editPrice, setEditPrice] = useState<number | null>(null);
  const [editExpiryDate, setEditExpiryDate] = useState<string>("");
  const [editCategory, setEditCategory] = useState<Category>("Medicines");

  // Fetch products from API (example URL)
  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts(
          "http://localhost:8000/api/products/get-product"
        );
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };
    fetchProducts();
  }, [products]);

  const deleteProduct = async (id: string) => {
    console.log("Deleting product with id:", id);
    try {
      const res = await deleteProductApi(
        "http://localhost:8000/api/products/delete-product",
        id
      );
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p._id !== id));
      } else {
        alert(res.message || "Failed to delete product.");
      }
    } catch (error) {
      alert("Error deleting product.");
      console.error(error);
    }
  };

  const openAdd = () => {
    setNewName("");
    setNewQuantity(1);
    setNewPrice(0);
    setNewExpiryDate("");
    setNewCategory("Medicines");
    setIsAdding(true);
  };
  const closeAdd = () => {
    setIsAdding(false);
  };

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const productData = {
        name: newName.trim(),
        quantity: Math.max(0, Math.floor(newQuantity)),
        price: Math.max(0, Number(newPrice)),
        expiryDate: newExpiryDate || new Date().toISOString().slice(0, 10),
        category: newCategory,
      };
      // Call backend to add product
      const res = await addProductApi(
        "http://localhost:8000/api/products/create-product",
        productData
      );
      if (res.success && res.product) {
        setProducts((prev) => [res.product, ...prev]);
        setIsAdding(false);
        // window.location.reload(); // Removed unnecessary reload
      } else {
        alert(res.message || "Failed to add product.");
      }
    } catch (error) {
      alert("Error adding product.");
      console.error(error);
    }
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setEditQuantity(p.quantity);
    setEditPrice(p.price);
    setEditExpiryDate(
      p.expiryDate.split("T")[0] || new Date().toISOString().slice(0, 10)
    );
    setEditCategory(p.category);
    // window.location.reload(); // Removed unnecessary reload
  };
  const closeEdit = () => {
    setEditing(null);
    // window.location.reload(); // Removed unnecessary reload
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    try {
      // Ensure expiryDate is always yyyy-MM-dd
      let formattedExpiry = editExpiryDate;
      if (editExpiryDate && editExpiryDate.includes("T")) {
        // If ISO string, convert to yyyy-MM-dd
        formattedExpiry = new Date(editExpiryDate).toISOString().slice(0, 10);
      }
      const productData = {
        name: editing.name, // If you want to allow editing name, add editName state
        quantity: Math.max(0, Math.floor(editQuantity ?? 0)),
        price: Math.max(0, Number(editPrice ?? 0)),
        expiryDate: formattedExpiry || new Date().toISOString().slice(0, 10),
        category: editCategory,
      };
      // Call backend to update product
      const res = await updateProductApi(
        "http://localhost:8000/api/products/update-product",
        editing._id,
        productData
      );
      if (res.success && res.product) {
        setProducts((prev) =>
          prev.map((p) => (p._id === res.product._id ? res.product : p))
        );
        setEditing(null);
      } else {
        alert(res.message || "Failed to update product.");
      }
    } catch (error) {
      console.error("Error updating product.");
      alert("Error updating product.");
      return;
    }

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
        <div className="product-row" key={p._id}>
          <div className="product-name">{p.name}</div>
          <div className="product-category center">{p.category}</div>
          <div className="product-expiry center">
            {p.expiryDate
              ? new Date(p.expiryDate).toISOString().slice(0, 10)
              : ""}
          </div>
          <div className="product-qty center">{p.quantity}</div>
          <div className="product-price center">{p.price.toFixed(2)}</div>
          <div className="product-subtotal center">
            {(p.quantity * p.price).toFixed(2)}
          </div>
          <div className="product-action center">
            <button className="btn-secondary" onClick={() => openEdit(p)}>
              Edit
            </button>
            <button
              className="delete-btn"
              onClick={() => deleteProduct(p._id)}
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
          {products.reduce((s, p) => s + p.quantity * p.price, 0).toFixed(2)}
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
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(Number(e.target.value))}
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
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
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
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(Number(e.target.value))}
                />
              </label>
              <label>
                Price (PHP)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editPrice || ""}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                />
              </label>
              <label>
                Expiry
                <input
                  type="date"
                  value={editExpiryDate}
                  onChange={(e) => setEditExpiryDate(e.target.value)}
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
