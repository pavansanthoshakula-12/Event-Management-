export default function Pagination({ pagination, onChange }) {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages, total } = pagination;
  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="pagination-info">
        Page {page} of {pages} ({total} total)
      </span>
      <div className="pagination-buttons">
        <button type="button" className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </button>
        <button type="button" className="btn btn-outline btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next
        </button>
      </div>
    </nav>
  );
}
