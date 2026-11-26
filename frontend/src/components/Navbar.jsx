import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Brand from "./Brand";

// Top navigation for the student area.
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const close = () => setOpen(false);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Brand to="/student" />
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="student-nav"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Menu"}
        </button>
        <nav id="student-nav" className={`nav-links ${open ? "nav-open" : ""}`}>
          <NavLink to="/student" end onClick={close}>
            Dashboard
          </NavLink>
          <NavLink to="/student/events" onClick={close}>
            Browse events
          </NavLink>
          <NavLink to="/student/registrations" onClick={close}>
            My registrations
          </NavLink>
          <NavLink to="/student/profile" onClick={close}>
            Profile
          </NavLink>
          <div className="nav-user">
            <span>{user?.name}</span>
            <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
