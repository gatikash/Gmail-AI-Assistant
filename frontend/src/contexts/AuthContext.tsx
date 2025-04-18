import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  userEmail: string | null;
  tokenExpiry: string | null;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<string | null>(null);
  const navigate = useNavigate();

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedEmail = localStorage.getItem('userEmail');
    const storedExpiry = localStorage.getItem('tokenExpiry');
    
    if (storedToken) {
      logger.debug('Initializing with stored token');
      setAccessToken(storedToken);
      setUserEmail(storedEmail);
      setTokenExpiry(storedExpiry);
    }
  }, []);

  const login = async () => {
    try {
      const authUrl = await apiService.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      logger.error('Error initiating login:', error);
      throw error;
    }
  };

  const logout = () => {
    logger.debug('Logout initiated');
    setAccessToken(null);
    setUserEmail(null);
    setTokenExpiry(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('tokenExpiry');
    navigate('/login');
  };

  // Handle auth callback
  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const token = urlParams.get('token');
      
      if (token) {
        try {
          logger.debug('Auth callback received with token');
          // Store the token directly
          setAccessToken(token);
          localStorage.setItem('accessToken', token);
          
          // Clear the URL parameters
          window.history.replaceState({}, document.title, '/');
          
          // Navigate to dashboard
          logger.debug('Navigating to dashboard');
          navigate('/dashboard');
        } catch (error) {
          logger.error('Auth callback failed:', error);
          navigate('/login');
        }
      } else if (code) {
        try {
          logger.debug('Auth callback received with code');
          const { access_token, email, expires_in } = await apiService.handleAuthCallback(code);
          
          // Store the token and user info
          setAccessToken(access_token);
          setUserEmail(email || null);
          setTokenExpiry(expires_in || null);
          
          localStorage.setItem('accessToken', access_token);
          if (email) localStorage.setItem('userEmail', email);
          if (expires_in) localStorage.setItem('tokenExpiry', expires_in);
          
          // Clear the URL parameters
          window.history.replaceState({}, document.title, '/');
          
          // Navigate to dashboard
          logger.debug('Navigating to dashboard');
          navigate('/dashboard');
        } catch (error) {
          logger.error('Auth callback failed:', error);
          navigate('/login');
        }
      }
    };

    handleCallback();
  }, [navigate]);

  const value = {
    isAuthenticated: !!accessToken,
    accessToken,
    userEmail,
    tokenExpiry,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 