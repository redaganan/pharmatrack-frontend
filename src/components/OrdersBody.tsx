import React, { useEffect, useRef, useState } from "react";
import "../../styles/OrdersBody.css";

import { checkout as checkoutApi, recentOrders } from "../apis/orderApi";
import { getProducts } from "../apis/productApi";

const cartImg = new URL("../../images/cart.jpg", import.meta.url).href;

type Product = { _id: string; name: string; quantity: number; price: number };
type CartItem = {
	productId: string;
	product: string;
	quantity: number;
	price: number;
	totalAmount: number;
};

const OrdersBody: React.FC = () => {
	const [products, setProducts] = useState<Product[]>([]);
	const [orderQty, setOrderQty] = useState<Record<string, number>>({});
	const [orders, setOrders] = useState<
		{
			orderId: string;
			productId: string;
			product: string;
			quantity: number;
			price: number;
			totalAmount: number;
			purchaseDate: string;
		}[]
	>([]);
	const [ordersLoading, setOrdersLoading] = useState(true);
	const [ordersError, setOrdersError] = useState<string | null>(null);

	// Helper to fetch recent orders
	const fetchRecentOrders = async () => {
		setOrdersLoading(true);
		try {
			const data = await recentOrders(
				"http://localhost:8000/api/orders/recent-orders"
			);
			setOrders(data);
			setOrdersError(null);
		} catch (error) {
			setOrdersError("Failed to fetch recent orders");
		} finally {
			setOrdersLoading(false);
		}
	};

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
	}, []); // Only fetch once on mount

	useEffect(() => {
		const fetchOrders = async () => {
			try {
				const data = await recentOrders(
					"http://localhost:8000/api/orders/recent-orders"
				);
				setOrders(data);
			} catch (error) {
				setOrdersError("Failed to fetch recent orders");
			} finally {
				setOrdersLoading(false);
			}
		};
		fetchOrders();
	}, []);

	const [cart, setCart] = useState<CartItem[]>([]);
	const [cartOpen, setCartOpen] = useState(false);
	const [toast, setToast] = useState<string | null>(null);
	const [toastOpen, setToastOpen] = useState(false);
	const toastTimerRef = useRef<number | null>(null);

	const setQtyFor = (id: string, value: number) => {
		setOrderQty((s) => ({ ...s, [id]: value }));
	};

	const addToCart = (product: Product) => {
		console.log("Adding to cart:", product);
		const quantity = Math.max(1, Math.floor(orderQty[product._id] || 1));
		const inCartQuantity =
			cart.find((c) => c.productId === product._id)?.quantity ?? 0;
		if (quantity + inCartQuantity > product.quantity) {
			alert("Not enough stock to add to cart");
			return;
		}

		setCart((prev) => {
			const existingIndex = prev.findIndex(
				(c) => c.productId === product._id
			);
			if (existingIndex !== -1) {
				// Update quantity for existing product
				return prev.map((c, idx) =>
					idx === existingIndex
						? {
								...c,
								quantity: c.quantity + quantity,
								total: +(
									(c.quantity + quantity) *
									c.price
								).toFixed(2),
						  }
						: c
				);
			} else {
				// Add new product to cart
				return [
					...prev,
					{
						productId: product._id,
						product: product.name,
						quantity: quantity,
						price: product.price,
						totalAmount: +(quantity * product.price).toFixed(2),
					},
				];
			}
		});

		setOrderQty((s) => ({ ...s, [product._id]: 1 }));
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
					const product = products.find((p) => p._id === productId);
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

	const checkout = async () => {
		if (cart.length === 0) {
			alert("Cart is empty");
			return;
		}

		const url = "http://localhost:8000/api/orders/create-order";
		const newOrders: any[] = [];

		for (const c of cart) {
			const orderData = {
				orderId: crypto.randomUUID(),
				purchaseDate: new Date().toISOString(),
				product: c.product,
				productId: c.productId,
				totalAmount: c.totalAmount,
				quantity: c.quantity,
			};
			try {
				const result = await checkoutApi(url, orderData);
				newOrders.push(result);
				console.log("Order response:", result);
			} catch (err) {
				console.error("Checkout failed for", c.product, err);
			}
		}

		// Update products and clear cart
		setProducts((prev) =>
			prev.map((p) => {
				const ci = cart.find((c) => c.productId === p._id);
				return ci
					? { ...p, quantity: Math.max(0, p.quantity - ci.quantity) }
					: p;
			})
		);
		setCart([]);
		setCartOpen(false);

		// Refetch recent orders to update UI
		await fetchRecentOrders();

		console.log("Checkout complete", newOrders);
	};

	const clearCart = () => setCart([]);

	const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
	const cartTotal = cart.reduce((s, c) => s + c.totalAmount, 0);

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
							<tr key={p._id}>
								<td>{p.name}</td>
								<td>{p.quantity}</td>
								<td className="right price-col">
									<span className="amount">
										{typeof p.price === "number" &&
										!isNaN(p.price)
											? p.price.toFixed(2)
											: "0.00"}
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
				{ordersLoading ? (
					<p>Loading recent orders...</p>
				) : ordersError ? (
					<p className="empty">{ordersError}</p>
				) : orders.length === 0 ? (
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
								<tr key={o.orderId}>
									<td>
										{new Date(
											o.purchaseDate
										).toLocaleString()}
									</td>
									<td>{o.product}</td>
									<td>{o.quantity}</td>
									<td className="right price-col">
										<span className="amount">
											{typeof o.totalAmount ===
												"number" &&
											!isNaN(o.totalAmount)
												? o.totalAmount.toFixed(2)
												: "0.00"}
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
										{c.product}
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
											{c.totalAmount.toFixed(2)}
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
