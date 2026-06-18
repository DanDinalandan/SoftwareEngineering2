const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

let providerToken = localStorage.getItem('providerToken') || null;

function setProviderToken(token) {
  providerToken = token || null;
  if (providerToken) localStorage.setItem('providerToken', providerToken);
  else localStorage.removeItem('providerToken');
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(providerToken ? { Authorization: `Bearer ${providerToken}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed with status ${response.status}`);
  return data;
}

export const api = {
  loginProvider: async ({ email, password }) => {
    const data = await request('/provider/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setProviderToken(data.token);
    return data.provider;
  },

  registerProvider: async (payload) => {
    const data = await request('/provider/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setProviderToken(data.token);
    return data.provider;
  },

  logoutProvider: () => setProviderToken(null),

  getNurseProfile: async () => {
    const data = await request('/provider/me');
    return data.provider;
  },

  updateNurseProfile: async (payload) => {
    const data = await request('/provider/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return data.provider;
  },

  changeProviderPassword: async ({ currentPassword, newPassword }) => {
    return request('/provider/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  updateNotificationPreferences: async (preferences) => {
    const data = await request('/provider/notification-preferences', {
      method: 'PATCH',
      body: JSON.stringify({ preferences }),
    });
    return data.provider;
  },

  getPatients: async () => {
    const data = await request('/provider/patients');
    return data.patients;
  },

  getPatientDashboard: async (patientId) => {
    return request(`/provider/patients/${patientId}/dashboard`);
  },

  getPatientProfile: async (patientId) => {
    return request(`/provider/patients/${patientId}/profile`);
  },

  getMessages: async () => {
    const data = await request('/provider/messages');
    return data.messages;
  },

  getNotifications: async () => {
    const data = await request('/provider/notifications');
    return data.notifications;
  },

  markNotificationRead: async (notificationId) => {
    return request(`/provider/notifications/${notificationId}/read`, { method: 'PATCH' });
  },

  markAllNotificationsRead: async () => {
    return request('/provider/notifications/read-all', { method: 'PATCH' });
  },

  getPatientLogHistory: async (patientId) => {
    const data = await request(`/provider/patients/${patientId}/logs`);
    return data.logs;
  },

  markMessageRead: async (messageId) => {
    return request(`/provider/messages/${messageId}/read`, { method: 'PATCH' });
  },

  sendMessageReply: async (messageId, replyText) => {
    return request(`/provider/messages/${messageId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ text: replyText }),
    });
  },

  removePatient: async (patientId) => {
    return request(`/provider/patients/${patientId}`, { method: 'DELETE' });
  },

  requestPatient: async (email) => {
    return request('/provider/patients/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  composeMessage: async ({ patientId, subject, body }) => {
    const data = await request('/provider/messages', {
      method: 'POST',
      body: JSON.stringify({ patientId, subject, body }),
    });
    return data.message;
  },

  updateMessage: async (messageId, { subject, body }) => {
    return request(`/provider/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ subject, body }),
    });
  },

  deleteMessage: async (messageId) => {
    return request(`/provider/messages/${messageId}`, { method: 'DELETE' });
  },
};

