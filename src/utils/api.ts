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
