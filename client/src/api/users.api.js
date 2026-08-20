import api from './axiosInstance';

// ─── Authentication ───────────────────────────────────────────────────────────
// Note: login is handled directly in AuthContext via api.post('/auth/login')

// ─── User Management (SuperAdmin only) ───────────────────────────────────────
export const getUsers = () => api.get('/auth/users');
export const createUser = (payload) => api.post('/auth/register', payload);
export const updateUser = (id, payload) => api.put(`/auth/users/${id}`, payload);
export const deleteUser = (id) => api.delete(`/auth/users/${id}`);
