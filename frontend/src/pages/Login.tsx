import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import { Box, Button, Container, Typography, Alert, CircularProgress } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useLocation, useNavigate } from 'react-router-dom';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    logger.debug('Login component mounted', { 
      isAuthenticated,
      path: location.pathname,
      state: location.state 
    });

    // If already authenticated, redirect to dashboard or previous location
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      logger.debug('Already authenticated, redirecting to:', from);
      navigate(from, { replace: true });
    }

    return () => {
      logger.debug('Login component unmounted');
    };
  }, [isAuthenticated, navigate, location]);

  const handleLogin = async () => {
    try {
      logger.debug('Login button clicked');
      setError(null);
      setLoading(true);
      await login();
    } catch (err) {
      logger.error('Login error:', err);
      setError('Failed to initiate login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 400,
            p: 4,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 3
          }}
        >
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" component="h1" gutterBottom>
              Sign in to Gmail AI Assistant
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Connect your Gmail account to get started
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            variant="contained"
            onClick={handleLogin}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
            sx={{
              py: 1.5,
              mb: 2,
              bgcolor: '#4285F4',
              '&:hover': {
                bgcolor: '#357ABD'
              }
            }}
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Login; 