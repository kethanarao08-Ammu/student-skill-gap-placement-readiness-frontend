import { apiClient } from './apiClient.js';

export const adminApi = {
  getOverview: () => apiClient.get('/admin/overview'),
  getStudents: () => apiClient.get('/admin/students'),
  createSkill: (data) => apiClient.post('/admin/skills', data),
  updateSkill: (id, data) => apiClient.put(`/admin/skills/${id}`, data),
  deleteSkill: (id) => apiClient.delete(`/admin/skills/${id}`),
  createJobRole: (data) => apiClient.post('/admin/job-roles', data),
  updateJobRole: (id, data) => apiClient.put(`/admin/job-roles/${id}`, data),
  deleteJobRole: (id) => apiClient.delete(`/admin/job-roles/${id}`),
  addSkillToRole: (roleId, data) => apiClient.post(`/admin/job-roles/${roleId}/skills`, data),
  removeSkillFromRole: (roleId, skillId) => apiClient.delete(`/admin/job-roles/${roleId}/skills/${skillId}`)
};
