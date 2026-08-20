import api from './axiosInstance';

// ─── Manpower (Employees) ────────────────────────────────────────────────────
export const fetchEmployees = (params) => api.get('/manpower', { params });
export const createEmployee = (payload) => api.post('/manpower', payload);
export const updateEmployee = (id, payload) => api.put(`/manpower/${id}`, payload);
export const deleteEmployee = (id) => api.delete(`/manpower/${id}`);
export const uploadExcel = (formData) =>
  api.post('/manpower/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const uploadEmployeeCert = (formData) =>
  api.post('/manpower/upload-cert', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ─── Job Orders ──────────────────────────────────────────────────────────────
export const fetchJobOrders = (params) => api.get('/job-orders', { params });
export const createJobOrder = (payload) => api.post('/job-orders', payload);
export const updateJobOrder = (id, payload) => api.put(`/job-orders/${id}`, payload);
export const fetchSlotSuggestions = (params) =>
  api.get('/job-orders/suggest', { params });
export const assignSlot = (jobOrderId, payload) =>
  api.put(`/job-orders/${jobOrderId}/assign-slot`, payload);
export const releaseSlot = (jobOrderId, payload) =>
  api.put(`/job-orders/${jobOrderId}/release-slot`, payload);
export const updateSlotPipeline = (jobOrderId, payload) =>
  api.put(`/job-orders/${jobOrderId}/update-slot-pipeline`, payload);
export const uploadJobOrderExcel = (formData) =>
  api.post('/job-orders/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ─── Trades ──────────────────────────────────────────────────────────────────
export const getTrades = (params) => api.get('/trades', { params });
export const createTrade = (payload) => api.post('/trades', payload);
export const updateTrade = (id, payload) => api.put(`/trades/${id}`, payload);
export const deactivateTrade = (id) => api.patch(`/trades/${id}/deactivate`);

// ─── Specializations ─────────────────────────────────────────────────────────
export const getSpecializations = (trade) =>
  api.get('/specializations', { params: trade ? { trade } : {} });
export const createSpecialization = (payload) =>
  api.post('/specializations', payload);
export const updateSpecialization = (id, payload) =>
  api.put(`/specializations/${id}`, payload);
export const deactivateSpecialization = (id) =>
  api.patch(`/specializations/${id}/deactivate`);

// ─── Staff ───────────────────────────────────────────────────────────────────
export const getStaff = () => api.get('/staff');
export const createStaff = (payload) => api.post('/staff', payload);
export const updateStaff = (id, payload) => api.put(`/staff/${id}`, payload);
export const deactivateStaff = (id) => api.patch(`/staff/${id}/deactivate`);
