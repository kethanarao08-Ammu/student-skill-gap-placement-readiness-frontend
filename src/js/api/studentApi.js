import { apiClient } from './apiClient.js';

export const studentApi = {
  getProfile: () => apiClient.get('/student/profile'),
  updateProfile: (data) => apiClient.put('/student/profile', data),
  getProfileCompletion: () => apiClient.get('/student/profile/completion')
};
