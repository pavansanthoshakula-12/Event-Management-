import Loader from "./Loader";
import EmptyState from "./EmptyState";

// columns: [{ header, render: (row) => node, className? }]
export default function DataTable({ columns, rows, loading, emptyTitle = "Nothing here yet", emptyText }) {
  if (loading) return <Loader />;
  if (!rows || rows.length === 0) return <EmptyState title={emptyTitle} text={emptyText} />;

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.header} className={c.className}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              {columns.map((c) => (
                <td key={c.header} data-label={c.header} className={c.className}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
