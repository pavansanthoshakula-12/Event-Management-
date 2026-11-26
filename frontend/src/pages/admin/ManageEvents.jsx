import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as eventService from "../../services/eventService";
import useToast from "../../hooks/useToast";
import useDebounce from "../../hooks/useDebounce";
import PageHeader from "../../components/PageHeader";
import FilterBar from "../../components/FilterBar";
import DataTable from "../../components/DataTable";
import Pagination from "../../components/Pagination";
import StatusBadge from "../../components/StatusBadge";
import ErrorMessage from "../../components/ErrorMessage";
import ConfirmDialog from "../../components/ConfirmDialog";
import { CATEGORIES, EVENT_STATUSES } from "../../utils/constants";
import { formatDate, formatTime, getErrorMessage } from "../../utils/format";

const emptyFilters = { category: "", status: "", dateFrom: "", dateTo: "" };

export default function ManageEvents() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Reload whenever a filter, the page, or reloadKey changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    eventService
      .getEvents({ search: debouncedSearch, ...filters, page, limit: 10 })
      .then((res) => {
        if (cancelled) return;
        setEvents(res.data);
        setPagination(res.pagination);
        setError("");
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, filters, page, reloadKey]);

  const handleFilterChange = (name, value) => {
    setFilters((f) => ({ ...f, [name]: value }));
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setFilters(emptyFilters);
    setPage(1);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await eventService.deleteEvent(deleteTarget._id);
      showToast(res.message);
      setDeleteTarget(null);
      if (events.length === 1 && page > 1) setPage(page - 1);
      else setReloadKey((k) => k + 1);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Manage events"
        subtitle="Create, edit and remove events."
        actions={
          <Link to="/admin/events/new" className="btn btn-primary">
            Add event
          </Link>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search by title"
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        filters={[
          {
            name: "category",
            label: "Category",
            type: "select",
            value: filters.category,
            options: [{ value: "", label: "All categories" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))],
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            value: filters.status,
            options: [{ value: "", label: "All statuses" }, ...EVENT_STATUSES.map((s) => ({ value: s, label: s }))],
          },
          { name: "dateFrom", label: "From date", type: "date", value: filters.dateFrom },
          { name: "dateTo", label: "To date", type: "date", value: filters.dateTo },
        ]}
      />

      <ErrorMessage message={error} onRetry={() => setReloadKey((k) => k + 1)} />

      <div className="card card-flush">
        <DataTable
          loading={loading}
          rows={events}
          emptyTitle="No events found"
          emptyText="Try different filters, or add a new event."
          columns={[
            {
              header: "Event",
              render: (e) => (
                <>
                  <Link to={`/admin/events/${e._id}`} className="table-link">
                    {e.title}
                  </Link>
                  <small className="block muted">{e.category}</small>
                </>
              ),
            },
            {
              header: "When",
              render: (e) => (
                <>
                  {formatDate(e.eventDate)}
                  <small className="block muted">
                    {formatTime(e.startTime)} to {formatTime(e.endTime)}
                  </small>
                </>
              ),
            },
            { header: "Venue", render: (e) => e.venue },
            { header: "Seats", render: (e) => `${e.registeredCount} / ${e.maxParticipants}` },
            { header: "Status", render: (e) => <StatusBadge status={e.status} /> },
            {
              header: "Actions",
              className: "col-actions",
              render: (e) => (
                <div className="row-actions">
                  <Link to={`/admin/events/${e._id}`} className="btn btn-ghost btn-sm">
                    View
                  </Link>
                  <Link to={`/admin/events/${e._id}/edit`} className="btn btn-outline btn-sm">
                    Edit
                  </Link>
                  <button type="button" className="btn btn-danger-outline btn-sm" onClick={() => setDeleteTarget(e)}>
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>
      <Pagination pagination={pagination} onChange={setPage} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        danger
        title="Delete this event?"
        confirmText="Delete event"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        message={
          deleteTarget && (
            <>
              <p>
                <strong>{deleteTarget.title}</strong> will be removed permanently.
              </p>
              <p className="muted">
                Events that have registration records are never deleted, so no registration data is lost. For those, set the status to
                Cancelled instead.
                {deleteTarget.registeredCount > 0 &&
                  ` This event currently holds ${deleteTarget.registeredCount} active registration(s), so deleting it will be refused.`}
              </p>
            </>
          )
        }
      />
    </>
  );
}
