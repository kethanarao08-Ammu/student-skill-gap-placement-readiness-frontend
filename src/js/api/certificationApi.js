import { apiClient } from './apiClient.js';

export const certificationApi = {
  getCertifications: () => apiClient.get('/certifications'),
  createCertification: (data) => apiClient.post('/certifications', data),
  updateCertification: (id, data) => apiClient.put(`/certifications/${id}`, data),
  deleteCertification: (id) => apiClient.delete(`/certifications/${id}`)
};
