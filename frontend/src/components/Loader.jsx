// Loading indicator. `page` makes it fill the screen (used while checking the saved login).
export default function Loader({ text = "Loading...", page = false }) {
  return (
    <div className={page ? "loader loader-page" : "loader"} role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
