import { apiClient } from './apiClient.js';

export const assessmentApi = {
  getActiveAssessments: () => apiClient.get('/assessments'),
  getAssessmentById: (id) => apiClient.get(`/assessments/${id}`),
  getQuestions: (assessmentId) => apiClient.get(`/assessments/${assessmentId}/questions`),
  submitAssessment: (data) => apiClient.post('/assessments/submit', data),
  getHistory: () => apiClient.get('/assessments/history'),
  getAttemptResult: (attemptId) => apiClient.get(`/assessments/attempts/${attemptId}`)
};
