import React from "react";
import "../../styles/DashBoard.css";
import OrdersBody from "../components/OrdersBody";
import Sidebar from "../components/Sidebar";

const Orders: React.FC = () => {
	return (
		<div className="dashboard-container">
			<Sidebar />
			<main className="main-content">
				<h1>Orders</h1>
				<OrdersBody />
			</main>
		</div>
	);
};

export default Orders;
