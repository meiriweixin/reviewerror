import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('DEBUG: Interceptor - token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
  console.log('DEBUG: Interceptor - Request URL:', config.url);
  console.log('DEBUG: Interceptor - Current headers:', config.headers);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('DEBUG: Interceptor - Added Authorization header');
  }
  return config;
});

// Auth APIs
export const loginWithGoogle = async (googleToken) => {
  const response = await api.post('/auth/google', { token: googleToken });
  const { access_token } = response.data;
  if (access_token) {
    localStorage.setItem('token', access_token);
    // Update axios default header to include the token for subsequent requests
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
  }
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const updateUserGrade = async (grade) => {
  const response = await api.put('/auth/grade', { grade });
  return response.data;
};

// Question APIs
export const uploadImage = async (file, subject, grade) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('subject', subject);
  formData.append('grade', grade);

  const response = await api.post('/questions/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getWrongQuestions = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.subject) params.append('subject', filters.subject);
  if (filters.grade) params.append('grade', filters.grade);
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  if (filters.status) params.append('status', filters.status);

  const response = await api.get(`/questions/wrong?${params.toString()}`);
  return response.data;
};

export const getQuestionById = async (questionId) => {
  const response = await api.get(`/questions/${questionId}`);
  return response.data;
};

export const updateQuestionStatus = async (questionId, status) => {
  const response = await api.put(`/questions/${questionId}/status`, { status });
  return response.data;
};

export const searchQuestions = async (query) => {
  const response = await api.post('/questions/search', { query });
  return response.data;
};

export const deleteQuestion = async (questionId) => {
  const response = await api.delete(`/questions/${questionId}`);
  return response.data;
};

export const regenerateExplanation = async (questionId) => {
  const response = await api.post(`/questions/${questionId}/regenerate`);
  return response.data;
};

// Stats APIs
export const getStudentStats = async () => {
  const response = await api.get('/stats/');
  return response.data;
};

export const getSubjectStats = async () => {
  const response = await api.get('/stats/by-subject');
  return response.data;
};

// Usage APIs
export const getTokenUsage = async () => {
  const response = await api.get('/usage/tokens');
  return response.data;
};

export const getAllUsersTokenUsage = async () => {
  const response = await api.get('/usage/tokens/all');
  return response.data;
};

export default api;
