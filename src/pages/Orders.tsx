import React from "react";
import Sidebar from "../components/Sidebar";
import OrdersBody from "../components/OrdersBody";
import "../../styles/DashBoard.css";

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
