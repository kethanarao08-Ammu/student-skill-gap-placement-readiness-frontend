import { apiClient } from './apiClient.js';

export const skillApi = {
  getAllSkills: () => apiClient.get('/skills'),
  getSkillsByCategory: (category) => apiClient.get(`/skills/category/${category}`),
  getSkillById: (id) => apiClient.get(`/skills/${id}`),
  getStudentSkills: () => apiClient.get('/skills/student'),
  addOrUpdateStudentSkill: (data) => apiClient.post('/skills/student', data),
  deleteStudentSkill: (skillId) => apiClient.delete(`/skills/student/${skillId}`)
};
