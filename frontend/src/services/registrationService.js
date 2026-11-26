import api from "./api";

const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined));

export const registerForEvent = (eventId, remarks = "") =>
  api.post("/registrations", { eventId, remarks }).then((r) => r.data);
export const getAllRegistrations = (params) => api.get("/registrations", { params: clean(params) }).then((r) => r.data);
export const getMyRegistrations = (params) => api.get("/registrations/my", { params: clean(params) }).then((r) => r.data);
export const updateRegistration = (id, data) => api.put(`/registrations/${id}`, data).then((r) => r.data);
export const cancelRegistration = (id) => api.patch(`/registrations/${id}/cancel`).then((r) => r.data);
export const deleteRegistration = (id) => api.delete(`/registrations/${id}`).then((r) => r.data);
