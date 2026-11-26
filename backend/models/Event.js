import mongoose from "mongoose";
import { EVENT_CATEGORIES, EVENT_STATUSES } from "../utils/constants.js";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:MM (24-hour)

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [120, "Title cannot be longer than 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot be longer than 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: { values: EVENT_CATEGORIES, message: "Invalid category" },
    },
    eventDate: { type: Date, required: [true, "Event date is required"] },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [timeRegex, "Start time must be in HH:MM format"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [timeRegex, "End time must be in HH:MM format"],
    },
    venue: { type: String, required: [true, "Venue is required"], trim: true, maxlength: 150 },
    organizer: {
      type: String,
      required: [true, "Organizer is required"],
      trim: true,
      maxlength: 100,
    },
    registrationDeadline: { type: Date, required: [true, "Registration deadline is required"] },
    maxParticipants: {
      type: Number,
      required: [true, "Maximum participants is required"],
      min: [1, "Maximum participants must be at least 1"],
      validate: { validator: Number.isInteger, message: "Maximum participants must be a whole number" },
    },
    // Number of seats currently held (Pending + Approved registrations).
    // Only changed with atomic $inc operations in the registration controller.
    registeredCount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: { values: EVENT_STATUSES, message: "Invalid event status" },
      default: "Upcoming",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Cross-field check for documents created with Event.create()
eventSchema.pre("validate", function () {
  if (this.startTime && this.endTime && this.endTime <= this.startTime) {
    this.invalidate("endTime", "End time must be later than start time");
  }
});

eventSchema.index({ title: 1 });
eventSchema.index({ eventDate: 1 });
eventSchema.index({ status: 1, eventDate: 1 });
eventSchema.index({ category: 1 });

export default mongoose.model("Event", eventSchema);
