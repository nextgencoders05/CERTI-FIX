import api, { API_BASE_URL } from './api'

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  registerUser: (data) => api.post('/auth/register', data),
  registerOrg: (data) => api.post('/auth/register-organization', data),
  me: () => api.get('/auth/me'),
}

export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
}

export const orgAPI = {
  listVerified: () => api.get('/organizations/'),
  getMyOrg: () => api.get('/organizations/me'),
  updateMyOrg: (data) => api.put('/organizations/me', data),
  uploadLogo: (formData) =>
    api.post('/organizations/me/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  logoUrl: (orgId) => `${API_BASE_URL}/organizations/${orgId}/logo`,
}

export const categoryAPI = {
  list: (includeInactive = false) =>
    api.get(`/categories/?include_inactive=${includeInactive}`),
  create: (data) => api.post('/categories/', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
}

export const templateAPI = {
  list: () => api.get('/templates/'),
  create: (data) => api.post('/templates/', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  remove: (id) => api.delete(`/templates/${id}`),
}

export const certificateAPI = {
  list: (search = '') =>
    api.get(`/certificates/${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  issue: (data) => api.post('/certificates/issue', data),
  getOne: (uid) => api.get(`/certificates/${uid}`),
  revoke: (uid, reason) =>
    api.post(`/certificates/${uid}/revoke?reason=${encodeURIComponent(reason)}`),
  downloadUrl: (uid) => `${API_BASE_URL}/certificates/${uid}/download`,
}

export const ocrAPI = {
  upload: (formData) =>
    api.post('/ocr/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  listUploads: () => api.get('/ocr/uploads'),
  getUpload: (id) => api.get(`/ocr/uploads/${id}`),
}

export const correctionAPI = {
  list: (status = '') =>
    api.get(`/corrections/${status ? `?status_filter=${status}` : ''}`),
  getOne: (id) => api.get(`/corrections/${id}`),
  submit: (data) => api.post('/corrections/', data),
  decide: (id, data) => api.post(`/corrections/${id}/decide`, data),
}

export const verifyAPI = {
  verify: (uid) => api.get(`/verify/${encodeURIComponent(uid)}`),
}

export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  users: (role = '') => api.get(`/admin/users${role ? `?role=${role}` : ''}`),
  toggleUserStatus: (id, isActive) =>
    api.patch(`/admin/users/${id}/status?is_active=${isActive}`),
  organizations: (statusFilter = '') =>
    api.get(`/admin/organizations${statusFilter ? `?status_filter=${statusFilter}` : ''}`),
  verifyOrg: (id, data) => api.post(`/admin/organizations/${id}/verify`, data),
  auditLogs: (action = '') =>
    api.get(`/admin/audit-logs${action ? `?action=${encodeURIComponent(action)}` : ''}`),
}

export const notificationAPI = {
  list: () => api.get('/notifications/'),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
}
