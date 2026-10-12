import { apiClient } from './apiClient.js';

export const jobRoleApi = {
  getAllActiveRoles: () => apiClient.get('/job-roles'),
  getRoleById: (id) => apiClient.get(`/job-roles/${id}`)
};
