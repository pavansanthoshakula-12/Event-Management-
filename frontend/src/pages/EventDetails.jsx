import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as eventService from "../services/eventService";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import StatusBadge from "../components/StatusBadge";
import SeatMeter from "../components/SeatMeter";
import RegisterButton from "../components/RegisterButton";
import ConfirmDialog from "../components/ConfirmDialog";
import { formatDate, formatDateTime, formatTime, formatWeekday, getErrorMessage } from "../utils/format";

// One details page for both roles. Admins see management actions; students see the register controls.
export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const isAdmin = user.role === "admin";
  const base = isAdmin ? "/admin/events" : "/student/events";

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await eventService.getEvent(id);
      setEvent(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await eventService.deleteEvent(id);
      showToast(res.message);
      navigate("/admin/events");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loader text="Loading event..." />;
  if (error) {
    return (
      <>
        <ErrorMessage message={error} onRetry={load} />
        <Link to={base} className="link">
          Back to events
        </Link>
      </>
    );
  }

  return (
    <>
      <Link to={base} className="link back-link">
        &larr; Back to events
      </Link>

      <article className="card detail">
        <header className="detail-head">
          <div>
            <div className="detail-tags">
              <span className="chip">{event.category}</span>
              <StatusBadge status={event.status} />
            </div>
            <h1>{event.title}</h1>
            <p className="muted">Organized by {event.organizer}</p>
          </div>
          <div className="detail-actions">
            {isAdmin ? (
              <>
                <Link to={`/admin/registrations?eventId=${event._id}`} className="btn btn-ghost btn-sm">
                  View registrations
                </Link>
                <Link to={`/admin/events/${event._id}/edit`} className="btn btn-outline btn-sm">
                  Edit
                </Link>
                <button type="button" className="btn btn-danger-outline btn-sm" onClick={() => setConfirmDelete(true)}>
                  Delete
                </button>
              </>
            ) : (
              <RegisterButton event={event} onChanged={load} />
            )}
          </div>
        </header>

        <dl className="detail-grid">
          <div>
            <dt>Date</dt>
            <dd>
              {formatDate(event.eventDate)}
              <small className="block muted">{formatWeekday(event.eventDate)}</small>
            </dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>
              {formatTime(event.startTime)} to {formatTime(event.endTime)}
            </dd>
          </div>
          <div>
            <dt>Venue</dt>
            <dd>{event.venue}</dd>
          </div>
          <div>
            <dt>Register by</dt>
            <dd>{formatDateTime(event.registrationDeadline)}</dd>
          </div>
          <div>
            <dt>Seats</dt>
            <dd>
              <SeatMeter taken={event.registeredCount} max={event.maxParticipants} />
            </dd>
          </div>
        </dl>

        <section>
          <h2>About this event</h2>
          <p className="prewrap">{event.description}</p>
        </section>
      </article>

      <ConfirmDialog
        open={confirmDelete}
        danger
        title="Delete this event?"
        confirmText="Delete event"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        message={
          <>
            <p>
              <strong>{event.title}</strong> will be removed permanently.
            </p>
            <p className="muted">
              Events with registration records cannot be deleted. Set the status to Cancelled instead to keep the records.
              {event.registeredCount > 0 && ` This event holds ${event.registeredCount} active registration(s), so deleting it will be refused.`}
            </p>
          </>
        }
      />
    </>
  );
}
