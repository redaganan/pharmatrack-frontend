import React, { useEffect, useState } from "react";
import { getDashboardData, notifyOwners } from "../apis/dashboardApi";

const DashboardBody: React.FC = () => {
	const [dashboard, setDashboard] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await getDashboardData(
					"http://localhost:8000/api/dashboard/data"
				);
				setDashboard(res.data);
			} catch (err) {
				setError("Failed to load dashboard data");
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	if (loading) return <div>Loading dashboard...</div>;
	if (error) return <div>{error}</div>;
	if (!dashboard) return null;

	const handleNotify = async () => {
		try {
			await notifyOwners("http://localhost:8000/api/dashboard/notify-expiry");
			alert(
				"The owner has been notified about the Soon to expire Products."
			);
		} catch (error) {
			alert("Failed to notify owner");
		}
	};

	return (
		<div className="dashboard-body">
			<div className="stats-grid">
				<div className="stat-card stat-products">
					<div className="stat-title">TOTAL PRODUCTS</div>
					<div className="stat-value">{dashboard.totalProducts}</div>
				</div>
				<div className="stat-card stat-stock">
					<div className="stat-title">TOTAL STOCK</div>
					<div className="stat-value">
						{dashboard.totalProductsStock}
					</div>
				</div>
				<div className="stat-card stat-orders">
					<div className="stat-title">ORDER TODAY</div>
					<div className="stat-value">
						{dashboard.recentOrdersToday}
					</div>
				</div>
				<div className="stat-card stat-revenue">
					<div className="stat-title">REVENUE</div>
					<div className="stat-value">₱ {dashboard.revenueToday}</div>
				</div>
			</div>
			<div className="lists-row">
				<div className="list-card soon-expire">
					<div className="list-card-header">
						<h3>Soon to expire Products</h3>
						<div className="notify-box">
							<button
								type="button"
								className="btn-notify"
								onClick={() => handleNotify()}
							>
								NOTIFY!
							</button>
						</div>
					</div>
					{dashboard.soonToExpireProducts.length === 0 ? (
						<p className="empty">None</p>
					) : (
						<ul>
							{dashboard.soonToExpireProducts.map(
								(item: string, idx: number) => (
									<li key={idx}>{item}</li>
								)
							)}
						</ul>
					)}
				</div>
				<div className="list-card out-of-stock">
					<h3>Out of stock Products</h3>
					{dashboard.outOfStockProducts.length === 0 ? (
						<p className="empty">None</p>
					) : (
						<ul>
							{dashboard.outOfStockProducts.map(
								(item: string, idx: number) => (
									<li key={idx}>{item}</li>
								)
							)}
						</ul>
					)}
				</div>
				<div className="list-card low-stock">
					<h3>Low stock Products</h3>
					{dashboard.lowStockProducts.name.length === 0 ? (
						<p className="empty">None</p>
					) : (
						<ul>
							{dashboard.lowStockProducts.name.map(
								(name: string, idx: number) => (
									<li key={idx}>
										{name} —{" "}
										{
											dashboard.lowStockProducts.quantity[
												idx
											]
										}
									</li>
								)
							)}
						</ul>
					)}
				</div>
			</div>
		</div>
	);
};

export default DashboardBody;
