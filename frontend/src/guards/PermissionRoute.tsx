import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface PermissionRouteProps {
  requiredPermission: string;
  children: JSX.Element;
}

export default function PermissionRoute({
  requiredPermission,
  children,
}: PermissionRouteProps): JSX.Element {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.permissions.includes(requiredPermission)) {
    if (user.roles.includes('ADMIN')) {
      return children;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
