import React, { useEffect, useState } from "react";
import { getProducts } from "../apis/productApi";

type CategoryRow = { name: string; productCount: number };

const CategoriesBody: React.FC = () => {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts(
          "http://localhost:8000/api/products/get-product"
        );
        const counts = new Map<string, number>();
        (data || []).forEach((p: any) => {
          const name = String(p.category || "Uncategorized");
          counts.set(name, (counts.get(name) || 0) + 1);
        });
        const rows: CategoryRow[] = Array.from(counts.entries()).map(
          ([name, count]) => ({ name, productCount: count })
        );
        setCategories(rows);
        setError(null);
      } catch (e) {
        setError("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const openAdd = () => {
    setNewName("");
    setIsAdding(true);
  };
  const closeAdd = () => setIsAdding(false);
  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      alert("Category already exists");
      return;
    }
    setCategories((prev) => [{ name, productCount: 0 }, ...prev]);
    setIsAdding(false);
  };

  const openEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditName(categories[idx].name);
  };
  const closeEdit = () => {
    setEditingIdx(null);
    setEditName("");
  };
  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIdx === null) return;
    const name = editName.trim();
    if (!name) return;
    if (
      categories.some(
        (c, i) =>
          i !== editingIdx && c.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      alert("Category already exists");
      return;
    }
    setCategories((prev) =>
      prev.map((c, i) => (i === editingIdx ? { ...c, name } : c))
    );
    setEditingIdx(null);
  };

  const remove = (idx: number) => {
    const name = categories[idx]?.name;
    if (!name) return;
    if (
      !confirm(
        `Delete category "${name}"? This won't affect existing products.`
      )
    )
      return;
    setCategories((prev) => prev.filter((_, i) => i !== idx));
  };

  if (loading) return <p>Loading categories...</p>;
  if (error) return <p className="empty">{error}</p>;

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
        <h3 style={{ margin: 0 }}>Categories</h3>
        <button className="add-product-btn" onClick={openAdd}>
          + Add Category
        </button>
      </div>

      <div className="products-header">
        <div>Category</div>
        <div className="center">Products</div>
        <div className="center">Actions</div>
      </div>

      {categories.map((c, idx) => (
        <div className="product-row" key={`${c.name}-${idx}`}>
          <div className="product-name">{c.name}</div>
          <div className="center">{c.productCount}</div>
          <div className="product-action center">
            <button className="btn-secondary" onClick={() => openEdit(idx)}>
              Edit
            </button>
            <button
              className="delete-btn"
              style={{ marginLeft: 8 }}
              onClick={() => remove(idx)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {isAdding && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Add Category</h3>
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
              <p className="empty" style={{ marginTop: 8 }}>
                WALA PA PONG DATABASE
              </p>
            </form>
          </div>
        </div>
      )}

      {editingIdx !== null && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Edit Category</h3>
            <form onSubmit={submitEdit}>
              <label>
                Name
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
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
              <p className="empty" style={{ marginTop: 8 }}>
                WALA PA PONG DATABASE
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesBody;
