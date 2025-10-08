import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../../styles/SideBar.css";

// Resolve logo path via Vite
const logoUrl = new URL("../../images/LJ-LOGO.png", import.meta.url).href;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const handleLogout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    navigate("/login");
  };
  const handleNavigate = () => setOpen(false);
  return (
    <div className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-header">
        <img src={logoUrl} alt="PharmaTrack" className="sidebar-logo" />
        <h2>PharmaTrack</h2>
        <button
          className="sidebar-hamburger"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
      </div>
      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `sidebar-link${isActive ? " active" : ""}`
          }
          onClick={handleNavigate}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/products"
          className={({ isActive }) =>
            `sidebar-link${isActive ? " active" : ""}`
          }
          onClick={handleNavigate}
        >
          Products
        </NavLink>
        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `sidebar-link${isActive ? " active" : ""}`
          }
          onClick={handleNavigate}
        >
          Orders
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) =>
            `sidebar-link${isActive ? " active" : ""}`
          }
          onClick={handleNavigate}
        >
          History
        </NavLink>
        <NavLink
          to="/categories"
          className={({ isActive }) =>
            `sidebar-link${isActive ? " active" : ""}`
          }
          onClick={handleNavigate}
        >
          Categories
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `sidebar-link${isActive ? " active" : ""}`
          }
          onClick={handleNavigate}
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
      {/* Mobile drawer overlay */}
      <div
        className={`sidebar-drawer ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      >
        <div
          className="sidebar-drawer-panel"
          onClick={(e) => e.stopPropagation()}
        >
          <nav className="sidebar-drawer-nav">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `sidebar-link${isActive ? " active" : ""}`
              }
              onClick={handleNavigate}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `sidebar-link${isActive ? " active" : ""}`
              }
              onClick={handleNavigate}
            >
              Products
            </NavLink>
            <NavLink
              to="/orders"
              className={({ isActive }) =>
                `sidebar-link${isActive ? " active" : ""}`
              }
              onClick={handleNavigate}
            >
              Orders
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `sidebar-link${isActive ? " active" : ""}`
              }
              onClick={handleNavigate}
            >
              History
            </NavLink>
            <NavLink
              to="/categories"
              className={({ isActive }) =>
                `sidebar-link${isActive ? " active" : ""}`
              }
              onClick={handleNavigate}
            >
              Categories
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `sidebar-link${isActive ? " active" : ""}`
              }
              onClick={handleNavigate}
            >
              Profile
            </NavLink>
            <button className="sidebar-link logout" onClick={handleLogout}>
              Log out
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
