import { apiClient } from './apiClient.js';

export const skillGapApi = {
  analyzeGap: (jobRoleId = null) => {
    const query = jobRoleId ? `?jobRoleId=${jobRoleId}` : '';
    return apiClient.get(`/skill-gap/analyze${query}`);
  },
  getReadinessScore: (jobRoleId = null) => {
    const query = jobRoleId ? `?jobRoleId=${jobRoleId}` : '';
    return apiClient.get(`/skill-gap/readiness${query}`);
  }
};
