import { apiClient } from './apiClient.js';

export const dashboardApi = {
  getSummary: () => apiClient.get('/dashboard/summary')
};
