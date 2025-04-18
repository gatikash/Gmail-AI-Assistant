import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// Use Vite's environment variable syntax
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login on 401
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface Email {
  id: string;
  thread_id: string;
  message_id: string;
  subject: string;
  from_address: string;
  date: string;
  snippet: string;
  labels: string[];
}

export interface EmailAnalysis {
  category: string;
  topic: string;
  sentiment: string;
  priority: string;
  should_trash: boolean;
  key_points: string[];
  action_items: string[];
}

export interface Stats {
  total_moved_to_gator: number;
  total_emails_processed: number;
  email: string;
}

class ApiService {
  async getEmails(token: string): Promise<Email[]> {
    try {
      const response = await api.get('/emails', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data.emails;
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }

  async getEmailAnalysis(messageId: string, token: string): Promise<EmailAnalysis> {
    try {
      const response = await api.get(`/emails/${messageId}/analyze`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching email analysis:', error);
      throw error;
    }
  }

  async getStats(token: string): Promise<Stats> {
    try {
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await api.get('/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }

  // Auth methods
  async getAuthUrl(): Promise<string> {
    try {
      const response = await api.get('/auth/url');
      return response.data.auth_url;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      throw error;
    }
  }

  async handleAuthCallback(code: string): Promise<{ access_token: string; email?: string; expires_in?: string }> {
    try {
      console.log('Making callback request with code:', code);
      const response = await api.post('/auth/callback', { code });
      console.log('Callback response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error handling auth callback:', error);
      throw error;
    }
  }

  async analyzeEmail(id: string, token: string): Promise<EmailAnalysis> {
    try {
      const response = await fetch(`${API_BASE_URL}/emails/${id}/analyze`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze email: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing email:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService(); 