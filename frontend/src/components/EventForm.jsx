import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormField from "./FormField";
import { CATEGORIES, EVENT_STATUSES } from "../utils/constants";
import { toDateInput, toDateTimeLocal } from "../utils/format";

const emptyValues = {
  title: "",
  description: "",
  category: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  venue: "",
  organizer: "",
  registrationDeadline: "",
  maxParticipants: "",
  status: "Upcoming",
};

// Converts an event from the API into form values.
const toFormValues = (event) => ({
  title: event.title,
  description: event.description,
  category: event.category,
  eventDate: toDateInput(event.eventDate),
  startTime: event.startTime,
  endTime: event.endTime,
  venue: event.venue,
  organizer: event.organizer,
  registrationDeadline: toDateTimeLocal(event.registrationDeadline),
  maxParticipants: String(event.maxParticipants),
  status: event.status,
});

// Browser-side validation (the server validates again).
const validate = (v) => {
  const errors = {};
  if (v.title.trim().length < 3) errors.title = "Title must be at least 3 characters";
  if (!v.description.trim()) errors.description = "Description is required";
  if (!v.category) errors.category = "Choose a category";
  if (!v.eventDate) errors.eventDate = "Event date is required";
  if (!v.startTime) errors.startTime = "Start time is required";
  if (!v.endTime) errors.endTime = "End time is required";
  if (v.startTime && v.endTime && v.endTime <= v.startTime) errors.endTime = "End time must be later than start time";
  if (!v.venue.trim()) errors.venue = "Venue is required";
  if (!v.organizer.trim()) errors.organizer = "Organizer is required";
  if (!v.registrationDeadline) errors.registrationDeadline = "Registration deadline is required";
  else if (v.eventDate && v.registrationDeadline.slice(0, 10) > v.eventDate) {
    errors.registrationDeadline = "Deadline cannot be after the event date";
  }
  const max = Number(v.maxParticipants);
  if (!v.maxParticipants || !Number.isInteger(max) || max < 1) errors.maxParticipants = "Enter a whole number of 1 or more";
  return errors;
};

// Shared by "Add event" and "Edit event".
// Props: initialEvent (for editing), onSubmit(payload), submitting, submitLabel, serverErrors ({field: message}), registeredCount
export default function EventForm({ initialEvent, onSubmit, submitting, submitLabel, serverErrors = {} }) {
  const navigate = useNavigate();
  const [values, setValues] = useState(initialEvent ? toFormValues(initialEvent) : emptyValues);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category,
      eventDate: values.eventDate,
      startTime: values.startTime,
      endTime: values.endTime,
      venue: values.venue.trim(),
      organizer: values.organizer.trim(),
      // datetime-local has no time zone, so convert it to a real UTC moment before sending
      registrationDeadline: new Date(values.registrationDeadline).toISOString(),
      maxParticipants: Number(values.maxParticipants),
      status: values.status,
    });
  };

  const err = (name) => errors[name] || serverErrors[name];
  const taken = initialEvent?.registeredCount ?? 0;

  return (
    <form className="card form-grid" onSubmit={handleSubmit} noValidate>
      <FormField label="Event title" htmlFor="title" error={err("title")} className="span-2">
        <input id="title" name="title" value={values.title} onChange={handleChange} maxLength={120} />
      </FormField>

      <FormField label="Description" htmlFor="description" error={err("description")} className="span-2">
        <textarea id="description" name="description" rows={5} value={values.description} onChange={handleChange} maxLength={2000} />
      </FormField>

      <FormField label="Category" htmlFor="category" error={err("category")}>
        <select id="category" name="category" value={values.category} onChange={handleChange}>
          <option value="">Choose a category</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Status" htmlFor="status" error={err("status")}>
        <select id="status" name="status" value={values.status} onChange={handleChange}>
          {EVENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Event date" htmlFor="eventDate" error={err("eventDate")}>
        <input id="eventDate" name="eventDate" type="date" value={values.eventDate} onChange={handleChange} />
      </FormField>

      <FormField label="Registration deadline" htmlFor="registrationDeadline" error={err("registrationDeadline")}>
        <input
          id="registrationDeadline"
          name="registrationDeadline"
          type="datetime-local"
          value={values.registrationDeadline}
          onChange={handleChange}
        />
      </FormField>

      <FormField label="Start time" htmlFor="startTime" error={err("startTime")}>
        <input id="startTime" name="startTime" type="time" value={values.startTime} onChange={handleChange} />
      </FormField>

      <FormField label="End time" htmlFor="endTime" error={err("endTime")}>
        <input id="endTime" name="endTime" type="time" value={values.endTime} onChange={handleChange} />
      </FormField>

      <FormField label="Venue" htmlFor="venue" error={err("venue")}>
        <input id="venue" name="venue" value={values.venue} onChange={handleChange} maxLength={150} />
      </FormField>

      <FormField label="Organizer" htmlFor="organizer" error={err("organizer")}>
        <input id="organizer" name="organizer" value={values.organizer} onChange={handleChange} maxLength={100} />
      </FormField>

      <FormField
        label="Maximum participants"
        htmlFor="maxParticipants"
        error={err("maxParticipants")}
        hint={initialEvent ? `${taken} seat(s) are currently taken. You cannot go below that.` : undefined}
      >
        <input
          id="maxParticipants"
          name="maxParticipants"
          type="number"
          min={Math.max(taken, 1)}
          value={values.maxParticipants}
          onChange={handleChange}
        />
      </FormField>

      <div className="form-actions span-2">
        <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
