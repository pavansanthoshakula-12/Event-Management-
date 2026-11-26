import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Brand from "./Brand";

// Left navigation for the admin area. On small screens it slides in (open is controlled by AdminLayout).
export default function Sidebar({ open, onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`} aria-label="Admin navigation">
      <div className="sidebar-brand">
        <Brand to="/admin" />
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/admin" end onClick={onNavigate}>
          Dashboard
        </NavLink>
        <NavLink to="/admin/events" end onClick={onNavigate}>
          Manage events
        </NavLink>
        <NavLink to="/admin/events/new" onClick={onNavigate}>
          Add event
        </NavLink>
        <NavLink to="/admin/registrations" onClick={onNavigate}>
          Registrations
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <strong>{user?.name}</strong>
          <small>{user?.email}</small>
        </div>
        <button type="button" className="btn btn-outline-light btn-sm" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </aside>
  );
}
