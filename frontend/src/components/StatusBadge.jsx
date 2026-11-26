// Coloured pill for event statuses and registration statuses.
export default function StatusBadge({ status }) {
  if (!status) return null;
  return <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>;
}
