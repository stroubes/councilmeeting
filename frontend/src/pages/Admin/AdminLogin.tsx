import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { hasAdminPortalAccess } from '../../utils/adminAccess';

export default function AdminLogin(): JSX.Element {
  const { login, loginBypass, isAuthenticated, isLoading, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const authBypassEnabled = import.meta.env.VITE_AUTH_BYPASS === 'true';
  const canAccessAdminPortal = hasAdminPortalAccess(user);

  if (isAuthenticated && canAccessAdminPortal) {
    return <Navigate to="/admin-portal" replace />;
  }

  const handleLogin = async (): Promise<void> => {
    setError(null);
    try {
      await login();
    } catch {
      setError('Admin sign-in failed. Verify Azure app configuration and role access.');
    }
  };

  const handleBypassLogin = async (): Promise<void> => {
    setError(null);
    try {
      await loginBypass();
    } catch {
      setError('Local dev bypass failed. Check VITE_AUTH_BYPASS and backend AUTH_BYPASS_ENABLED.');
    }
  };

  return (
    <main className="auth-page auth-page-admin">
      <section className="auth-panel auth-panel-admin">
        <p className="pill">Restricted Access</p>
        <h1>Admin Portal</h1>
        <p>Sign in with an authorized municipal account to manage users, roles, templates, notifications, and API settings.</p>

        {isAuthenticated && !canAccessAdminPortal ? (
          <div className="inline-alert">
            Your account is signed in but does not currently have admin portal permissions.
          </div>
        ) : null}

        <div className="auth-actions">
          <button type="button" className="btn btn-primary" onClick={() => void handleLogin()} disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in to Admin Portal'}
          </button>
          {authBypassEnabled ? (
            <button type="button" className="btn" onClick={() => void handleBypassLogin()} disabled={isLoading}>
              Use Local Dev Login
            </button>
          ) : null}
          <Link className="btn btn-quiet" to="/dashboard">
            Return to Operations Workspace
          </Link>
        </div>

        {error ? <p className="inline-alert">{error}</p> : null}
      </section>
    </main>
  );
}
