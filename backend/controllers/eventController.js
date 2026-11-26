import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { escapeRegex, getPagination, buildPagination } from "../utils/helpers.js";
import { ACTIVE_REGISTRATION_STATUSES } from "../utils/constants.js";

// Only these fields may be set from the request body (blocks mass-assignment of registeredCount, createdBy...).
const EDITABLE_FIELDS = [
  "title",
  "description",
  "category",
  "eventDate",
  "startTime",
  "endTime",
  "venue",
  "organizer",
  "registrationDeadline",
  "maxParticipants",
  "status",
];

const pickEditable = (body) =>
  EDITABLE_FIELDS.reduce((acc, key) => {
    if (body[key] !== undefined) acc[key] = body[key];
    return acc;
  }, {});

// For student requests: adds `myRegistration` ({ _id, status } or null) to each event.
const attachMyRegistration = async (events, user) => {
  if (user.role !== "student" || events.length === 0) {
    return events.map((e) => ({ ...e, myRegistration: null }));
  }
  const regs = await Registration.find({
    student: user._id,
    event: { $in: events.map((e) => e._id) },
  })
    .select("event status")
    .lean();
  const map = new Map(regs.map((r) => [String(r.event), { _id: r._id, status: r.status }]));
  return events.map((e) => ({ ...e, myRegistration: map.get(String(e._id)) || null }));
};

// POST /api/events (admin)
export const createEvent = asyncHandler(async (req, res) => {
  const event = await Event.create({ ...pickEditable(req.body), createdBy: req.user._id });
  res.status(201).json({ success: true, message: "Event created successfully", data: event });
});

// GET /api/events (any logged-in user)
// Query: search, category, status, dateFrom, dateTo, sort (asc|desc), page, limit
export const getEvents = asyncHandler(async (req, res) => {
  const { search, category, status, dateFrom, dateTo, sort } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (search) filter.title = { $regex: escapeRegex(search.trim()), $options: "i" };
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (dateFrom || dateTo) {
    filter.eventDate = {};
    if (dateFrom) filter.eventDate.$gte = new Date(dateFrom);
    if (dateTo) filter.eventDate.$lte = new Date(dateTo);
  }

  const direction = sort === "desc" ? -1 : 1;
  const [events, total] = await Promise.all([
    Event.find(filter).sort({ eventDate: direction, startTime: direction }).skip(skip).limit(limit).lean(),
    Event.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: await attachMyRegistration(events, req.user),
    pagination: buildPagination(page, limit, total),
  });
});

// GET /api/events/:id (any logged-in user)
export const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate("createdBy", "name email").lean();
  if (!event) throw new AppError("Event not found", 404);

  const [withReg] = await attachMyRegistration([event], req.user);
  res.status(200).json({ success: true, data: withReg });
});

// PUT /api/events/:id (admin) - replaces all editable fields
export const updateEvent = asyncHandler(async (req, res) => {
  const updates = pickEditable(req.body);

  // Atomic: the update only applies if the new capacity still covers the seats already taken.
  const event = await Event.findOneAndUpdate(
    { _id: req.params.id, registeredCount: { $lte: updates.maxParticipants } },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!event) {
    const existing = await Event.findById(req.params.id).select("registeredCount");
    if (!existing) throw new AppError("Event not found", 404);
    throw new AppError(
      `Maximum participants cannot be lower than the ${existing.registeredCount} seat(s) already taken`,
      400
    );
  }

  res.status(200).json({ success: true, message: "Event updated successfully", data: event });
});

// DELETE /api/events/:id (admin)
// POLICY: an event that has ANY registration record (even cancelled/rejected) cannot be deleted.
// The admin must set its status to "Cancelled" instead, so no registration data is ever lost silently.
export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new AppError("Event not found", 404);

  const registrationCount = await Registration.countDocuments({ event: event._id });
  if (registrationCount > 0) {
    throw new AppError(
      `This event has ${registrationCount} registration record(s) and cannot be deleted. Set its status to "Cancelled" instead.`,
      409
    );
  }

  await event.deleteOne();
  res.status(200).json({ success: true, message: "Event deleted successfully", data: { _id: event._id } });
});

// GET /api/events/stats (admin) - numbers for the admin dashboard
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalEvents,
    upcomingEvents,
    completedEvents,
    cancelledEvents,
    totalRegistrations,
    activeRegistrations,
    pendingRegistrations,
    recentRegistrations,
    upcomingList,
  ] = await Promise.all([
    Event.countDocuments(),
    Event.countDocuments({ status: "Upcoming" }),
    Event.countDocuments({ status: "Completed" }),
    Event.countDocuments({ status: "Cancelled" }),
    Registration.countDocuments(),
    Registration.countDocuments({ status: { $in: ACTIVE_REGISTRATION_STATUSES } }),
    Registration.countDocuments({ status: "Pending" }),
    Registration.find()
      .sort({ registeredAt: -1 })
      .limit(6)
      .populate("student", "name rollNumber email")
      .populate("event", "title eventDate"),
    Event.find({ status: "Upcoming" }).sort({ eventDate: 1 }).limit(5),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalEvents,
      upcomingEvents,
      completedEvents,
      cancelledEvents,
      totalRegistrations,
      activeRegistrations,
      pendingRegistrations,
      recentRegistrations,
      upcomingList,
    },
  });
});
