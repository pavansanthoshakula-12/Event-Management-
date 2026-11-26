import api from "./api";

// Removes empty filter values so they are not sent as ?category=
const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined));

export const getEvents = (params) => api.get("/events", { params: clean(params) }).then((r) => r.data);
export const getEvent = (id) => api.get(`/events/${id}`).then((r) => r.data);
export const createEvent = (data) => api.post("/events", data).then((r) => r.data);
export const updateEvent = (id, data) => api.put(`/events/${id}`, data).then((r) => r.data);
export const deleteEvent = (id) => api.delete(`/events/${id}`).then((r) => r.data);
export const getDashboardStats = () => api.get("/events/stats").then((r) => r.data);
