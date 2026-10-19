import { NavLink } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  const menuItems = [
    { path: "/", label: "Dashboard", icon: "⌂" },
    { path: "/organs", label: "Organs", icon: "♡" },
    { path: "/recipients", label: "Recipients", icon: "♙" },
    { path: "/hospitals", label: "Hospitals", icon: "⌂" },
    { path: "/matching", label: "Matching", icon: "⇄" },
    { path: "/transport", label: "Transport", icon: "➜" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">IT</div>

        <div>
          <h2>IntelliTransplant</h2>
          <span>AI Coordination</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-title">MAIN MENU</p>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="system-status">
          <span className="status-dot"></span>
          <div>
            <strong>System Online</strong>
            <small>AI engines ready</small>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;