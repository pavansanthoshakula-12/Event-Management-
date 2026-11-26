import { useState } from "react";
import * as authService from "../../services/authService";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import PageHeader from "../../components/PageHeader";
import FormField from "../../components/FormField";
import ErrorMessage from "../../components/ErrorMessage";
import { YEARS } from "../../utils/constants";
import { formatDate, getErrorMessage, getFieldErrors } from "../../utils/format";

export default function Profile() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: user.name, department: user.department, yearOfStudy: String(user.yearOfStudy) });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    if (form.name.trim().length < 2) found.name = "Enter your full name";
    if (form.department.trim().length < 2) found.department = "Department is required";
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    setServerError("");
    try {
      const res = await authService.updateProfile({
        name: form.name.trim(),
        department: form.department.trim(),
        yearOfStudy: Number(form.yearOfStudy),
      });
      setUser(res.data);
      showToast(res.message);
    } catch (err) {
      setServerError(getErrorMessage(err));
      setErrors(getFieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="My profile" subtitle="Your email and roll number are fixed. Ask an administrator if they need to change." />
      <ErrorMessage message={serverError} />
      <form className="card form-grid" onSubmit={handleSubmit} noValidate>
        <FormField label="Full name" htmlFor="name" error={errors.name} className="span-2">
          <input id="name" name="name" value={form.name} onChange={handleChange} />
        </FormField>
        <FormField label="Email" htmlFor="email">
          <input id="email" value={user.email} disabled />
        </FormField>
        <FormField label="Roll number" htmlFor="roll">
          <input id="roll" value={user.rollNumber} disabled />
        </FormField>
        <FormField label="Department" htmlFor="department" error={errors.department}>
          <input id="department" name="department" value={form.department} onChange={handleChange} />
        </FormField>
        <FormField label="Year of study" htmlFor="yearOfStudy" error={errors.yearOfStudy}>
          <select id="yearOfStudy" name="yearOfStudy" value={form.yearOfStudy} onChange={handleChange}>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </FormField>
        <p className="muted span-2">Member since {formatDate(user.createdAt)}</p>
        <div className="form-actions span-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </>
  );
}
