const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const TOKEN_KEY = 'unvapeify_provider_token'

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
}

async function request(path, options = {}) {
  const token = getToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`)
  }
  return data
}

export const api = {
  loginProvider: async ({ email, password }) => {
    const data = await request('/provider/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setToken(data.token)
    return data.provider
  },

  registerProvider: async (payload) => {
    const data = await request('/provider/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setToken(data.token)
    return data.provider
  },

  logoutProvider: () => {
    localStorage.removeItem(TOKEN_KEY)
  },

  getNurseProfile: async () => {
    const data = await request('/provider/me')
    return data.provider
  },

  getPatients: async () => {
    const data = await request('/provider/patients')
    return data.patients
  },

  getPatientDashboard: async (patientId) => {
    return request(`/provider/patients/${patientId}/dashboard`)
  },

  getPatientProfile: async (patientId) => {
    return request(`/provider/patients/${patientId}/profile`)
  },

  getMessages: async () => {
    const data = await request('/provider/messages')
    return data.messages
  },
}
