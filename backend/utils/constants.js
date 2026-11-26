// Shared values used by models, validators and controllers.
export const ROLES = { ADMIN: "admin", STUDENT: "student" };

export const EVENT_CATEGORIES = [
  "Technical",
  "Cultural",
  "Sports",
  "Workshop",
  "Seminar",
  "Academic",
  "Other",
];

export const EVENT_STATUSES = ["Upcoming", "Ongoing", "Completed", "Cancelled"];

export const REGISTRATION_STATUSES = ["Pending", "Approved", "Rejected", "Cancelled"];

// Registrations in these statuses occupy a seat in the event.
export const ACTIVE_REGISTRATION_STATUSES = ["Pending", "Approved"];
