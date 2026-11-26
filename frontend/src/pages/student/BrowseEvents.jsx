import { useEffect, useState } from "react";
import * as eventService from "../../services/eventService";
import useDebounce from "../../hooks/useDebounce";
import PageHeader from "../../components/PageHeader";
import FilterBar from "../../components/FilterBar";
import EventCard from "../../components/EventCard";
import Pagination from "../../components/Pagination";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import EmptyState from "../../components/EmptyState";
import { CATEGORIES, EVENT_STATUSES } from "../../utils/constants";
import { getErrorMessage } from "../../utils/format";

const defaultFilters = { category: "", status: "Upcoming", dateFrom: "", dateTo: "" };

export default function BrowseEvents() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    eventService
      .getEvents({ search: debouncedSearch, ...filters, page, limit: 9 })
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

  return (
    <>
      <PageHeader title="Browse events" subtitle="Find something to join." />

      <FilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search by title"
        onFilterChange={(name, value) => {
          setFilters((f) => ({ ...f, [name]: value }));
          setPage(1);
        }}
        onReset={() => {
          setSearch("");
          setFilters(defaultFilters);
          setPage(1);
        }}
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

      {loading ? (
        <Loader />
      ) : events.length === 0 ? (
        <EmptyState title="No events match your search" text="Try removing a filter or searching for a different title." />
      ) : (
        <div className="card-grid">
          {events.map((e) => (
            <EventCard key={e._id} event={e} detailsPath={`/student/events/${e._id}`} onChanged={() => setReloadKey((k) => k + 1)} />
          ))}
        </div>
      )}
      <Pagination pagination={pagination} onChange={setPage} />
    </>
  );
}
