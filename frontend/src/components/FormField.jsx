// Label + input + error message. Pass the actual <input>/<select>/<textarea> as children.
export default function FormField({ label, htmlFor, error, hint, children, className = "" }) {
  return (
    <div className={`field ${error ? "field-invalid" : ""} ${className}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && !error && <small className="hint">{hint}</small>}
      {error && (
        <small className="error-text" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
