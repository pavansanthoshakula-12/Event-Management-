import mongoose from "mongoose";
import { REGISTRATION_STATUSES } from "../utils/constants.js";

const registrationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    registeredAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: { values: REGISTRATION_STATUSES, message: "Invalid registration status" },
      default: "Pending",
    },
    remarks: { type: String, trim: true, maxlength: [300, "Remarks cannot exceed 300 characters"], default: "" },
    adminNote: { type: String, trim: true, maxlength: [300, "Admin note cannot exceed 300 characters"], default: "" },
  },
  { timestamps: true }
);

// DATABASE-LEVEL guarantee: one registration per student per event.
registrationSchema.index({ student: 1, event: 1 }, { unique: true });
registrationSchema.index({ event: 1, status: 1 });
registrationSchema.index({ registeredAt: -1 });

export default mongoose.model("Registration", registrationSchema);
