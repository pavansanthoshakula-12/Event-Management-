import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as eventService from "../../services/eventService";
import * as registrationService from "../../services/registrationService";
import useAuth from "../../hooks/useAuth";
import PageHeader from "../../components/PageHeader";
import EventCard from "../../components/EventCard";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import EmptyState from "../../components/EmptyState";
import { getErrorMessage } from "../../utils/format";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [counts, setCounts] = useState({ Pending: 0, Approved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [eventsRes, regsRes] = await Promise.all([
        eventService.getEvents({ status: "Upcoming", limit: 6 }),
        registrationService.getMyRegistrations({ limit: 100 }),
      ]);
      setEvents(eventsRes.data);
      const next = { Pending: 0, Approved: 0 };
      regsRes.data.forEach((r) => {
        if (next[r.status] !== undefined) next[r.status] += 1;
      });
      setCounts(next);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        subtitle={`${user.department}, year ${user.yearOfStudy} (${user.rollNumber})`}
        actions={
          <Link to="/student/events" className="btn btn-primary">
            Browse all events
          </Link>
        }
      />

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorMessage message={error} onRetry={load} />
      ) : (
        <>
          <div className="stat-grid stat-grid-3">
            <div className="stat-card stat-accent">
              <span className="stat-label">Approved registrations</span>
              <span className="stat-value">{counts.Approved}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Waiting for approval</span>
              <span className="stat-value">{counts.Pending}</span>
            </div>
            <Link to="/student/registrations" className="stat-card stat-link">
              <span className="stat-label">Your registrations</span>
              <span className="stat-note">See every request and its status</span>
            </Link>
          </div>

          <h2 className="section-title">Upcoming events</h2>
          {events.length === 0 ? (
            <EmptyState title="No upcoming events" text="Check back soon. New events appear here as soon as they are published." />
          ) : (
            <div className="card-grid">
              {events.map((e) => (
                <EventCard key={e._id} event={e} detailsPath={`/student/events/${e._id}`} onChanged={load} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
