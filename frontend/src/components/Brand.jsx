import { Link } from "react-router-dom";

export default function Brand({ to = "/" }) {
  return (
    <Link to={to} className="brand">
      <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="#23306b" />
        <rect x="14" y="18" width="36" height="32" rx="5" fill="#f5f1e8" />
        <rect x="14" y="18" width="36" height="9" rx="5" fill="#e0902a" />
        <rect x="22" y="12" width="4" height="12" rx="2" fill="#f5f1e8" />
        <rect x="38" y="12" width="4" height="12" rx="2" fill="#f5f1e8" />
        <rect x="21" y="33" width="8" height="7" rx="1.5" fill="#23306b" />
      </svg>
      <span>Campus Events</span>
    </Link>
  );
}
