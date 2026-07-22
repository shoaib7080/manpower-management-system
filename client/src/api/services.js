import api from './axiosInstance';

export const fetchEmployees = (params) => api.get('/manpower', { params });
export const uploadExcel = (formData) => api.post('/manpower/import', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export const fetchJobOrders = (params) => api.get('/job-orders', { params });
export const fetchSlotSuggestions = (params) => api.get('/job-orders/suggest', { params });
export const assignSlot = (jobOrderId, payload) => api.put(`/job-orders/${jobOrderId}/assign-slot`, payload);
export const releaseSlot = (jobOrderId, payload) => api.put(`/job-orders/${jobOrderId}/release-slot`, payload);

export const createEmployee = (payload) => api.post('/manpower', payload);
export const createJobOrder = (payload) => api.post('/job-orders', payload);