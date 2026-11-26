// Search box + any number of select/date filters.
// filters: [{ name, label, type: "select" | "date", value, options: [{ value, label }] }]
export default function FilterBar({ search, onSearchChange, searchPlaceholder = "Search...", filters = [], onFilterChange, onReset }) {
  return (
    <div className="filter-bar">
      <div className="filter-item filter-search">
        <label htmlFor="filter-search">Search</label>
        <input
          id="filter-search"
          type="search"
          value={search}
          placeholder={searchPlaceholder}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      {filters.map((f) => (
        <div className="filter-item" key={f.name}>
          <label htmlFor={`filter-${f.name}`}>{f.label}</label>
          {f.type === "date" ? (
            <input id={`filter-${f.name}`} type="date" value={f.value} onChange={(e) => onFilterChange(f.name, e.target.value)} />
          ) : (
            <select id={`filter-${f.name}`} value={f.value} onChange={(e) => onFilterChange(f.name, e.target.value)}>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm filter-reset" onClick={onReset}>
        Clear filters
      </button>
    </div>
  );
}
