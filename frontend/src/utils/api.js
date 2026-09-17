const sanitizeApiUrl = (rawUrl) => {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim().replace(/\/+$/, '');
  if (!cleaned.endsWith('/api')) {
    cleaned += '/api';
  }
  return cleaned;
};

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return sanitizeApiUrl(import.meta.env.VITE_API_URL);
  }
  if (typeof window !== 'undefined') {
    // In local development or local network access (e.g. phones/tablets over Wi-Fi),
    // relative '/api' utilizes Vite's dev server proxy to seamlessly route to the backend
    // on both localhost and phone without CORS or hardcoded IP address issues.
    if (import.meta.env.DEV) {
      return '/api';
    }
    // If deployed on Azure Static Web Apps and no custom API URL is set
    if (window.location.hostname.includes('azurestaticapps.net')) {
      return 'https://erp-nexus-api.azurewebsites.net/api';
    }
    // Fallback: direct to port 3000 on current host
    return `${window.location.protocol}//${window.location.hostname}:3000/api`;
  }
  return 'http://localhost:3000/api';
};

export const BASE_URL = getBaseUrl();

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Attach JWT Access Token if logged in
  const authData = JSON.parse(localStorage.getItem('auth_data') || 'null');
  if (authData?.accessToken) {
    headers['Authorization'] = `Bearer ${authData.accessToken}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    
    if (response.status === 401) {
      localStorage.removeItem('auth_data');
      // Only redirect if not already on the login page to prevent infinite redirects
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please log in again.');
    }

    const result = await response.json();
    
    if (!response.ok) {
      let errorMessage = result.error || result.message || `API error (${response.status})`;
      if (result.details && Array.isArray(result.details)) {
        const detailMessages = result.details.map(d => d.message).join(', ');
        errorMessage += `: ${detailMessages}`;
      }
      throw new Error(errorMessage);
    }
    
    return result;
  } catch (error) {
    console.error('API Request Failed:', error);
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to the backend server. Please verify that the backend is running and that your phone is on the same Wi-Fi network.');
    }
    throw error;
  }
}

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};
