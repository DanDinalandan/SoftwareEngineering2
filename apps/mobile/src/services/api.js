const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://host.docker.internal:3000';

let token = null;

export function setAuthToken(nextToken) {
  token = nextToken || null;
}

export function clearAuthToken() {
  token = null;
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed with status ${response.status}`);
  return data;
}
