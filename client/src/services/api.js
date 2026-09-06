import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Response interceptor — unwrap `data` on success, forward error message
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      'Network error';
    return Promise.reject(new Error(message));
  }
);

// ── Cases ─────────────────────────────────────────────────────────────────────
export const casesApi = {
  getAll:  (params = {}) => api.get('/cases', { params }),
  getById: (id)          => api.get(`/cases/${id}`),
  create:  (data)        => api.post('/cases', data),
  update:  (id, data)    => api.put(`/cases/${id}`, data),
  delete:  (id)          => api.delete(`/cases/${id}`),
};

// ── Hearings ──────────────────────────────────────────────────────────────────
export const hearingsApi = {
  getForCase:  (caseId)        => api.get(`/cases/${caseId}/hearings`),
  addToCase:   (caseId, data)  => api.post(`/cases/${caseId}/hearings`, data),
  update:      (id, data)      => api.put(`/hearings/${id}`, data),
  delete:      (id)            => api.delete(`/hearings/${id}`),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

// ── Search ────────────────────────────────────────────────────────────────────
export const searchApi = {
  search: (q) => api.get('/search', { params: { q } }),
};

// ── Reminders ─────────────────────────────────────────────────────────────────
export const remindersApi = {
  get: () => api.get('/reminders'),
};

export default api;
