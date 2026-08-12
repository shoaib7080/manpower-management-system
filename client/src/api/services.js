import api from "./axiosInstance";

export const fetchEmployees = (params) => api.get("/manpower", { params });
export const uploadExcel = (formData) =>
  api.post("/manpower/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const fetchJobOrders = (params) => api.get("/job-orders", { params });
export const fetchSlotSuggestions = (params) =>
  api.get("/job-orders/suggest", { params });
export const assignSlot = (jobOrderId, payload) =>
  api.put(`/job-orders/${jobOrderId}/assign-slot`, payload);
export const releaseSlot = (jobOrderId, payload) =>
  api.put(`/job-orders/${jobOrderId}/release-slot`, payload);
export const updateSlotPipeline = (jobOrderId, payload) =>
  api.put(`/job-orders/${jobOrderId}/update-slot-pipeline`, payload);

export const createEmployee = (payload) => api.post("/manpower", payload);
export const createJobOrder = (payload) => api.post("/job-orders", payload);

export const updateEmployee = (id, payload) =>
  api.put(`/manpower/${id}`, payload);
export const deleteEmployee = (id) => api.delete(`/manpower/${id}`);

export const uploadJobOrderExcel = (formData) =>
  api.post("/job-orders/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const fetchAuditLogs = (params) => api.get("/audit-logs", { params });

export const getSpecializations = (trade) =>
  api.get("/specializations", { params: trade ? { trade } : {} });
export const createSpecialization = (payload) =>
  api.post("/specializations", payload);
export const deactivateSpecialization = (id) =>
  api.patch(`/specializations/${id}/deactivate`);

export const getUsers = () => api.get("/auth/users");
export const createUser = (payload) => api.post("/auth/register", payload);
export const deleteUser = (id) => api.delete(`/auth/users/${id}`);
export const updateUser = (id, payload) =>
  api.put(`/auth/users/${id}`, payload);
