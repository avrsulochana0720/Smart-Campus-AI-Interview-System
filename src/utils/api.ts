import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      // Skip token for login and register endpoints
      const isAuthEndpoint = config.url?.includes('/login') || config.url?.includes('/register');
      if (isAuthEndpoint) {
        return config;
      }

      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('localStorage access blocked:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear token
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;

// API functions
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      email,
      password,
    });
    if (response.data.access_token) {
      try {
        localStorage.setItem('token', response.data.access_token);
      } catch (error) {
        console.error('Failed to store token in localStorage:', error);
        alert('Storage access blocked. Please enable cookies/localStorage in browser settings.');
      }
    }
    return response.data;
  },
  register: async (name: string, email: string, password: string, photo?: File) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    if (photo) {
      formData.append('photo', photo);
    }
    const response = await axios.post(`${API_BASE_URL}/register`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const resumeAPI = {
  upload: async (file: File) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Please login first');
    }
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const interviewAPI = {
  create: async (jobRole: string, company: string, resumeId?: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Please login first');
    }
    const response = await api.post('/create-interview', {
      job_role: jobRole,
      company,
      resume_id: resumeId,
    });
    return response.data;
  },
  generateQuestions: async (interviewId: number, phase: string = "hr") => {
    const response = await api.post('/generate-questions', {
      interview_id: interviewId,
      phase,
    });
    return response.data;
  },
  getQuestion: async (interviewId: number) => {
    const response = await api.get(`/get-question/${interviewId}`);
    return response.data;
  },
  submitAnswer: async (interviewId: number, questionId: number, answer: string) => {
    const response = await api.post('/submit-answer', {
      interview_id: interviewId,
      question_id: questionId,
      answer,
    });
    return response.data;
  },
  getReport: async (interviewId: number) => {
    const response = await api.get(`/interview-report/${interviewId}`);
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/interview-history');
    return response.data;
  },
};
