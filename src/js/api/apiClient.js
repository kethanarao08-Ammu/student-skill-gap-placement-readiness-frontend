import { getApiUrl } from '../config.js';
import { getToken, clearAuth } from '../utils/authGuard.js';
import { showToast } from '../utils/notifications.js';

export async function request(endpoint, options = {}) {
  const url = getApiUrl(endpoint);
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const isPublicAuthRequest = endpoint === '/auth/register' || endpoint === '/auth/login';
  if (token && !isPublicAuthRequest) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      clearAuth();
      if (!window.location.pathname.includes('/login.html') && !window.location.pathname.includes('/register.html')) {
        showToast('Session expired. Please log in again.', 'warning');
        setTimeout(() => {
          window.location.href = '/pages/login.html';
        }, 1200);
      }
      throw new Error('Unauthorized');
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      if (typeof data === 'object' && data !== null) {
        const fieldErrors = data.fieldErrors || data.errors;
        if (fieldErrors && typeof fieldErrors === 'object') {
          const messages = Object.values(fieldErrors).filter((message) => typeof message === 'string');
          if (messages.length > 0) {
            errorMessage = messages.join(', ');
          }
        }
        if (errorMessage === 'An error occurred' && data.message) {
          errorMessage = data.message;
        }
      } else if (typeof data === 'string') {
        errorMessage = data;
      }
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export const apiClient = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' })
};
