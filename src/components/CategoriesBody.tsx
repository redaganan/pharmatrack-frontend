import React, { useEffect, useState } from "react";
import {
	addCategory,
	getCategories,
	updateCategory,
} from "../apis/categoryApi";

type CategoryRow = { _id?: string; name: string; productCount: number };

const CategoriesBody: React.FC = () => {
	const [categories, setCategories] = useState<CategoryRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [isAdding, setIsAdding] = useState(false);
	const [newName, setNewName] = useState("");

	const [editingIdx, setEditingIdx] = useState<number | null>(null);
	const [editName, setEditName] = useState("");

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const data = await getCategories(
					"http://localhost:8000/api/categories/get-category"
				);
				const rows: CategoryRow[] = (data || []).map((c: any) => ({
					_id: c._id,
					name: c.name,
					productCount: 0, // You may want to fetch actual product counts from another API
				}));
				setCategories(rows);
				setError(null);
			} catch (e) {
				setError("Failed to load categories");
			} finally {
				setLoading(false);
			}
		};
		fetchCategories();
	}, []);

	const openAdd = () => {
		setNewName("");
		setIsAdding(true);
	};
	const closeAdd = () => setIsAdding(false);
	const submitAdd = async (e: React.FormEvent) => {
		e.preventDefault();
		const name = newName.trim();
		if (!name) return;
		if (
			categories.some((c) => c.name.toLowerCase() === name.toLowerCase())
		) {
			alert("Category already exists");
			return;
		}

		try {
			const newCategory = await addCategory(
				"http://localhost:8000/api/categories/create-category",
				{ name }
			);
			setCategories((prev) => [
				{
					_id: newCategory._id,
					name,
					productCount: 0,
				},
				...prev,
			]);
			setIsAdding(false);
		} catch (error) {
			alert("Failed to add category");
			console.error(error);
		}
	};

	const openEdit = (idx: number) => {
		setEditingIdx(idx);
		setEditName(categories[idx].name);
	};
	const closeEdit = () => {
		setEditingIdx(null);
		setEditName("");
	};
	const submitEdit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (editingIdx === null) return;
		const name = editName.trim();
		if (!name) return;
		if (
			categories.some(
				(c, i) =>
					i !== editingIdx &&
					c.name.toLowerCase() === name.toLowerCase()
			)
		) {
			alert("Category already exists");
			return;
		}

		try {
			const categoryToUpdate = categories[editingIdx];
			if (!categoryToUpdate._id) {
				alert("Category ID not found");
				return;
			}
            console.log(name);
			await updateCategory(
				"http://localhost:8000/api/categories/update-category",
				categoryToUpdate._id,
				{ name }
			);
			setCategories((prev) =>
				prev.map((c, i) => (i === editingIdx ? { ...c, name } : c))
			);
			setEditingIdx(null);
		} catch (error) {
			alert("Failed to update category");
			console.error(error);
		}
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
		<div className="products-box categories-compact">
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
				<div className="center">Actions</div>
			</div>

			{categories.map((c, idx) => (
				<div className="product-row" key={`${c.name}-${idx}`}>
					<div className="product-name">{c.name}</div>
					<div className="product-action center">
						<button
							className="btn-secondary"
							onClick={() => openEdit(idx)}
						>
							Update
						</button>
						{/* <button
              className="delete-btn"
              style={{ marginLeft: 8 }}
              onClick={() => remove(idx)}
            >
              Delete
            </button> */}
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
									onChange={(e) =>
										setEditName(e.target.value)
									}
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
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default CategoriesBody;
