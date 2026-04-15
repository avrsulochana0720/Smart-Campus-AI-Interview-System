import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      // Token expired or invalid, clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
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
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },
  register: async (name: string, email: string, password: string) => {
    const response = await axios.post(`${API_BASE_URL}/register`, {
      name,
      email,
      password,
    });
    return response.data;
  },
};

export const resumeAPI = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/upload-resume`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

export const interviewAPI = {
  start: async (userId: number, jobRole: string, company: string) => {
    const response = await api.post('/start-interview', {
      user_id: userId,
      job_role: jobRole,
      company,
    });
    return response.data;
  },
  getQuestion: async (interviewId: number) => {
    const response = await api.get(`/get-question/${interviewId}`);
    return response.data;
  },
  submitAnswer: async (interviewId: number, question: string, answer: string) => {
    const response = await api.post('/submit-answer', {
      interview_id: interviewId,
      question,
      answer,
    });
    return response.data;
  },
  getReport: async (interviewId: number) => {
    const response = await api.get(`/report/${interviewId}`);
    return response.data;
  },
};
