const configuredApiUrl = import.meta.env.VITE_API_URL
  || 'https://student-skill-gap-placement-readiness.onrender.com/api';
const normalizedApiUrl = configuredApiUrl.replace(/\/+$/, '');

export const API_BASE_URL = normalizedApiUrl.endsWith('/api')
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api`;

export function getApiUrl(endpoint) {
  const normalizedEndpoint = endpoint.replace(/^\/+/, '');
  const apiRelativeEndpoint = normalizedEndpoint.startsWith('api/')
    ? normalizedEndpoint.slice(4)
    : normalizedEndpoint;

  return `${API_BASE_URL}/${apiRelativeEndpoint}`;
}
