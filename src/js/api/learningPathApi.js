import { apiClient } from './apiClient.js';

export const learningPathApi = {
  getRecommendations: () => apiClient.get('/learning-path/recommendations'),
  generateRecommendations: (jobRoleId = null) => {
    const query = jobRoleId ? `?jobRoleId=${jobRoleId}` : '';
    return apiClient.post(`/learning-path/generate${query}`, {});
  },
  updateStatus: (recommendationId, status) => {
    return apiClient.patch(`/learning-path/recommendations/${recommendationId}/status`, { status });
  }
};
