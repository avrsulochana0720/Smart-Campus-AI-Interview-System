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
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('DEBUG: Token added to request header');
      } else {
        console.warn('DEBUG: No token found in localStorage');
      }
    } catch (error) {
      console.error('ERROR: localStorage access blocked:', error);
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
      // Do NOT redirect to login automatically
    }
    return Promise.reject(error);
  }
);

export default api;

// API functions
export const authAPI = {
  login: async (email: string, password: string) => {
    console.log('DEBUG authAPI.login: Calling POST /login', API_BASE_URL);
    const response = await axios.post(`${API_BASE_URL}/login`, {
      email,
      password,
    });
    console.log('DEBUG authAPI.login: Response status', response.status);
    console.log('DEBUG authAPI.login: Response data', response.data);
    if (response.data.access_token) {
      try {
        localStorage.setItem('token', response.data.access_token);
        console.log('DEBUG authAPI.login: Token stored in localStorage');
      } catch (error) {
        console.error('ERROR authAPI.login: Failed to store token in localStorage:', error);
        alert('Storage access blocked. Please enable cookies/localStorage in browser settings.');
      }
    }
    return response.data;
  },
  register: async (name: string, email: string, password: string) => {
    console.log('DEBUG authAPI.register: Calling POST /register', API_BASE_URL);
    const response = await axios.post(`${API_BASE_URL}/register`, {
      name,
      email,
      password,
    });
    console.log('DEBUG authAPI.register: Response status', response.status);
    return response.data;
  },
};

export const resumeAPI = {
  upload: async (file: File) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('ERROR resumeAPI.upload: No token found in localStorage');
      throw new Error('Please login first');
    }
    console.log('DEBUG resumeAPI.upload: Calling POST /upload-resume', API_BASE_URL);
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('DEBUG resumeAPI.upload: Response status', response.status);
    return response.data;
  },
};

export const interviewAPI = {
  create: async (jobRole: string, company: string, resumeId?: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('ERROR interviewAPI.create: No token found in localStorage');
      throw new Error('Please login first');
    }
    console.log('DEBUG interviewAPI.create: Calling POST /create-interview');
    const response = await api.post('/create-interview', {
      job_role: jobRole,
      company,
      resume_id: resumeId,
    });
    console.log('DEBUG interviewAPI.create: Response status', response.status);
    return response.data;
  },
  generateQuestions: async (interviewId: number) => {
    console.log('DEBUG interviewAPI.generateQuestions: Calling POST /generate-questions');
    const response = await api.post('/generate-questions', {
      interview_id: interviewId,
    });
    console.log('DEBUG interviewAPI.generateQuestions: Response status', response.status);
    return response.data;
  },
  getQuestion: async (interviewId: number) => {
    console.log('DEBUG interviewAPI.getQuestion: Calling GET /get-question');
    const response = await api.get(`/get-question/${interviewId}`);
    console.log('DEBUG interviewAPI.getQuestion: Response status', response.status);
    return response.data;
  },
  submitAnswer: async (interviewId: number, questionId: number, answer: string) => {
    console.log('DEBUG interviewAPI.submitAnswer: Calling POST /submit-answer');
    const response = await api.post('/submit-answer', {
      interview_id: interviewId,
      question_id: questionId,
      answer,
    });
    console.log('DEBUG interviewAPI.submitAnswer: Response status', response.status);
    return response.data;
  },
  getReport: async (interviewId: number) => {
    console.log('DEBUG interviewAPI.getReport: Calling GET /interview-report');
    const response = await api.get(`/interview-report/${interviewId}`);
    console.log('DEBUG interviewAPI.getReport: Response status', response.status);
    return response.data;
  },
  getHistory: async () => {
    console.log('DEBUG interviewAPI.getHistory: Calling GET /interview-history');
    const response = await api.get('/interview-history');
    console.log('DEBUG interviewAPI.getHistory: Response status', response.status);
    return response.data;
  },
};
