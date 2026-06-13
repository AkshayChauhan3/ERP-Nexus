const BASE_URL = 'http://localhost:3000/api';

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
    throw error;
  }
}

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};
