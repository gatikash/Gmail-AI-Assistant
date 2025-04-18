import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmailDetail from './pages/EmailDetail';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import { useEffect } from 'react';
import { Box } from '@mui/material';

function AppContent() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    console.log('AppContent mounted, isAuthenticated:', isAuthenticated);
    return () => {
      console.log('AppContent unmounted');
    };
  }, [isAuthenticated]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {isAuthenticated && <Navbar />}
      <Box component="main" sx={{ flex: 1 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/emails/:id" element={<PrivateRoute><EmailDetail /></PrivateRoute>} />
          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App; 