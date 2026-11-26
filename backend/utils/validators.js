import { body, param, query } from "express-validator";
import {
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  REGISTRATION_STATUSES,
} from "./constants.js";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const HOUR = 60 * 60 * 1000;

// ---------- Shared ----------
export const idParam = param("id").isMongoId().withMessage("Invalid ID format");

// ---------- Auth ----------
export const registerRules = [
  body("name").trim().isLength({ min: 2, max: 60 }).withMessage("Name must be 2 to 60 characters"),
  body("email").trim().toLowerCase().isEmail().withMessage("Please enter a valid email address"),
  body("password")
    .isString()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 72 })
    .withMessage("Password must be 8 to 72 characters")
    .matches(/[A-Za-z]/)
    .withMessage("Password must contain at least one letter")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),
  body("rollNumber").trim().isLength({ min: 1, max: 30 }).withMessage("Roll number is required"),
  body("department").trim().isLength({ min: 2, max: 80 }).withMessage("Department is required"),
  body("yearOfStudy").isInt({ min: 1, max: 6 }).withMessage("Year of study must be between 1 and 6").toInt(),
];

export const loginRules = [
  body("email").trim().toLowerCase().isEmail().withMessage("Please enter a valid email address"),
  body("password").isString().notEmpty().withMessage("Password is required"),
];

export const updateProfileRules = [
  body("name").optional().trim().isLength({ min: 2, max: 60 }).withMessage("Name must be 2 to 60 characters"),
  body("department").optional().trim().isLength({ min: 2, max: 80 }).withMessage("Department must be 2 to 80 characters"),
  body("yearOfStudy").optional().isInt({ min: 1, max: 6 }).withMessage("Year of study must be between 1 and 6").toInt(),
];

// ---------- Events ----------
// Used for both create (POST) and update (PUT). PUT replaces all editable fields.
export const eventRules = [
  body("title").trim().isLength({ min: 3, max: 120 }).withMessage("Title must be 3 to 120 characters"),
  body("description").trim().isLength({ min: 1, max: 2000 }).withMessage("Description is required (max 2000 characters)"),
  body("category").isIn(EVENT_CATEGORIES).withMessage(`Category must be one of: ${EVENT_CATEGORIES.join(", ")}`),
  body("eventDate").isISO8601().withMessage("Event date is required (format YYYY-MM-DD)"),
  body("startTime").matches(timeRegex).withMessage("Start time is required (format HH:MM)"),
  body("endTime")
    .matches(timeRegex)
    .withMessage("End time is required (format HH:MM)")
    .custom((value, { req }) => {
      if (req.body.startTime && value <= req.body.startTime) {
        throw new Error("End time must be later than start time");
      }
      return true;
    }),
  body("venue").trim().isLength({ min: 1, max: 150 }).withMessage("Venue is required"),
  body("organizer").trim().isLength({ min: 1, max: 100 }).withMessage("Organizer is required"),
  body("registrationDeadline")
    .isISO8601()
    .withMessage("Registration deadline is required (ISO date-time)")
    .custom((value, { req }) => {
      const deadline = new Date(value).getTime();
      const eventDay = new Date(req.body.eventDate).getTime();
      // Lenient on purpose (36h) to tolerate time zones; the form checks the exact local day.
      if (!Number.isNaN(eventDay) && deadline > eventDay + 36 * HOUR) {
        throw new Error("Registration deadline cannot be after the event date");
      }
      return true;
    }),
  body("maxParticipants")
    .isInt({ min: 1, max: 100000 })
    .withMessage("Maximum participants must be a whole number between 1 and 100000")
    .toInt(),
  body("status").optional().isIn(EVENT_STATUSES).withMessage(`Status must be one of: ${EVENT_STATUSES.join(", ")}`),
];

const pagingRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
];

export const eventListRules = [
  ...pagingRules,
  query("category").optional({ values: "falsy" }).isIn(EVENT_CATEGORIES).withMessage("Invalid category filter"),
  query("status").optional({ values: "falsy" }).isIn(EVENT_STATUSES).withMessage("Invalid status filter"),
  query("dateFrom").optional({ values: "falsy" }).isISO8601().withMessage("dateFrom must be a valid date"),
  query("dateTo").optional({ values: "falsy" }).isISO8601().withMessage("dateTo must be a valid date"),
  query("sort").optional({ values: "falsy" }).isIn(["asc", "desc"]).withMessage("sort must be asc or desc"),
];

// ---------- Registrations ----------
export const createRegistrationRules = [
  body("eventId").isMongoId().withMessage("A valid eventId is required"),
  body("remarks").optional().isString().trim().isLength({ max: 300 }).withMessage("Remarks cannot exceed 300 characters"),
];

export const updateRegistrationRules = [
  body("status").optional().isIn(REGISTRATION_STATUSES).withMessage(`Status must be one of: ${REGISTRATION_STATUSES.join(", ")}`),
  body("remarks").optional().isString().trim().isLength({ max: 300 }).withMessage("Remarks cannot exceed 300 characters"),
  body("adminNote").optional().isString().trim().isLength({ max: 300 }).withMessage("Admin note cannot exceed 300 characters"),
];

export const registrationListRules = [
  ...pagingRules,
  query("status").optional({ values: "falsy" }).isIn(REGISTRATION_STATUSES).withMessage("Invalid status filter"),
  query("eventId").optional({ values: "falsy" }).isMongoId().withMessage("Invalid eventId filter"),
];
