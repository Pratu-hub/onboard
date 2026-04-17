const handleAuthError = (status) => {
  if (status === 401 || status === 403) {
    localStorage.removeItem('onboardiq_token');
    localStorage.removeItem('onboardiq_user');
    window.location.href = '/login';
    return true;
  }
  return false;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://onboard-back.azurewebsites.net';

async function api(path, options = {}) {
  const token = localStorage.getItem('onboardiq_token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (handleAuthError(response.status)) {
      throw new Error('Authentication required');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }

  return response.json();
}

export { api };
