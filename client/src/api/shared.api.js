import api from './axiosInstance';

// ─── Audit Logs (cross-module) ────────────────────────────────────────────────
export const fetchAuditLogs = (params) => api.get('/audit-logs', { params });
