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

      let token;
      if (config.url?.startsWith('/admin')) {
        token = localStorage.getItem('adminToken');
      } else {
        token = localStorage.getItem('token');
      }

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

// Response interceptor to handle errors — centralized session invalidation
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const isAdminRoute = requestUrl.startsWith('/admin');

    if (status === 401) {
      // Session expired or invalid token — clear everything and redirect
      if (isAdminRoute) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRole');
        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin') {
          alert('Your admin session has expired. Please sign in again.');
          window.location.href = '/admin';
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('resume_id');
        localStorage.removeItem('interview_id');
        localStorage.removeItem('job_role');
        localStorage.removeItem('interview_mode');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
          alert('Your session has expired. Please log in again.');
          window.location.href = '/login';
        }
      }
    } else if (status === 403) {
      if (isAdminRoute) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRole');
        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin') {
          alert('Access denied. You do not have admin permissions.');
          window.location.href = '/admin';
        }
      }
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
        const role = response.data.role || "student";
        if (["admin", "tpo", "super_admin"].includes(role)) {
          localStorage.setItem("adminToken", response.data.access_token);
          localStorage.setItem("adminRole", role);
        } else {
          localStorage.setItem("token", response.data.access_token);
          localStorage.setItem("role", role);
        }
      } catch (error) {
        console.error('Failed to store token in localStorage:', error);
        alert('Storage access blocked. Please enable cookies/localStorage in browser settings.');
      }
    }
    return response.data;
  },
  register: async (name: string, email: string, password: string) => {
    const response = await axios.post(`${API_BASE_URL}/register`, {
      name, email, password
    });
    if (response.data.access_token) {
      try {
        const role = response.data.role || "student";
        if (["admin", "tpo", "super_admin"].includes(role)) {
          localStorage.setItem("adminToken", response.data.access_token);
          localStorage.setItem("adminRole", role);
        } else {
          localStorage.setItem("token", response.data.access_token);
          localStorage.setItem("role", role);
        }
      } catch (error) {
        console.error('Failed to store token in localStorage:', error);
      }
    }
    return response.data;
  },
  registerInitiate: async (name: string, email: string, phone?: string) => {
    const response = await axios.post(`${API_BASE_URL}/register/initiate`, {
      name, email, phone
    });
    return response.data;
  },
  setPassword: async (email: string, password: string, photo?: File) => {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    if (photo) {
      formData.append('photo', photo);
    }
    const response = await axios.post(`${API_BASE_URL}/register/set-password`, formData);
    if (response.data.access_token) {
      try {
        const role = response.data.role || "student";
        if (["admin", "tpo", "super_admin"].includes(role)) {
          localStorage.setItem("adminToken", response.data.access_token);
          localStorage.setItem("adminRole", role);
        } else {
          localStorage.setItem("token", response.data.access_token);
          localStorage.setItem("role", role);
        }
      } catch (error) {
        console.error('Failed to store token in localStorage:', error);
      }
    }
    return response.data;
  },
  verifyEmail: async (email: string, otp: string) => {
    const response = await axios.post(`${API_BASE_URL}/verify-email`, {
      email,
      otp,
    });
    return response.data;
  },
  resendOtp: async (email: string) => {
    const response = await axios.post(`${API_BASE_URL}/resend-otp`, { email });
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

// Local cache for dynamically updating question texts in React state without modifying UI components
const questionCache: Record<number, string> = {};
let pollingInterval: any = null;
let isPolling = false;
const listeners: ((techData?: any, hrData?: any) => void)[] = [];

const notifyListeners = (techData?: any, hrData?: any) => {
  listeners.forEach(cb => cb(techData, hrData));
};

const startPollingQuestions = (interviewId: number) => {
  if (pollingInterval) return;
  
  const isPlaceholder = (text: string) => {
    if (!text) return false;
    const placeholders = [
      "AI is personalizing",
      "[Retrying]",
      "Could you elaborate on your experience",
      "Could you describe a challenging technical project",
      "How do you approach debugging a complex issue",
      "Can you explain a time when you had to learn a new technology",
      "What strategies do you use to ensure your code",
      "Describe a situation where you had to make a technical trade-off",
      "Can you tell me about a time you had a disagreement",
      "Where do you see your career heading",
      "Describe a situation where you had to meet a tight deadline",
      "What is your preferred work environment",
      "Can you share an example of a time you took the initiative",
      "Loading question",
      "ERROR:"
    ];
    return placeholders.some(p => text.includes(p));
  };

  pollingInterval = setInterval(async () => {
    if (isPolling) return;
    isPolling = true;
    try {
      const [techRes, hrRes] = await Promise.all([
        api.post('/generate-questions', { interview_id: interviewId, phase: "technical" }),
        api.post('/generate-questions', { interview_id: interviewId, phase: "hr" })
      ]);
      
      let hasPlaceholders = false;
      let updated = false;
      
      const processQuestions = (resData: any) => {
        if (resData && resData.questions) {
          resData.questions.forEach((q: any) => {
            if (q.question) {
              if (questionCache[q.id] !== q.question) {
                questionCache[q.id] = q.question;
                updated = true;
              }
              if (isPlaceholder(q.question)) {
                hasPlaceholders = true;
              }
            }
          });
        }
      };

      processQuestions(techRes.data);
      processQuestions(hrRes.data);
      
      if (updated) {
        notifyListeners(techRes.data, hrRes.data);
      }
      
      // Stop background polling immediately when all questions are AI-customized to prevent DDoS on Uvicorn
      if (!hasPlaceholders) {
        stopPollingQuestions();
      }
    } catch (e) {
      // Ignore background sync errors silently
    } finally {
      isPolling = false;
    }
  }, 10000);
};

const stopPollingQuestions = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
};

export const interviewAPI = {
  onQuestionUpdate: (callback: (techData?: any, hrData?: any) => void) => {
    listeners.push(callback);
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    };
  },
  create: async (jobRole: string, company: string, resumeId?: number, mode: string = "Practice") => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Please login first');
    }
    const response = await api.post('/create-interview', {
      job_role: jobRole,
      company,
      resume_id: resumeId,
      mode: mode,
    });
    return response.data;
  },
  generateQuestions: async (interviewId: number, phase: string = "hr") => {
    const response = await api.post('/generate-questions', {
      interview_id: interviewId,
      phase,
    });
    
    // Save in cache
    if (response.data && response.data.questions) {
      response.data.questions.forEach((q: any) => {
        if (q.question) questionCache[q.id] = q.question;
      });

      // Wrap in dynamic ES6 getters to automatically bypass React state copy
      response.data.questions = response.data.questions.map((q: any) => {
        const proxiedQ = { ...q };
        Object.defineProperty(proxiedQ, 'question', {
          get() {
            return questionCache[q.id] || q.question;
          },
          set(val) {
            questionCache[q.id] = val;
          },
          configurable: true,
          enumerable: true
        });
        return proxiedQ;
      });
    }

    // Start background sync to continually update the cache as questions generate
    startPollingQuestions(interviewId);
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

    // Update specific cache item immediately if next_question is returned
    if (response.data && response.data.question_id && response.data.next_question) {
      questionCache[response.data.question_id] = response.data.next_question;
      notifyListeners();
    }

    // Stop background sync if the interview is fully completed
    if (response.data && response.data.is_complete) {
      stopPollingQuestions();
    }
    return response.data;
  },
  saveDraft: async (interviewId: number, questionId: number, answer: string) => {
    const response = await api.post('/submit-draft', {
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
  generateReport: async (interviewId: number) => {
    const response = await api.post(`/generate-report/${interviewId}`);
    return response.data;
  },
  fetchSavedReport: async (interviewId: number) => {
    const response = await api.get(`/get-report/${interviewId}`);
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/interview-history');
    return response.data;
  },
  getAllInterviews: async () => {
    const response = await api.get('/all-interviews');
    return response.data;
  },
  sendReportEmail: async (interviewId: number) => {
    const response = await api.post(`/send-report-email/${interviewId}`);
    return response.data;
  },
  logProctoringEvent: async (interviewId: number, eventType: string, details: any) => {
    const response = await api.post('/proctor/log-event', {
      interview_id: interviewId,
      event_type: eventType,
      details,
    });
    return response.data;
  },
  retryQuestion: async (interviewId: number, questionId: number) => {
    const response = await api.post('/retry-question', {
      interview_id: interviewId,
      question_id: questionId,
    });
    startPollingQuestions(interviewId);
    return response.data;
  },
};

export const adminAPI = {
  getDashboardStats: async () => {
    const res = await api.get('/admin/dashboard-stats');
    return res.data;
  },
  getInterviews: async (params?: any) => {
    const res = await api.get('/admin/interviews', { params });
    return res.data;
  },
  cancelInterview: async (id: number) => {
    const res = await api.post(`/admin/interviews/${id}/cancel`);
    return res.data;
  },
  deleteInterview: async (id: number) => {
    const res = await api.delete(`/admin/interviews/${id}`);
    return res.data;
  },
  deleteStudent: async (id: number) => {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },
  rescheduleInterview: async (id: number, new_time: string) => {
    const res = await api.post(`/admin/interviews/${id}/reschedule`, { new_time });
    return res.data;
  },
  getInterviewReport: async (id: number) => {
    const res = await api.get(`/admin/interviews/${id}/report`);
    return res.data;
  },
  getStudents: async (params?: any) => {
    const res = await api.get('/admin/students', { params });
    return res.data;
  },
  getReports: async (params?: any) => {
    const res = await api.get('/admin/reports', { params });
    return res.data;
  },
  getAnalytics: async (type: string) => {
    const res = await api.get(`/admin/analytics/${type}`);
    return res.data;
  },
  getUsers: async () => {
    const res = await api.get('/admin/users');
    return res.data;
  },
  getDepartments: async () => {
    const res = await api.get('/admin/departments');
    return res.data;
  },
  getCourses: async () => {
    const res = await api.get('/admin/courses');
    return res.data;
  },
  getBatches: async () => {
    const res = await api.get('/admin/batches');
    return res.data;
  },
  getAIEvaluations: async () => {
    const res = await api.get('/admin/ai-evaluations');
    return res.data;
  },
  getFeedbackInsights: async () => {
    const res = await api.get('/admin/feedback');
    return res.data;
  },
  getSkillInsights: async () => {
    const res = await api.get('/admin/skill-insights');
    return res.data;
  },
  getIntegrations: async () => {
    const res = await api.get('/admin/integrations');
    return res.data;
  },
  getAuditLogs: async () => {
    const res = await api.get('/admin/audit-logs');
    return res.data;
  },
  getSystemMonitoring: async () => {
    const res = await api.get('/admin/system-monitoring');
    return res.data;
  },
  getSettings: async () => {
    const res = await api.get('/admin/settings');
    return res.data;
  },
  updateSettings: async (settings: Record<string, any>) => {
    const res = await api.post('/admin/settings', { settings });
    return res.data;
  },
  scheduleInterview: async (payload: { candidate_name: string; email: string; job_role: string; scheduled_time: string }) => {
    const res = await api.post('/admin/interviews', payload);
    return res.data;
  },
  inviteStudent: async (payload: { name: string; email: string }) => {
    const res = await api.post('/admin/students', payload);
    return res.data;
  },
  createUser: async (payload: { name: string; email: string; role: string; department: string }) => {
    const res = await api.post('/admin/users', payload);
    return res.data;
  },
  createBatch: async (payload: { name: string; status: string; totalStudents: number }) => {
    const res = await api.post('/admin/batches', payload);
    return res.data;
  },
  createCourse: async (payload: { title: string; modules: number }) => {
    const res = await api.post('/admin/courses', payload);
    return res.data;
  },
  updateCourse: async (id: string, payload: { title: string; modules: number }) => {
    const res = await api.put(`/admin/courses/${id}`, payload);
    return res.data;
  },
  createDepartment: async (payload: { name: string; head: string; budget?: string }) => {
    const res = await api.post('/admin/departments', payload);
    return res.data;
  },
  createReport: async (payload: { candidate_name: string; job_role: string; final_score: number }) => {
    const res = await api.post('/admin/reports', payload);
    return res.data;
  }
};
