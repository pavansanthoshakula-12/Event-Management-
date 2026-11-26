import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import FormField from "../components/FormField";
import ErrorMessage from "../components/ErrorMessage";
import Brand from "../components/Brand";
import { YEARS } from "../utils/constants";
import { getErrorMessage, getFieldErrors } from "../utils/format";

const initial = { name: "", email: "", rollNumber: "", department: "", yearOfStudy: "", password: "", confirmPassword: "" };

export default function Register() {
  const { user, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace />;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const validate = () => {
    const found = {};
    if (form.name.trim().length < 2) found.name = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) found.email = "Enter a valid email address";
    if (!form.rollNumber.trim()) found.rollNumber = "Roll number is required";
    if (form.department.trim().length < 2) found.department = "Department is required";
    if (!form.yearOfStudy) found.yearOfStudy = "Choose your year of study";
    if (form.password.length < 8) found.password = "Use at least 8 characters";
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) found.password = "Include at least one letter and one number";
    if (form.confirmPassword !== form.password) found.confirmPassword = "Passwords do not match";
    return found;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setServerError("");
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        rollNumber: form.rollNumber.trim(),
        department: form.department.trim(),
        yearOfStudy: Number(form.yearOfStudy),
        password: form.password,
      });
      showToast("Account created. Welcome aboard!");
      navigate("/student", { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
      setErrors(getFieldErrors(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <Brand />
        <h1>Create a student account</h1>
        <ErrorMessage message={serverError} />
        <form onSubmit={handleSubmit} noValidate className="form-grid">
          <FormField label="Full name" htmlFor="name" error={errors.name} className="span-2">
            <input id="name" name="name" autoComplete="name" value={form.name} onChange={handleChange} />
          </FormField>
          <FormField label="Email" htmlFor="email" error={errors.email} className="span-2">
            <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} />
          </FormField>
          <FormField label="Roll number" htmlFor="rollNumber" error={errors.rollNumber}>
            <input id="rollNumber" name="rollNumber" value={form.rollNumber} onChange={handleChange} />
          </FormField>
          <FormField label="Department" htmlFor="department" error={errors.department}>
            <input id="department" name="department" value={form.department} onChange={handleChange} />
          </FormField>
          <FormField label="Year of study" htmlFor="yearOfStudy" error={errors.yearOfStudy} className="span-2">
            <select id="yearOfStudy" name="yearOfStudy" value={form.yearOfStudy} onChange={handleChange}>
              <option value="">Choose year</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters with a letter and a number">
            <input id="password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={handleChange} />
          </FormField>
          <FormField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword}>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
            />
          </FormField>
          <div className="span-2">
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </div>
        </form>
        <p className="auth-switch">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
