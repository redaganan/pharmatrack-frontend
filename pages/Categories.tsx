import React from "react";
import Sidebar from "../components/Sidebar";
import "../styles/DashBoard.css";

const Categories: React.FC = () => {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <h1>Categories</h1>
        <p>Categories page content.</p>
      </main>
    </div>
  );
};

export default Categories;
