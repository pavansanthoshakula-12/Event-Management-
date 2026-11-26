import { Link } from "react-router-dom";
import { formatDate, formatTime } from "../utils/format";
import StatusBadge from "./StatusBadge";
import SeatMeter from "./SeatMeter";
import RegisterButton from "./RegisterButton";

// Card used on the student dashboard and Browse events page.
export default function EventCard({ event, detailsPath, onChanged }) {
  return (
    <article className="event-card">
      <div className="event-card-top">
        <span className="chip">{event.category}</span>
        <StatusBadge status={event.status} />
      </div>
      <h3 className="event-card-title">
        <Link to={detailsPath}>{event.title}</Link>
      </h3>
      <dl className="event-meta">
        <div>
          <dt>Date</dt>
          <dd>{formatDate(event.eventDate)}</dd>
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
      </dl>
      <SeatMeter taken={event.registeredCount} max={event.maxParticipants} />
      <div className="event-card-actions">
        <Link to={detailsPath} className="btn btn-ghost btn-sm">
          View details
        </Link>
        <RegisterButton event={event} onChanged={onChanged} />
      </div>
    </article>
  );
}
