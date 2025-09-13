import React, { useEffect, useRef, useState } from "react";

import "../../styles/OrdersBody.css";
import { getProducts } from "../apis/productApi";
const cartImg = new URL("../../images/cart.jpg", import.meta.url).href;

type Product = { id: string; name: string; quantity: number; price: number };
type CartItem = {
	productId: string;
	name: string;
	quantity: number;
	price: number;
	total: number;
};

const initialProducts: Product[] = [
	{ id: "1", name: "Paracetamol 500mg (Biogesic)", quantity: 10, price: 8.5 },
	{ id: "2", name: "Cetirizine 10mg (Allercet)", quantity: 15, price: 12.0 },
	{ id: "3", name: "Amoxicillin 500mg (Amoxil)", quantity: 5, price: 45.0 },
	{ id: "4", name: "Multivitamins (Centrum)", quantity: 8, price: 120.0 },
	{ id: "5", name: "Ibuprofen 200mg (Advil)", quantity: 20, price: 10.0 },
];

const OrdersBody: React.FC = () => {
	const [products, setProducts] = useState<Product[]>([]);
	const [orderQty, setOrderQty] = useState<Record<string, number>>({});
	const [orders, setOrders] = useState<
		{
			id: number;
			productId: string;
			name: string;
			quantity: number;
			price: number;
			total: number;
			date: string;
		}[]
	>([]);

	useEffect(() => {
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
	}, [products]); // Only fetch once on mount

	const [cart, setCart] = useState<CartItem[]>([]);
	const [cartOpen, setCartOpen] = useState(false);
	const [toast, setToast] = useState<string | null>(null);
	const [toastOpen, setToastOpen] = useState(false);
	const toastTimerRef = useRef<number | null>(null);

	const setQtyFor = (id: string, value: number) => {
		setOrderQty((s) => ({ ...s, [id]: value }));
	};

	const addToCart = (product: Product) => {
		const quantity = Math.max(1, Math.floor(orderQty[product.id] || 1));
		const inCartQuantity =
			cart.find((c) => c.productId === product.id)?.quantity ?? 0;
		if (quantity + inCartQuantity > product.quantity) {
			alert("Not enough stock to add to cart");
			return;
		}

		setCart((prev) => {
			let updated = false;
			const newCart = prev.map((c) => {
				if (c.productId === product.id) {
					updated = true;
					const newQuantity = c.quantity + quantity;
					return {
						...c,
						quantity: newQuantity,
						total: +(newQuantity * c.price).toFixed(2),
					};
				}
				return c;
			});
			if (!updated) {
				newCart.push({
					productId: product.id,
					name: product.name,
					quantity: quantity,
					price: product.price,
					total: +(quantity * product.price).toFixed(2),
				});
			}
			return newCart;
		});

		setOrderQty((s) => ({ ...s, [product.id]: 1 }));
		setToast(`${product.name} added to cart`);
		setToastOpen(true);
		if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
		toastTimerRef.current = window.setTimeout(() => {
			setToastOpen(false);
			toastTimerRef.current = null;
		}, 2500);
	};

	useEffect(() => {
		return () => {
			if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
		};
	}, []);

	const removeFromCart = (productId: string) => {
		setCart((prev) => prev.filter((c) => c.productId !== productId));
	};

	const changeCartQty = (productId: string, delta: number) => {
		setCart((prev) => {
			return prev
				.map((c) => {
					if (c.productId !== productId) return c;
					const product = products.find((p) => p.id === productId);
					if (!product) return c;
					const newQuantity = c.quantity + delta;
					if (newQuantity <= 0) return null;
					if (newQuantity > product.quantity) {
						alert("Not enough stock");
						return c;
					}
					return {
						...c,
						quantity: newQuantity,
						total: +(newQuantity * c.price).toFixed(2),
					};
				})
				.filter(Boolean) as CartItem[];
		});
	};

	const checkout = () => {
		if (cart.length === 0) {
			alert("Cart is empty");
			return;
		}
		const nextIdBase =
			(orders.reduce((m, o) => Math.max(m, o.id), 0) || 0) + 1;
		const newOrders = cart.map((c, idx) => ({
			id: nextIdBase + idx,
			productId: c.productId,
			name: c.name,
			quantity: c.quantity,
			price: c.price,
			total: c.total,
			date: new Date().toISOString(),
		}));

		setOrders((prev) => [...newOrders, ...prev]);
		setProducts((prev) =>
			prev.map((p) => {
				const ci = cart.find((c) => c.productId === p.id);
				return ci
					? { ...p, quantity: Math.max(0, p.quantity - ci.quantity) }
					: p;
			})
		);
		setCart([]);
		setCartOpen(false);
		alert("Checkout complete");
	};

	const clearCart = () => setCart([]);

	const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
	const cartTotal = cart.reduce((s, c) => s + c.total, 0);

	return (
		<div className="orders-body">
			<div
				className={`toast ${toastOpen ? "open" : ""}`}
				role="status"
				aria-live="polite"
			>
				{toast}
			</div>
			<div className="orders-table-container">
				<table className="orders-table">
					<thead>
						<tr>
							<th>Product</th>
							<th>Available</th>
							<th className="price-col">Price (PHP)</th>
							<th>Action</th>
						</tr>
					</thead>
					<tbody>
						{products.map((p) => (
							<tr key={p.id}>
								<td>{p.name}</td>
								<td>{p.quantity}</td>
								<td className="right price-col">
									<span className="amount">
										{p.price.toFixed(2)}
									</span>
								</td>
								<td>
									<button
										className="btn-primary"
										onClick={() => addToCart(p)}
										disabled={p.quantity === 0}
									>
										Add to Cart
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div style={{ marginTop: 20 }}>
				<h4>Recent Orders</h4>
				{orders.length === 0 ? (
					<p className="empty">No orders yet</p>
				) : (
					<table className="orders-table">
						<thead>
							<tr>
								<th>Date</th>
								<th>Product</th>
								<th>Qty</th>
								<th className="right price-col">Total</th>
							</tr>
						</thead>
						<tbody>
							{orders.map((o) => (
								<tr key={o.id}>
									<td>{new Date(o.date).toLocaleString()}</td>
									<td>{o.name}</td>
									<td>{o.quantity}</td>
									<td className="right price-col">
										<span className="amount">
											{o.total.toFixed(2)}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			<button
				className="cart-toggle"
				onClick={() => setCartOpen(true)}
				aria-label="Open cart"
			>
				🛒 Cart ({cartCount})
			</button>

			<aside className={`cart-slider ${cartOpen ? "open" : ""}`}>
				<div className="cart-header">
					<div className="cart-title">
						<img src={cartImg} alt="cart" />
						<div>
							<h3>Your Cart</h3>
							<small>{cartCount} item(s)</small>
						</div>
					</div>
					<div className="cart-actions">
						<button
							className="btn-link"
							onClick={() => setCartOpen(false)}
						>
							Close
						</button>
					</div>
				</div>

				<div className="cart-items">
					{cart.length === 0 ? (
						<div className="cart-empty">Your cart is empty</div>
					) : (
						cart.map((c) => (
							<div className="cart-item" key={c.productId}>
								<div className="cart-item-info">
									<div className="cart-item-name">
										{c.name}
									</div>
									<div className="cart-item-meta">
										<div className="cart-qty-controls">
											<button
												className="qty-btn"
												onClick={() =>
													changeCartQty(
														c.productId,
														-1
													)
												}
											>
												-
											</button>
											<div className="cart-qty">
												{c.quantity}
											</div>
											<button
												className="qty-btn"
												onClick={() =>
													changeCartQty(
														c.productId,
														1
													)
												}
											>
												+
											</button>
										</div>
										<div className="cart-item-price">
											×{" "}
											<span className="amount">
												{c.price.toFixed(2)}
											</span>
										</div>
									</div>
								</div>
								<div className="cart-item-actions">
									<div className="cart-item-total">
										<span className="amount">
											{c.total.toFixed(2)}
										</span>
									</div>
									<button
										className="btn-remove"
										onClick={() =>
											removeFromCart(c.productId)
										}
									>
										Remove
									</button>
								</div>
							</div>
						))
					)}
				</div>

				<div className="cart-footer">
					<div className="cart-summary">
						<div>Total</div>
						<div className="cart-total">
							<span className="amount">
								{cartTotal.toFixed(2)}
							</span>
						</div>
					</div>
					<div className="cart-buttons">
						<button className="btn-secondary" onClick={clearCart}>
							Clear
						</button>
						<button
							className="btn-primary"
							onClick={checkout}
							disabled={cart.length === 0}
						>
							Checkout
						</button>
					</div>
				</div>
			</aside>
		</div>
	);
};

export default OrdersBody;
