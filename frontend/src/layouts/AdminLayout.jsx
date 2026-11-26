import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="admin-shell">
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}
      <div className="admin-main">
        <div className="admin-topbar">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(true)} aria-label="Open menu">
            Menu
          </button>
          <strong>Admin panel</strong>
        </div>
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
