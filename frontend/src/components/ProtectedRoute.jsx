import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, requireProfile = true }) {
  const { isAuthenticated, hasProfile } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireProfile && !hasProfile) {
    return <Navigate to="/profile-setup" replace />;
  }

  return children;
}

export default ProtectedRoute;