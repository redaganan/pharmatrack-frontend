import React from "react";
import "../../styles/DashBoard.css";
import Sidebar from "../components/Sidebar";
import HistoryBody from "../components/HistoryBody";

const History: React.FC = () => {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <h1>History</h1>
        <HistoryBody />
      </main>
    </div>
  );
};

export default History;
