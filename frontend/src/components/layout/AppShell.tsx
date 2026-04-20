import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSystemHealth } from '../../api/health.api';
import { useAuth } from '../../hooks/useAuth';
import { hasAdminPortalAccess } from '../../utils/adminAccess';
import Icon from '../ui/Icon';
import type { IconName } from '../ui/types';

interface AppShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  workspaceVariant?: 'operations' | 'admin';
}

interface NavItem {
  label: string;
  href: string;
  match: (pathname: string) => boolean;
  icon: IconName;
  badge?: string;
}

const CIVIC = {
  primary: '#1e3a5f',
  accent: '#c8922a',
  bg: '#dce8f2',
  muted: '#7a8da8',
  sidebar: 'rgba(255,255,255,0.78)',
  success: '#3dac87',
  danger: '#d95050',
  ink: '#1a2535',
};

const OPERATIONS_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', match: (p) => p === '/dashboard', icon: 'bar-chart' },
  { label: 'Meetings', href: '/meetings', match: (p) => p.startsWith('/meetings'), icon: 'calendar' },
  { label: 'Agendas', href: '/agendas', match: (p) => p.startsWith('/agendas'), icon: 'file-text' },
  { label: 'Live Meeting', href: '/motions', match: (p) => p.startsWith('/motions'), icon: 'video', badge: 'LIVE' },
  { label: 'Reports', href: '/reports', match: (p) => p.startsWith('/reports'), icon: 'file-text' },
  { label: 'Resolutions', href: '/resolutions', match: (p) => p.startsWith('/resolutions'), icon: 'gavel' },
  { label: 'Minutes', href: '/minutes', match: (p) => p.startsWith('/minutes'), icon: 'clock' },
  { label: 'Council Members', href: '/admin-portal/users', match: (p) => p.startsWith('/admin-portal/users'), icon: 'users' },
  { label: 'My Approvals', href: '/approvals/my', match: (p) => p.startsWith('/approvals/my'), icon: 'check-circle' },
  { label: 'Director Queue', href: '/approvals/director', match: (p) => p.startsWith('/approvals/director'), icon: 'shield' },
  { label: 'CAO Queue', href: '/approvals/cao', match: (p) => p.startsWith('/approvals/cao'), icon: 'shield' },
  { label: 'Public Portal', href: '/public', match: (p) => p.startsWith('/public'), icon: 'globe' },
  { label: 'In-Camera', href: '/in-camera', match: (p) => p.startsWith('/in-camera'), icon: 'lock' },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Admin Home', href: '/admin-portal', match: (p) => p === '/admin-portal', icon: 'bar-chart' },
  { label: 'Users', href: '/admin-portal/users', match: (p) => p.startsWith('/admin-portal/users'), icon: 'users' },
  { label: 'Roles', href: '/admin-portal/roles', match: (p) => p.startsWith('/admin-portal/roles'), icon: 'shield' },
  { label: 'Workflows', href: '/admin-portal/workflows', match: (p) => p.startsWith('/admin-portal/workflows'), icon: 'settings' },
  { label: 'Meeting Types', href: '/admin-portal/meeting-types', match: (p) => p.startsWith('/admin-portal/meeting-types'), icon: 'calendar' },
  { label: 'Templates', href: '/admin-portal/templates', match: (p) => p.startsWith('/admin-portal/templates'), icon: 'file-text' },
  { label: 'Notifications', href: '/admin-portal/notifications', match: (p) => p.startsWith('/admin-portal/notifications'), icon: 'bell' },
  { label: 'Audit Logs', href: '/admin-portal/audit-logs', match: (p) => p.startsWith('/admin-portal/audit-logs'), icon: 'shield' },
  { label: 'API Settings', href: '/admin-portal/api-settings', match: (p) => p.startsWith('/admin-portal/api-settings'), icon: 'settings' },
  { label: 'Executive KPIs', href: '/admin-portal/executive-kpis', match: (p) => p.startsWith('/admin-portal/executive-kpis'), icon: 'bar-chart' },
  { label: 'Return to Workspace', href: '/dashboard', match: () => false, icon: 'arrow-left' },
];

export default function AppShell({
  title,
  subtitle,
  actions,
  children,
  workspaceVariant = 'operations',
}: AppShellProps): JSX.Element {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [systemWarning, setSystemWarning] = useState<string | null>(null);

  const userLabel = useMemo(() => user?.displayName ?? user?.email ?? 'Unknown user', [user]);
  const canAccessAdminPortal = useMemo(() => hasAdminPortalAccess(user), [user]);
  const isAdminWorkspace = workspaceVariant === 'admin';
  const navItems = isAdminWorkspace ? ADMIN_NAV : OPERATIONS_NAV;

  const initials = useMemo(() => {
    const source = user?.displayName ?? user?.email ?? 'User';
    const parts = source.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  }, [user]);

  const roleLabel = useMemo(() => {
    const roles = user?.roles ?? [];
    if (roles.length === 0) return 'Administrator';
    return roles[0]
      .split('_')
      .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
      .join(' ');
  }, [user]);

  const handleShellSearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const value = searchQuery.trim().toLowerCase();
    if (!value) return;

    if (value.includes('meeting')) navigate('/meetings');
    else if (value.includes('agenda')) navigate('/agendas');
    else if (value.includes('report')) navigate('/reports');
    else if (value.includes('motion') || value.includes('live')) navigate('/motions');
    else if (value.includes('resolution') || value.includes('bylaw')) navigate('/resolutions');
    else if (value.includes('action')) navigate('/actions');
    else if (value.includes('minute')) navigate('/minutes');
    else if (value.includes('director')) navigate('/approvals/director');
    else if (value.includes('cao')) navigate('/approvals/cao');
    else if (value.includes('approval') || value.includes('queue')) navigate('/approvals/my');
    else if (value.includes('public')) navigate('/public');
    else if (value.includes('camera')) navigate('/in-camera');
    else if (isAdminWorkspace) navigate('/admin-portal');
    else navigate('/dashboard');

    setSearchQuery('');
  };

  const closeNav = (): void => setIsNavOpen(false);

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async (): Promise<void> => {
      try {
        const health = await getSystemHealth();
        if (!isMounted) return;
        if (health.status === 'degraded') {
          setSystemWarning(health.checks?.database?.message ?? 'System is running in degraded mode. Data persistence may be affected.');
        } else {
          setSystemWarning(null);
        }
      } catch {
        // Health probe is advisory; suppress transient errors.
      }
    };
    void checkHealth();
    const intervalId = window.setInterval(() => { void checkHealth(); }, 30000);
    return () => { isMounted = false; window.clearInterval(intervalId); };
  }, []);

  const sidebarBase: React.CSSProperties = {
    width: 270,
    flexShrink: 0,
    height: '100%',
    background: CIVIC.sidebar,
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRight: '1px solid rgba(255,255,255,0.55)',
    display: 'flex',
    flexDirection: 'column',
    padding: '28px 16px 20px',
    zIndex: 40,
  };

  return (
    <div
      className={`app-shell civic-shell ${isAdminWorkspace ? 'app-shell-admin' : ''}`}
      style={{ background: CIVIC.bg, minHeight: '100vh' }}
    >
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <aside
        className={`app-sidebar civic-sidebar ${isNavOpen ? 'open' : ''}`}
        style={sidebarBase}
      >
        <Link
          to={isAdminWorkspace ? '/admin-portal' : '/dashboard'}
          onClick={closeNav}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 28,
            paddingLeft: 8,
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: CIVIC.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="home" size={19} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: CIVIC.primary, lineHeight: 1.25 }}>
              District of Sooke
            </div>
            <div style={{ fontSize: 11, color: CIVIC.muted, marginTop: 1 }}>
              {isAdminWorkspace ? 'Admin Portal' : 'Council Meetings Portal'}
            </div>
          </div>
        </Link>

        <nav aria-label="Main navigation" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
          {navItems.map((item) => {
            const isActive = item.match(location.pathname);
            return (
              <Link
                key={`${item.href}-${item.label}`}
                to={item.href}
                onClick={closeNav}
                style={{
                  width: '100%',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  textDecoration: 'none',
                  borderRadius: 14,
                  padding: '11px 14px',
                  background: isActive ? CIVIC.primary : 'transparent',
                  color: isActive ? '#fff' : CIVIC.muted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 13,
                  fontFamily: 'inherit',
                  fontSize: 13.5,
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.13s ease',
                  boxShadow: isActive ? `0 6px 20px ${CIVIC.primary}30` : 'none',
                }}
              >
                <Icon name={item.icon} size={17} color={isActive ? '#fff' : CIVIC.muted} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge ? (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 12,
                      background: item.badge === 'LIVE' ? CIVIC.danger : CIVIC.accent,
                      color: '#fff',
                      animation: item.badge === 'LIVE' ? 'civic-pulse 2s infinite' : 'none',
                    }}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 14,
            background: 'rgba(255,255,255,0.55)',
            border: '1px solid rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: CIVIC.primary,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: CIVIC.primary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={userLabel}
            >
              {userLabel}
            </div>
            <div style={{ fontSize: 11, color: CIVIC.muted }}>{roleLabel}</div>
          </div>
          <details className="user-menu" style={{ position: 'relative' }}>
            <summary
              className="user-menu-trigger"
              aria-label="Open user menu"
              style={{ listStyle: 'none', cursor: 'pointer', display: 'inline-flex' }}
            >
              <Icon name="settings" size={15} color={CIVIC.muted} />
            </summary>
            <div className="user-menu-panel" style={{ right: 0 }}>
              <p className="user-menu-title">{userLabel}</p>
              {canAccessAdminPortal ? (
                <Link className="user-menu-link" to="/admin/login">Admin Portal</Link>
              ) : null}
              <button type="button" className="user-menu-link" onClick={() => void logout()}>
                Sign out
              </button>
            </div>
          </details>
        </div>
      </aside>

      {isNavOpen ? (
        <button type="button" className="sidebar-overlay" onClick={closeNav} aria-label="Close navigation" />
      ) : null}

      <div className="app-main" style={{ background: CIVIC.bg }}>
        <header className="app-header civic-topbar" style={{ padding: '22px 32px 6px', background: 'transparent', borderBottom: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              type="button"
              className="menu-toggle"
              onClick={() => setIsNavOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              <Icon name="menu" size={20} aria-hidden="true" />
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: CIVIC.primary, lineHeight: 1.2, margin: 0 }}>
                {title}
              </h1>
              {subtitle ? (
                <p style={{ fontSize: 12.5, color: CIVIC.muted, marginTop: 3, margin: 0 }}>{subtitle}</p>
              ) : null}
            </div>

            <form
              onSubmit={handleShellSearch}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#fff',
                borderRadius: 12,
                padding: '8px 14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              <Icon name="search" size={15} color={CIVIC.muted} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search…"
                aria-label="Search workspace"
                style={{
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  color: CIVIC.primary,
                  background: 'transparent',
                  width: 150,
                }}
              />
            </form>

            <Link
              to="/admin-portal/notifications"
              aria-label="Notifications"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <Icon name="bell" size={17} color={CIVIC.muted} />
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 9,
                  right: 9,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: CIVIC.danger,
                  border: '2px solid #fff',
                }}
              />
            </Link>
          </div>

          {systemWarning ? (
            <div className="system-warning-banner" role="alert" style={{ marginTop: 16 }}>
              <strong>Data Persistence Warning:</strong> {systemWarning}
            </div>
          ) : null}
        </header>

        <main id="main-content" className="page-area" style={{ padding: '16px 32px 32px', background: 'transparent', animation: 'civic-fade-in 0.2s ease' }}>
          {actions ? (
            <div className="page-actions" style={{ marginBottom: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {actions}
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
