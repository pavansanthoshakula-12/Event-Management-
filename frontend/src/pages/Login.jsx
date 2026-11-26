import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import FormField from "../components/FormField";
import ErrorMessage from "../components/ErrorMessage";
import Brand from "../components/Brand";
import { getErrorMessage } from "../utils/format";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already logged in? Go straight to the right dashboard.
  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace />;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) found.email = "Enter a valid email address";
    if (!form.password) found.password = "Enter your password";
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setServerError("");
    try {
      const loggedIn = await login(form.email.trim(), form.password);
      const home = loggedIn.role === "admin" ? "/admin" : "/student";
      const from = location.state?.from;
      navigate(from && from.startsWith(home) ? from : home, { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Brand />
        <h1>Log in</h1>
        <p className="muted">Students and administrators use the same form.</p>
        <ErrorMessage message={serverError} />
        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Email" htmlFor="email" error={errors.email}>
            <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} />
          </FormField>
          <FormField label="Password" htmlFor="password" error={errors.password}>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
            />
          </FormField>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>
        <p className="auth-switch">
          New student? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
