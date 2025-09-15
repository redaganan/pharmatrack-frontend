import React from "react";
import Sidebar from "../components/Sidebar";
import CategoriesBody from "../components/CategoriesBody";
import "../../styles/DashBoard.css";

const Categories: React.FC = () => {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <h1>Categories</h1>
        <CategoriesBody />
      </main>
    </div>
  );
};

export default Categories;
