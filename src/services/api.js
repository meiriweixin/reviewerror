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

export const updateUserModel = async (preferredModel) => {
  const response = await api.put('/auth/model', { preferred_model: preferredModel });
  return response.data;
};

// Question APIs
export const uploadImage = async (file, subject, grade, category = '', wrongOnly = true) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('subject', subject);
  formData.append('grade', grade);
  if (category) {
    formData.append('category', category);
  }
  formData.append('wrong_only', wrongOnly.toString());

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
  if (filters.category) params.append('category', filters.category);
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

export const getSimilarQuestions = async (questionId) => {
  const response = await api.post(`/questions/${questionId}/similar`);
  return response.data;
};

// Stats APIs
export const getStudentStats = async (grade = null) => {
  const params = new URLSearchParams();
  if (grade) params.append('grade', grade);

  const response = await api.get(`/stats/?${params.toString()}`);
  return response.data;
};

export const getSubjectStats = async (grade = null) => {
  const params = new URLSearchParams();
  if (grade) params.append('grade', grade);

  const response = await api.get(`/stats/by-subject?${params.toString()}`);
  return response.data;
};

export const getCategoryStats = async (subject = null, grade = null) => {
  const params = new URLSearchParams();
  if (subject) params.append('subject', subject);
  if (grade) params.append('grade', grade);

  const response = await api.get(`/stats/by-category?${params.toString()}`);
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

// User Management APIs (Admin only)
export const getAllUsers = async () => {
  const response = await api.get('/users/');
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/users/', userData);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};

// Paper Library APIs
export const getAllPapers = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.subject) params.append('subject', filters.subject);
  if (filters.grade) params.append('grade', filters.grade);
  if (filters.limit) params.append('limit', filters.limit);

  const response = await api.get(`/papers?${params.toString()}`);
  return response.data;
};

export const getPaperById = async (paperId) => {
  const response = await api.get(`/papers/${paperId}`);
  return response.data;
};

export const uploadPaper = async (file, title, subject, grade = '', year = null) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('subject', subject);
  if (grade) formData.append('grade', grade);
  if (year) formData.append('year', year);

  const response = await api.post('/papers/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const downloadPaper = async (paperId) => {
  const response = await api.post(`/papers/${paperId}/download`);
  return response.data;
};

export const openPracticeMode = async (paperId) => {
  const response = await api.post(`/papers/${paperId}/practice`);
  return response.data;
};

export const captureQuestion = async (file, subject, grade, category, note, source_paper_id) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('subject', subject);
  formData.append('source_paper_id', source_paper_id);
  if (grade) formData.append('grade', grade);
  if (category) formData.append('category', category);
  if (note) formData.append('note', note);

  const response = await api.post('/questions/capture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// ============= Community Q&A APIs =============

export const createQAQuestion = async (questionData, imageFiles = []) => {
  const formData = new FormData();

  // Add required fields
  formData.append('title', questionData.title);
  formData.append('content', questionData.content);
  formData.append('subject', questionData.subject);

  // Add optional fields
  if (questionData.grade) {
    formData.append('grade', questionData.grade);
  }
  if (questionData.bounty_amount !== undefined) {
    formData.append('bounty_amount', questionData.bounty_amount.toString());
  }
  if (questionData.tags && questionData.tags.length > 0) {
    formData.append('tags', JSON.stringify(questionData.tags));
  }

  // Add image files
  imageFiles.forEach((file) => {
    formData.append('files', file);
  });

  const response = await api.post('/qa/questions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getQAQuestions = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.filter) params.append('filter', filters.filter);
  if (filters.subject) params.append('subject', filters.subject);
  if (filters.grade) params.append('grade', filters.grade);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);

  const response = await api.get(`/qa/questions?${params.toString()}`);
  return response.data;
};

export const getQAQuestionById = async (questionId) => {
  const response = await api.get(`/qa/questions/${questionId}`);
  return response.data;
};

export const deleteQAQuestion = async (questionId) => {
  const response = await api.delete(`/qa/questions/${questionId}`);
  return response.data;
};

export const createQAAnswer = async (questionId, content) => {
  const response = await api.post(`/qa/questions/${questionId}/answers`, { content });
  return response.data;
};

export const getQAAnswers = async (questionId) => {
  const response = await api.get(`/qa/questions/${questionId}/answers`);
  return response.data;
};

export const acceptQAAnswer = async (answerId) => {
  const response = await api.post(`/qa/answers/${answerId}/accept`);
  return response.data;
};

export const deleteQAAnswer = async (answerId) => {
  const response = await api.delete(`/qa/answers/${answerId}`);
  return response.data;
};

export const castQAVote = async (entityType, entityId, voteType) => {
  const response = await api.post('/qa/vote', {
    entity_type: entityType,
    entity_id: entityId,
    vote_type: voteType
  });
  return response.data;
};

export const removeQAVote = async (entityType, entityId) => {
  const params = new URLSearchParams();
  params.append('entity_type', entityType);
  params.append('entity_id', entityId);
  const response = await api.delete(`/qa/vote?${params.toString()}`);
  return response.data;
};

export const getUserQAVote = async (entityType, entityId) => {
  const params = new URLSearchParams();
  params.append('entity_type', entityType);
  params.append('entity_id', entityId);
  const response = await api.get(`/qa/vote?${params.toString()}`);
  return response.data;
};

export const createQAComment = async (answerId, content) => {
  const response = await api.post(`/qa/answers/${answerId}/comments`, { content });
  return response.data;
};

export const getQAComments = async (answerId) => {
  const response = await api.get(`/qa/answers/${answerId}/comments`);
  return response.data;
};

export const deleteQAComment = async (commentId) => {
  const response = await api.delete(`/qa/comments/${commentId}`);
  return response.data;
};

export default api;
