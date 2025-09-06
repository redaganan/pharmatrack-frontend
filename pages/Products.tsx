import React from "react";
import Sidebar from "../components/Sidebar";
import ProductsBody from "../components/ProductsBody";
import "../styles/DashBoard.css";

const Products: React.FC = () => {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <h1>Products</h1>
        <ProductsBody />
      </main>
    </div>
  );
};

export default Products;
