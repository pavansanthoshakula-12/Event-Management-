import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import StudentLayout from "./layouts/StudentLayout";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import EventDetails from "./pages/EventDetails";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageEvents from "./pages/admin/ManageEvents";
import AddEvent from "./pages/admin/AddEvent";
import EditEvent from "./pages/admin/EditEvent";
import ManageRegistrations from "./pages/admin/ManageRegistrations";

import StudentDashboard from "./pages/student/StudentDashboard";
import BrowseEvents from "./pages/student/BrowseEvents";
import MyRegistrations from "./pages/student/MyRegistrations";
import Profile from "./pages/student/Profile";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin only */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="events" element={<ManageEvents />} />
          <Route path="events/new" element={<AddEvent />} />
          <Route path="events/:id" element={<EventDetails />} />
          <Route path="events/:id/edit" element={<EditEvent />} />
          <Route path="registrations" element={<ManageRegistrations />} />
        </Route>
      </Route>

      {/* Student only */}
      <Route element={<ProtectedRoute role="student" />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="events" element={<BrowseEvents />} />
          <Route path="events/:id" element={<EventDetails />} />
          <Route path="registrations" element={<MyRegistrations />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
