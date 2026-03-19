import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login(): JSX.Element {
  const { login, loginBypass, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const authBypassEnabled = import.meta.env.VITE_AUTH_BYPASS === 'true';

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (): Promise<void> => {
    setError(null);
    try {
      await login();
    } catch {
      setError('Microsoft sign-in failed. Verify Azure app configuration.');
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
    <main className="auth-page">
      <section className="auth-panel">
        <p className="pill">Municipal Governance Platform</p>
        <h1>Council Meeting Management</h1>
        <p>Sign in with your municipal Microsoft account to access meetings, agendas, and workflow queues.</p>
        <div className="auth-actions">
          <button type="button" className="btn btn-primary" onClick={() => void handleLogin()} disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
          </button>
          {authBypassEnabled ? (
            <button type="button" className="btn" onClick={() => void handleBypassLogin()} disabled={isLoading}>
              Use Local Dev Login
            </button>
          ) : null}
        </div>
        {error ? <p className="inline-alert">{error}</p> : null}
      </section>
    </main>
  );
}
