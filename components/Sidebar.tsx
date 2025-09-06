import React from "react";
import { Link } from "react-router-dom";
import "../styles/SideBar.css";

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">PharmaTrack</h2>

      <nav className="sidebar-nav">
        <Link to="/dashboard" className="sidebar-link">
          Dashboard
        </Link>
        <Link to="/products" className="sidebar-link">
          Products
        </Link>
        <Link to="/categories" className="sidebar-link">
          Categories
        </Link>
        <Link to="/logout" className="sidebar-link logout">
          Log Out
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
