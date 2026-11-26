import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { escapeRegex, getPagination, buildPagination } from "../utils/helpers.js";
import { ACTIVE_REGISTRATION_STATUSES } from "../utils/constants.js";

const STUDENT_FIELDS = "name email rollNumber department yearOfStudy";
const EVENT_FIELDS = "title category eventDate startTime endTime venue status registrationDeadline";

const isActive = (status) => ACTIVE_REGISTRATION_STATUSES.includes(status);

const populateReg = (query) => query.populate("student", STUDENT_FIELDS).populate("event", EVENT_FIELDS);

// ---------- Seat helpers (atomic, so concurrent requests can never exceed capacity) ----------

// Takes one seat with a SINGLE atomic update. The capacity check and the increment
// happen together inside MongoDB, so two simultaneous requests cannot both get the last seat.
// mode "student": event must be Upcoming and before its deadline.
// mode "admin":   event must simply not be Cancelled.
const reserveSeat = (eventId, mode) => {
  const filter = { _id: eventId, $expr: { $lt: ["$registeredCount", "$maxParticipants"] } };
  if (mode === "student") {
    filter.status = "Upcoming";
    filter.registrationDeadline = { $gte: new Date() };
  } else {
    filter.status = { $ne: "Cancelled" };
  }
  return Event.findOneAndUpdate(filter, { $inc: { registeredCount: 1 } }, { new: true });
};

const releaseSeat = (eventId) =>
  Event.updateOne({ _id: eventId, registeredCount: { $gt: 0 } }, { $inc: { registeredCount: -1 } });

// Changes a registration's status and keeps the event's seat counter consistent.
const changeStatus = async (reg, newStatus, mode, extraSet = {}) => {
  const wasActive = isActive(reg.status);
  const willBeActive = isActive(newStatus);
  const eventId = reg.event._id || reg.event;

  let reserved = false;
  if (!wasActive && willBeActive) {
    const event = await reserveSeat(eventId, mode);
    if (!event) throw new AppError("Cannot activate this registration: the event is full or cancelled", 409);
    reserved = true;
  }

  // Only update if the status is still what we read (guards against two admins acting at once).
  const updated = await Registration.findOneAndUpdate(
    { _id: reg._id, status: reg.status },
    { $set: { status: newStatus, ...extraSet } },
    { new: true, runValidators: true }
  );

  if (!updated) {
    if (reserved) await releaseSeat(eventId);
    throw new AppError("This registration was changed by someone else. Please refresh and try again.", 409);
  }

  if (wasActive && !willBeActive) await releaseSeat(eventId);
  return updated;
};

// A student may withdraw while the event is not Ongoing/Completed.
const studentCanCancel = (reg) =>
  isActive(reg.status) && reg.event && !["Ongoing", "Completed"].includes(reg.event.status);

const toStudentView = (reg) => {
  const obj = reg.toObject ? reg.toObject() : reg;
  return { ...obj, canCancel: studentCanCancel(reg) };
};

// ---------- Controllers ----------

// POST /api/registrations (student)
export const createRegistration = asyncHandler(async (req, res) => {
  const { eventId, remarks } = req.body;
  const studentId = req.user._id;

  const event = await Event.findById(eventId);
  if (!event) throw new AppError("Event not found", 404);

  // Friendly, specific messages first (the atomic reserve below is the real guard).
  if (event.status === "Cancelled") throw new AppError("This event has been cancelled", 400);
  if (event.status !== "Upcoming") throw new AppError("Registration is closed for this event", 400);
  if (new Date() > event.registrationDeadline) throw new AppError("The registration deadline has passed", 400);
  if (event.registeredCount >= event.maxParticipants) throw new AppError("This event is full", 409);

  const existing = await Registration.findOne({ student: studentId, event: eventId });
  if (existing && isActive(existing.status)) {
    throw new AppError("You are already registered for this event", 409);
  }
  if (existing && existing.status === "Rejected") {
    throw new AppError("Your registration for this event was rejected. Please contact the organizer.", 409);
  }

  const seat = await reserveSeat(eventId, "student");
  if (!seat) throw new AppError("Sorry, this event just filled up or closed for registration", 409);

  let registration;
  try {
    if (existing) {
      // Previously cancelled: re-activate the same record (keeps one record per student+event).
      registration = await Registration.findOneAndUpdate(
        { _id: existing._id, status: "Cancelled" },
        { $set: { status: "Pending", remarks: remarks || "", adminNote: "", registeredAt: new Date() } },
        { new: true }
      );
      if (!registration) throw new AppError("You are already registered for this event", 409);
    } else {
      registration = await Registration.create({ student: studentId, event: eventId, remarks: remarks || "" });
    }
  } catch (error) {
    await releaseSeat(eventId); // give the seat back if saving failed (e.g. duplicate-key race)
    throw error;
  }

  await registration.populate([
    { path: "student", select: STUDENT_FIELDS },
    { path: "event", select: EVENT_FIELDS },
  ]);
  res.status(201).json({
    success: true,
    message: "You have successfully registered for this event",
    data: toStudentView(registration),
  });
});

// GET /api/registrations (admin)
// Query: search (student name / roll / email / event title), status, eventId, page, limit
export const getRegistrations = asyncHandler(async (req, res) => {
  const { search, status, eventId } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (status) filter.status = status;
  if (eventId) filter.event = eventId;

  if (search && search.trim()) {
    const rx = { $regex: escapeRegex(search.trim()), $options: "i" };
    const [users, events] = await Promise.all([
      User.find({ $or: [{ name: rx }, { rollNumber: rx }, { email: rx }] }).select("_id"),
      Event.find({ title: rx }).select("_id"),
    ]);
    filter.$or = [{ student: { $in: users.map((u) => u._id) } }, { event: { $in: events.map((e) => e._id) } }];
  }

  const [registrations, total] = await Promise.all([
    populateReg(Registration.find(filter).sort({ registeredAt: -1 }).skip(skip).limit(limit)),
    Registration.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, data: registrations, pagination: buildPagination(page, limit, total) });
});

// GET /api/registrations/my (student)  Query: search (event title), status, page, limit
export const getMyRegistrations = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = { student: req.user._id };
  if (status) filter.status = status;
  if (typeof search === "string" && search.trim()) {
    const events = await Event.find({ title: { $regex: escapeRegex(search.trim()), $options: "i" } }).select("_id");
    filter.event = { $in: events.map((e) => e._id) };
  }

  const [registrations, total] = await Promise.all([
    populateReg(Registration.find(filter).sort({ registeredAt: -1 }).skip(skip).limit(limit)),
    Registration.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: registrations.map(toStudentView),
    pagination: buildPagination(page, limit, total),
  });
});

// Loads a registration and makes sure the caller is the admin or its owner.
const getAuthorizedRegistration = async (req) => {
  const reg = await populateReg(Registration.findById(req.params.id));
  if (!reg) throw new AppError("Registration not found", 404);

  const isOwner = String(reg.student._id) === String(req.user._id);
  if (req.user.role !== "admin" && !isOwner) {
    throw new AppError("You do not have permission to access this registration", 403);
  }
  return reg;
};

// GET /api/registrations/:id (admin or owner)
export const getRegistrationById = asyncHandler(async (req, res) => {
  const reg = await getAuthorizedRegistration(req);
  res.status(200).json({ success: true, data: req.user.role === "admin" ? reg : toStudentView(reg) });
});

// PUT /api/registrations/:id
//   admin:   may change status, remarks, adminNote
//   student: may change ONLY remarks of their own active registration
export const updateRegistration = asyncHandler(async (req, res) => {
  const reg = await getAuthorizedRegistration(req);
  const { status, remarks, adminNote } = req.body;

  if (req.user.role !== "admin") {
    const forbidden = Object.keys(req.body).filter((key) => key !== "remarks");
    if (forbidden.length > 0) {
      throw new AppError("Students can only update their remarks", 403);
    }
    if (!isActive(reg.status)) throw new AppError("Only active registrations can be edited", 400);

    reg.remarks = remarks ?? reg.remarks;
    await reg.save();
    return res.status(200).json({ success: true, message: "Remarks updated", data: toStudentView(reg) });
  }

  // Admin
  const textUpdates = {};
  if (remarks !== undefined) textUpdates.remarks = remarks;
  if (adminNote !== undefined) textUpdates.adminNote = adminNote;

  let updated;
  if (status && status !== reg.status) {
    updated = await changeStatus(reg, status, "admin", textUpdates);
  } else {
    updated = await Registration.findByIdAndUpdate(reg._id, { $set: textUpdates }, { new: true, runValidators: true });
  }

  updated = await populateReg(Registration.findById(updated._id));
  res.status(200).json({ success: true, message: "Registration updated successfully", data: updated });
});

// PATCH /api/registrations/:id/cancel (student, owner only)
export const cancelMyRegistration = asyncHandler(async (req, res) => {
  const reg = await populateReg(Registration.findById(req.params.id));
  if (!reg) throw new AppError("Registration not found", 404);
  if (String(reg.student._id) !== String(req.user._id)) {
    throw new AppError("You do not have permission to cancel this registration", 403);
  }
  if (!isActive(reg.status)) throw new AppError(`This registration is already ${reg.status.toLowerCase()}`, 400);
  if (!studentCanCancel(reg)) {
    throw new AppError("This registration can no longer be cancelled because the event has started or finished", 400);
  }

  await changeStatus(reg, "Cancelled", "student");
  const updated = await populateReg(Registration.findById(reg._id));
  res.status(200).json({ success: true, message: "Registration cancelled", data: toStudentView(updated) });
});

// DELETE /api/registrations/:id (admin) - permanently removes the record and frees the seat if it held one
export const deleteRegistration = asyncHandler(async (req, res) => {
  const reg = await Registration.findByIdAndDelete(req.params.id);
  if (!reg) throw new AppError("Registration not found", 404);

  if (isActive(reg.status)) await releaseSeat(reg.event);

  res.status(200).json({ success: true, message: "Registration deleted successfully", data: { _id: reg._id } });
});
