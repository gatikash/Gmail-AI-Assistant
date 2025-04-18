import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  logger.debug('PrivateRoute rendering', { isAuthenticated, path: location.pathname });

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    logger.debug('Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the children
  return <>{children}</>;
};

export default PrivateRoute; 