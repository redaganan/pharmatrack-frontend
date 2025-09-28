import React, { useState } from "react";

import {
    addProduct as addProductApi,
    deleteProduct as deleteProductApi,
    getProducts,
    updateProduct as updateProductApi,
} from "../apis/productApi";

import { getCategories } from "../apis/categoryApi";

type CategoryObject = {
	_id: string;
	name: string;
};

// Default categories (will be replaced by API data)
const DEFAULT_CATEGORIES: CategoryObject[] = [];

type Product = {
	_id: string;
	name: string;
	quantity: number;
	price: number;
	expiryDate: string; // ISO date
	category: CategoryObject;
	createdAt?: string;
	updatedAt?: string;
	__v?: number;
};

const ProductsBody: React.FC = () => {
    const [categories, setCategories] =
        useState<CategoryObject[]>(DEFAULT_CATEGORIES);
    const [products, setProducts] = useState<Product[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState("");
    const [newQuantity, setNewQuantity] = useState<number>(1);
    const [newPrice, setNewPrice] = useState<number>(0);
    const [newExpiryDate, setNewExpiryDate] = useState<string>("");
    const [newCategory, setNewCategory] = useState<CategoryObject>(
        DEFAULT_CATEGORIES[0]
    );

    const [editing, setEditing] = useState<Product | null>(null);
    const [editName, setEditName] = useState<string>("");
    const [editQuantity, setEditQuantity] = useState<number>();
    const [editPrice, setEditPrice] = useState<number | null>(null);
    const [editExpiryDate, setEditExpiryDate] = useState<string>("");
    const [editCategory, setEditCategory] = useState<CategoryObject>(
        DEFAULT_CATEGORIES[0]
    );

    const [loading, setLoading] = useState<boolean>(false); // NEW

    // Move fetchAndSetProducts here so it can be used everywhere
    const fetchAndSetProducts = async () => {
        setLoading(true); // NEW
        try {
            const data = await getProducts(
                "http://localhost:8000/api/products/get-product"
            );
            const normalizedData = data.map((product: any) => {
                if (product.category && typeof product.category === "string") {
                    product.category = { _id: "", name: product.category };
                }
                return product;
            });
            setProducts(normalizedData);
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false); // NEW
        }
    };

    // Fetch categories and products from API
    React.useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getCategories(
                    "http://localhost:8000/api/categories/get-category"
                );
                if (data && data.length > 0) {
                    setCategories(data);
                    // Update default category states if categories are loaded
                    if (data[0]) {
                        setNewCategory(data[0]);
                        setEditCategory(data[0]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
                // Keep default categories on error
            }
        };

        fetchCategories();
        fetchAndSetProducts();
    }, []);

    const deleteProduct = async (id: string) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this product?"
        );
        if (!confirmed) return;

        setLoading(true); // NEW
        try {
            const res = await deleteProductApi(
                "http://localhost:8000/api/products/delete-product",
                id
            );
            if (res.success) {
                await fetchAndSetProducts(); // Fetch latest products after delete
            } else {
                alert(res.message || "Failed to delete product.");
            }
        } catch (error) {
            alert("Error deleting product.");
            console.error(error);
        } finally {
            setLoading(false); // NEW
        }
    };

    const openAdd = () => {
        setNewName("");
        setNewQuantity(1);
        setNewPrice(0);
        setNewExpiryDate("");
        setNewCategory(categories[0]);
        setIsAdding(true);
    };
    const closeAdd = () => {
        setIsAdding(false);
    };

    const submitAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setLoading(true); // NEW
        try {
            const productData = {
                name: newName.trim(),
                quantity: Math.max(0, Math.floor(newQuantity)),
                price: Math.max(0, Number(newPrice)),
                expiryDate:
                    newExpiryDate || new Date().toISOString().slice(0, 10),
                categoryId: newCategory?._id,
            };

            const res = await addProductApi(
                "http://localhost:8000/api/products/create-product",
                productData
            );

            if (res.success && res.product) {
                await fetchAndSetProducts(); // Fetch latest products after add

                setNewName("");
                setNewQuantity(1);
                setNewPrice(0);
                setNewExpiryDate("");
                setNewCategory(categories[0] || DEFAULT_CATEGORIES[0]);
                setIsAdding(false);
            } else {
                alert(res.message || "Failed to add product.");
            }
        } catch (error) {
            alert("Error adding product.");
            console.error(error);
        } finally {
            setLoading(false); // NEW
        }
    };

    const openEdit = (p: Product) => {
        setEditing(p);
        setEditName(p.name);
        setEditQuantity(p.quantity);
        setEditPrice(p.price);
        setEditExpiryDate(
            p.expiryDate.split("T")[0] || new Date().toISOString().slice(0, 10)
        );
        setEditCategory(p.category);
    };
    const closeEdit = () => {
        setEditing(null);
    };

    const submitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;

        setLoading(true); // NEW
        try {
            let formattedExpiry = editExpiryDate;
            if (editExpiryDate && editExpiryDate.includes("T")) {
                formattedExpiry = new Date(editExpiryDate)
                    .toISOString()
                    .slice(0, 10);
            }

            const productData = {
                name: editName.trim() || editing.name,
                quantity: Math.max(0, Math.floor(editQuantity ?? 0)),
                price: Math.max(0, Number(editPrice ?? 0)),
                expiryDate:
                    formattedExpiry || new Date().toISOString().slice(0, 10),
                category: editCategory,
            };

            const res = await updateProductApi(
                "http://localhost:8000/api/products/update-product",
                editing._id,
                productData
            );

            if (res.success && res.product) {
                await fetchAndSetProducts(); // Fetch latest products after update

                setEditing(null);
                setEditName("");
                setEditQuantity(undefined);
                setEditPrice(null);
                setEditExpiryDate("");
                setEditCategory(categories[0] || DEFAULT_CATEGORIES[0]);
            } else {
                alert(res.message || "Failed to update product.");
            }
        } catch (error) {
            console.error("Error updating product:", error);
            alert("Error updating product.");
        } finally {
            setLoading(false); // NEW
        }
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
                <button className="add-product-btn" onClick={openAdd} disabled={loading}>
                    + Add Product
                </button>
            </div>

            {loading && (
                <div style={{ textAlign: "center", margin: "10px 0", color: "#888" }}>
                    Loading...
                </div>
            )}

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
                    <div className="product-category center">
                        {p.category.name}
                    </div>
                    <div className="product-expiry center">
                        {p.expiryDate
                            ? new Date(p.expiryDate).toISOString().slice(0, 10)
                            : ""}
                    </div>
                    <div className="product-qty center">{p.quantity}</div>
                    <div className="product-price center">
                        {p.price.toFixed(2)}
                    </div>
                    <div className="product-subtotal center">
                        {(p.quantity * p.price).toFixed(2)}
                    </div>
                    <div className="product-action center">
                        <button
                            className="btn-secondary"
                            onClick={() => openEdit(p)}
                            disabled={loading}
                        >
                            Update
                        </button>
                        <button
                            className="delete-btn"
                            onClick={() => deleteProduct(p._id)}
                            style={{ marginLeft: 8 }}
                            disabled={loading}
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
                    {products
                        .reduce((s, p) => s + p.quantity * p.price, 0)
                        .toFixed(2)}
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
                                    disabled={loading}
                                />
                            </label>
                            <label>
                                Category
                                <select
                                    value={newCategory._id}
                                    onChange={(e) => {
                                        const selectedCategory =
                                            categories.find(
                                                (c: CategoryObject) =>
                                                    c._id === e.target.value
                                            );
                                        if (selectedCategory) {
                                            setNewCategory(selectedCategory);
                                        }
                                    }}
                                    disabled={loading}
                                >
                                    {categories.map((c: CategoryObject) => (
                                        <option key={c._id} value={c._id}>
                                            {c.name}
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
                                    onChange={(e) =>
                                        setNewQuantity(Number(e.target.value))
                                    }
                                    disabled={loading}
                                />
                            </label>
                            <label>
                                Price (PHP)
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={newPrice}
                                    onChange={(e) =>
                                        setNewPrice(Number(e.target.value))
                                    }
                                    disabled={loading}
                                />
                            </label>
                            <label>
                                Expiry
                                <input
                                    type="date"
                                    value={newExpiryDate}
                                    onChange={(e) =>
                                        setNewExpiryDate(e.target.value)
                                    }
                                    disabled={loading}
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
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading}>
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
                        <h3>Update Product</h3>
                        <form onSubmit={submitEdit}>
                            <label>
                                Name
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) =>
                                        setEditName(e.target.value)
                                    }
                                    required
                                    disabled={loading}
                                />
                            </label>
                            <label>
                                Category
                                <select
                                    value={editCategory._id}
                                    onChange={(e) => {
                                        const selectedCategory =
                                            categories.find(
                                                (c: CategoryObject) =>
                                                    c._id === e.target.value
                                            );
                                        if (selectedCategory) {
                                            setEditCategory(selectedCategory);
                                        }
                                    }}
                                    disabled={loading}
                                >
                                    {categories.map((c: CategoryObject) => (
                                        <option key={c._id} value={c._id}>
                                            {c.name}
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
                                    onChange={(e) =>
                                        setEditQuantity(Number(e.target.value))
                                    }
                                    disabled={loading}
                                />
                            </label>
                            <label>
                                Price (PHP)
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editPrice || ""}
                                    onChange={(e) =>
                                        setEditPrice(Number(e.target.value))
                                    }
                                    disabled={loading}
                                />
                            </label>
                            <label>
                                Expiry
                                <input
                                    type="date"
                                    value={editExpiryDate}
                                    onChange={(e) =>
                                        setEditExpiryDate(e.target.value)
                                    }
                                    disabled={loading}
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
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading}>
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
