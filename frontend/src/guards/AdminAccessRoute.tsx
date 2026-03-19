import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasAdminPortalAccess } from '../utils/adminAccess';

interface AdminAccessRouteProps {
  children: JSX.Element;
}

export default function AdminAccessRoute({ children }: AdminAccessRouteProps): JSX.Element {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!hasAdminPortalAccess(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
