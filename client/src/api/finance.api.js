import api from "./axiosInstance";

export const getTimesheet = (jobOrderId, params) =>
  api.get(`/finance/timesheets/${jobOrderId}`, { params });

export const saveTimesheet = (payload) =>
  api.post("/finance/timesheets", payload);

export const approveTimesheet = (id, payload) =>
  api.put(`/finance/timesheets/${id}/approve`, payload);
