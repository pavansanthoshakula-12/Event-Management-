import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as eventService from "../../services/eventService";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/EmptyState";
import { formatDate, formatDateTime, getErrorMessage } from "../../utils/format";

function StatCard({ label, value, note, tone }) {
  return (
    <div className={`stat-card ${tone ? `stat-${tone}` : ""}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {note && <span className="stat-note">{note}</span>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await eventService.getDashboardStats();
      setStats(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loader text="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="A quick look at events and registrations."
        actions={
          <Link to="/admin/events/new" className="btn btn-primary">
            Add event
          </Link>
        }
      />

      <div className="stat-grid">
        <StatCard label="Total events" value={stats.totalEvents} note={`${stats.cancelledEvents} cancelled`} />
        <StatCard label="Student registrations" value={stats.totalRegistrations} note={`${stats.pendingRegistrations} waiting for review`} tone="accent" />
        <StatCard label="Upcoming events" value={stats.upcomingEvents} />
        <StatCard label="Completed events" value={stats.completedEvents} />
      </div>

      <div className="two-col">
        <section className="card">
          <div className="card-head">
            <h2>Recent registrations</h2>
            <Link to="/admin/registrations" className="link">
              View all
            </Link>
          </div>
          <DataTable
            rows={stats.recentRegistrations}
            emptyTitle="No registrations yet"
            emptyText="They will appear here as students sign up for events."
            columns={[
              {
                header: "Student",
                render: (r) => (
                  <>
                    <strong>{r.student?.name}</strong>
                    <small className="block muted">{r.student?.rollNumber}</small>
                  </>
                ),
              },
              { header: "Event", render: (r) => r.event?.title },
              { header: "Registered", render: (r) => formatDateTime(r.registeredAt) },
              { header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Next upcoming events</h2>
            <Link to="/admin/events" className="link">
              Manage
            </Link>
          </div>
          {stats.upcomingList.length === 0 ? (
            <EmptyState title="No upcoming events" text="Create an event to get started." />
          ) : (
            <ul className="plain-list">
              {stats.upcomingList.map((e) => (
                <li key={e._id}>
                  <Link to={`/admin/events/${e._id}`}>
                    <strong>{e.title}</strong>
                  </Link>
                  <small className="block muted">
                    {formatDate(e.eventDate)} &middot; {e.venue} &middot; {e.registeredCount}/{e.maxParticipants} seats taken
                  </small>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
