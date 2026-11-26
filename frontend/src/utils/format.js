// ---------- Dates and times ----------
// Event dates are stored as a calendar day (UTC midnight), so they are shown in UTC to avoid off-by-one days.
export const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    : "-";

export const formatWeekday = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { weekday: "long", timeZone: "UTC" }) : "";

// "14:30" -> "2:30 PM"
export const formatTime = (hhmm) => {
  if (!hhmm) return "-";
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
};

// Real moments in time (deadlines, registration time) are shown in the viewer's local time zone.
export const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "-";

// For <input type="date">
export const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

// For <input type="datetime-local"> (local time, no seconds)
export const toDateTimeLocal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ---------- Errors ----------
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.request) return "Cannot reach the server. Check that the backend is running.";
  return error.message || "Something went wrong";
};

// Turns the API's [{field, message}] list into { field: message } for forms.
export const getFieldErrors = (error) => {
  const list = error.response?.data?.errors;
  if (!Array.isArray(list)) return {};
  return list.reduce((acc, e) => {
    if (e.field && !acc[e.field]) acc[e.field] = e.message;
    return acc;
  }, {});
};

// ---------- Registration rules shown in the UI (the server enforces them too) ----------
export const ACTIVE_STATUSES = ["Pending", "Approved"];

export const getRegisterState = (event) => {
  if (event.status === "Cancelled") return { canRegister: false, reason: "Event cancelled" };
  if (event.status !== "Upcoming") return { canRegister: false, reason: "Registration closed" };
  if (new Date() > new Date(event.registrationDeadline)) return { canRegister: false, reason: "Deadline passed" };
  if (event.registeredCount >= event.maxParticipants) return { canRegister: false, reason: "Event full" };
  return { canRegister: true, reason: "" };
};

export const canCancelRegistration = (event) =>
  event.myRegistration &&
  ACTIVE_STATUSES.includes(event.myRegistration.status) &&
  !["Ongoing", "Completed"].includes(event.status);
