import React from "react";
import Sidebar from "../components/Sidebar";
import DashboardBody from "../components/DashboardBody";
import "../styles/DashBoard.css";

const DashBoard: React.FC = () => {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <h1>Dashboard</h1>
        <DashboardBody />
      </main>
    </div>
  );
};

export default DashBoard;
