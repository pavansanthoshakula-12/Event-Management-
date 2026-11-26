import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Brand from "../components/Brand";

// A decorative month grid built from today's real date.
function MonthGrid() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const marked = { 4: "a", 9: "b", 13: "c", 18: "a", 22: "b", 27: "c" };

  return (
    <div className="month-grid" aria-hidden="true">
      <div className="month-title">{now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</div>
      <div className="month-days">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="month-dow">
            {d}
          </span>
        ))}
        {cells.map((d, i) => (
          <span key={i} className={`month-cell ${d === now.getDate() ? "month-today" : ""} ${d && marked[d] ? `month-mark-${marked[d]}` : ""}`}>
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const home = user?.role === "admin" ? "/admin" : "/student";

  return (
    <div className="landing">
      <header className="landing-header">
        <Brand />
        <nav className="landing-nav">
          {user ? (
            <Link to={home} className="btn btn-primary btn-sm">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="hero">
        <div className="hero-text">
          <h1>Find a college event. Take a seat before it fills up.</h1>
          <p>
            Workshops, fests, seminars and sports days from every department, in one place. Sign up with your roll
            number, register in two clicks and track the status of each request.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to={home} className="btn btn-primary">
                Go to your dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary">
                  Create a student account
                </Link>
                <Link to="/login" className="btn btn-outline">
                  I already have an account
                </Link>
              </>
            )}
          </div>
        </div>
        <MonthGrid />
      </section>

      <section className="landing-section">
        <div className="landing-columns">
          <div>
            <h2>For students</h2>
            <p>
              Browse upcoming events, filter by category or date, and register. Your seat is held the moment you
              register, and you can withdraw while the event is still ahead.
            </p>
          </div>
          <div>
            <h2>For organizers</h2>
            <p>
              Publish events, set a capacity and a deadline, and approve or reject requests. Seat counts update on
              their own, so an event can never be overbooked.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-section landing-steps">
        <h2>How it works</h2>
        <ol>
          <li>
            <strong>Create your account.</strong> Use your college email and roll number.
          </li>
          <li>
            <strong>Pick an event.</strong> Check the date, venue and how many seats are left.
          </li>
          <li>
            <strong>Register and watch the status.</strong> Pending, Approved, Rejected or Cancelled, always visible under My registrations.
          </li>
        </ol>
      </section>

      <footer className="footer">Campus Events &middot; College Event Management System</footer>
    </div>
  );
}
