import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function StudentLayout() {
  return (
    <div className="student-shell">
      <Navbar />
      <main className="page page-wide">
        <Outlet />
      </main>
      <footer className="footer">Campus Events &middot; College Event Management System</footer>
    </div>
  );
}
