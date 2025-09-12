import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../../styles/SideBar.css";

// Resolve logo path via Vite
const logoUrl = new URL("../../images/LJ-LOGO.png", import.meta.url).href;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    navigate("/login");
  };
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img src={logoUrl} alt="PharmaTrack" className="sidebar-logo" />
        <h2>PharmaTrack</h2>
      </div>
      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `sidebar-link${isActive ? " active" : ""}`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/products"
          className={({ isActive }) =>
            `sidebar-link${isActive ? " active" : ""}`
          }
        >
          Products
        </NavLink>
        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `sidebar-link${isActive ? " active" : ""}`
          }
        >
          Orders
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `sidebar-link${isActive ? " active" : ""}`
          }
        >
          Profile
        </NavLink>
        <NavLink
          to="/login"
          onClick={(e) => {
            e.preventDefault();
            handleLogout();
          }}
          className="sidebar-link logout"
        >
          Log out
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
