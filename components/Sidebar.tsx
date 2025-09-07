import React from "react";
import { Link } from "react-router-dom";
import "../styles/SideBar.css";
import logo from "../images/LJ-LOGO.png";

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="PharmaTrack" className="sidebar-logo" />
        <h2 className="sidebar-title">PharmaTrack</h2>
      </div>

      <nav className="sidebar-nav">
        <Link to="/dashboard" className="sidebar-link">
          Dashboard
        </Link>
        <Link to="/products" className="sidebar-link">
          Products
        </Link>
        <Link to="/orders" className="sidebar-link">
          Orders
        </Link>
        <Link to="/profile" className="sidebar-link">
          Profile
        </Link>
        <Link to="/login" className="sidebar-link logout">
          Log Out
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
