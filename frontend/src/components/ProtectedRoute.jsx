import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Loader from "./Loader";

// <ProtectedRoute role="admin"> lets only admins in; role="student" only students.
export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader page text="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace />;
  }
  return <Outlet />;
}
