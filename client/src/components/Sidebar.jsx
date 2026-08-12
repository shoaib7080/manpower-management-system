import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LEGEND = [
  ["var(--gray)", "Available"],
  ["var(--teal-light)", "Reserved"],
  ["var(--teal)", "Booked · Locked"],
  ["var(--green)", "Mobilized · Locked"],
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <div className="sidebar">
      <div className="brand">
        <div className="brand-mark">MP</div>
        <div className="brand-text">
          MANPOWER OPS
          <span>Mobilisation Control</span>
        </div>
      </div>

      <NavLink
        to="/directory"
        className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
      >
        Personnel Directory
      </NavLink>
      <NavLink
        to="/job-orders"
        className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
      >
        Job Orders
      </NavLink>
      <NavLink
        to="/audit-log"
        className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
      >
        Audit Trail
      </NavLink>

      {user?.level === 1 && (
        <>
          <NavLink
            to="/users"
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            User Management
          </NavLink>
          <NavLink
            to="/specializations"
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            Specializations
          </NavLink>
        </>
      )}

      <div className="sidebar-footer">
        <div className="pipeline-legend">Mobilisation Pipeline</div>
        {LEGEND.map(([color, label]) => (
          <div className="legend-row" key={label}>
            <span className="legend-dot" style={{ background: color }} />
            {label}
          </div>
        ))}
        {user && (
          <button
            onClick={logout}
            className="nav-item"
            style={{
              marginTop: 12,
              width: "100%",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--steel-300)",
            }}
          >
            <span className="ic">⏻</span> Sign Out
          </button>
        )}
      </div>
    </div>
  );
}
