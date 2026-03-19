import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { hasAdminPortalAccess } from '../../utils/adminAccess';

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
}

const MAIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', match: (pathname) => pathname === '/dashboard' },
  { label: 'Meetings', href: '/meetings', match: (pathname) => pathname.startsWith('/meetings') },
  { label: 'Agendas', href: '/agendas', match: (pathname) => pathname.startsWith('/agendas') },
  { label: 'Reports', href: '/reports', match: (pathname) => pathname.startsWith('/reports') },
  { label: 'Live Display', href: '/motions', match: (pathname) => pathname.startsWith('/motions') },
  { label: 'Minutes', href: '/minutes', match: (pathname) => pathname.startsWith('/minutes') },
  {
    label: 'Director Queue',
    href: '/approvals/director',
    match: (pathname) => pathname.startsWith('/approvals/director'),
  },
  { label: 'CAO Queue', href: '/approvals/cao', match: (pathname) => pathname.startsWith('/approvals/cao') },
];

const PORTAL_NAV: NavItem[] = [
  { label: 'Public Portal', href: '/public', match: (pathname) => pathname.startsWith('/public') },
  { label: 'In-Camera', href: '/in-camera', match: (pathname) => pathname.startsWith('/in-camera') },
];

const ADMIN_PORTAL_NAV: NavItem = {
  label: 'Admin Portal',
  href: '/admin/login',
  match: (pathname) => pathname.startsWith('/admin-portal') || pathname.startsWith('/admin/login'),
};

const ADMIN_WORKSPACE_NAV: NavItem[] = [
  { label: 'Admin Home', href: '/admin-portal', match: (pathname) => pathname === '/admin-portal' },
  { label: 'Users', href: '/admin-portal/users', match: (pathname) => pathname.startsWith('/admin-portal/users') },
  { label: 'Roles', href: '/admin-portal/roles', match: (pathname) => pathname.startsWith('/admin-portal/roles') },
  {
    label: 'Meeting Types',
    href: '/admin-portal/meeting-types',
    match: (pathname) => pathname.startsWith('/admin-portal/meeting-types'),
  },
  {
    label: 'Templates',
    href: '/admin-portal/templates',
    match: (pathname) => pathname.startsWith('/admin-portal/templates'),
  },
  {
    label: 'Executive KPIs',
    href: '/admin-portal/executive-kpis',
    match: (pathname) => pathname.startsWith('/admin-portal/executive-kpis'),
  },
  {
    label: 'Notifications',
    href: '/admin-portal/notifications',
    match: (pathname) => pathname.startsWith('/admin-portal/notifications'),
  },
  {
    label: 'API Settings',
    href: '/admin-portal/api-settings',
    match: (pathname) => pathname.startsWith('/admin-portal/api-settings'),
  },
];

const OPERATIONS_SHORTCUTS = [
  { label: 'New Meeting', href: '/meetings?quick=new-meeting' },
  { label: 'New Agenda', href: '/agendas?quick=new-agenda' },
  { label: 'New Report', href: '/reports?quick=new-report' },
  { label: 'Live Display', href: '/motions' },
  { label: 'Minutes', href: '/minutes' },
];

const ADMIN_SHORTCUTS = [
  { label: 'Users', href: '/admin-portal/users' },
  { label: 'Roles', href: '/admin-portal/roles' },
  { label: 'Meeting Types', href: '/admin-portal/meeting-types' },
  { label: 'Templates', href: '/admin-portal/templates' },
  { label: 'Executive KPIs', href: '/admin-portal/executive-kpis' },
  { label: 'Notifications', href: '/admin-portal/notifications' },
  { label: 'API Settings', href: '/admin-portal/api-settings' },
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

  const userLabel = useMemo(() => user?.displayName ?? user?.email ?? 'Unknown user', [user]);
  const canAccessAdminPortal = useMemo(() => hasAdminPortalAccess(user), [user]);
  const isAdminWorkspace = workspaceVariant === 'admin';
  const portalNav = useMemo(() => {
    if (isAdminWorkspace) {
      return [];
    }
    return canAccessAdminPortal ? [...PORTAL_NAV, ADMIN_PORTAL_NAV] : PORTAL_NAV;
  }, [canAccessAdminPortal, isAdminWorkspace]);
  const primaryNav = isAdminWorkspace ? ADMIN_WORKSPACE_NAV : MAIN_NAV;
  const activeSectionLabel = useMemo(() => {
    const allItems = [...primaryNav, ...portalNav, ADMIN_PORTAL_NAV];
    const activeItem = allItems.find((item) => item.match(location.pathname));
    return activeItem?.label ?? 'Workspace';
  }, [location.pathname, portalNav, primaryNav]);

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    [],
  );

  const initials = useMemo(() => {
    const source = user?.displayName ?? user?.email ?? 'User';
    const parts = source.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  }, [user]);

  const handleShellSearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const value = searchQuery.trim().toLowerCase();

    if (!value) {
      return;
    }

    if (value.includes('meeting')) {
      navigate('/meetings');
    } else if (value.includes('agenda')) {
      navigate('/agendas');
    } else if (value.includes('report')) {
      navigate('/reports');
    } else if (value.includes('motion')) {
      navigate('/motions');
    } else if (value.includes('minute')) {
      navigate('/minutes');
    } else if (value.includes('director')) {
      navigate('/approvals/director');
    } else if (value.includes('cao')) {
      navigate('/approvals/cao');
    } else if (value.includes('public')) {
      navigate('/public');
    } else if (value.includes('camera')) {
      navigate('/in-camera');
    } else if (
      value.includes('admin') ||
      value.includes('user') ||
      value.includes('role') ||
      value.includes('meeting type') ||
      value.includes('template') ||
      value.includes('kpi') ||
      value.includes('executive') ||
      value.includes('notification') ||
      value.includes('api setting')
    ) {
      navigate('/admin/login');
    } else if (isAdminWorkspace) {
      navigate('/admin-portal');
    } else {
      navigate('/dashboard');
    }
    setSearchQuery('');
  };

  const closeNav = (): void => {
    setIsNavOpen(false);
  };

  return (
    <div className={`app-shell ${isAdminWorkspace ? 'app-shell-admin' : ''}`}>
      <aside className={`app-sidebar ${isNavOpen ? 'open' : ''}`}>
        <Link className="brand-block" to={isAdminWorkspace ? '/admin-portal' : '/dashboard'} onClick={closeNav}>
          <span className="brand-kicker">Municipal Governance Cloud</span>
          <strong className="brand-title">{isAdminWorkspace ? 'Admin Portal' : 'Council Meeting System'}</strong>
          <span className="brand-subtitle">
            {isAdminWorkspace ? 'Configuration + Access Governance' : 'Executive Operations Workspace'}
          </span>
        </Link>

        <nav className="nav-group" aria-label="Main Navigation">
          <p className="nav-heading">{isAdminWorkspace ? 'Admin Workspace' : 'Core Modules'}</p>
          {primaryNav.map((item) => {
            const isActive = item.match(location.pathname);
            return (
              <Link key={item.href} to={item.href} className={`nav-link ${isActive ? 'active' : ''}`} onClick={closeNav}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {isAdminWorkspace ? (
          <nav className="nav-group" aria-label="Operations Navigation">
            <p className="nav-heading">Operations</p>
            <Link to="/dashboard" className="nav-link" onClick={closeNav}>
              Return to Workspace
            </Link>
          </nav>
        ) : (
          <nav className="nav-group" aria-label="Portal Navigation">
            <p className="nav-heading">Administration + Portals</p>
            {portalNav.map((item) => {
              const isActive = item.match(location.pathname);
              return (
                <Link key={item.href} to={item.href} className={`nav-link ${isActive ? 'active' : ''}`} onClick={closeNav}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </aside>

      {isNavOpen ? <button type="button" className="sidebar-overlay" onClick={closeNav} aria-label="Close menu" /> : null}

      <div className="app-main">
        <header className="app-header">
          <div className="topbar">
            <button type="button" className="menu-toggle" onClick={() => setIsNavOpen((value) => !value)}>
              Menu
            </button>

            <div className="topbar-context-copy">
              <span className="topbar-label">Current Module</span>
              <strong>{activeSectionLabel}</strong>
            </div>

            <form className="shell-search" onSubmit={handleShellSearch}>
              <input
                className="field"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={
                  isAdminWorkspace
                    ? 'Search users, roles, templates, notifications, settings'
                    : 'Search meetings, agendas, reports, minutes'
                }
                aria-label="Search workspace"
              />
            </form>

            <div className="topbar-actions">
              <Link className="btn btn-primary" to="/reports?quick=new-report">
                Create
              </Link>
              <span className="pill topbar-date">{todayLabel}</span>
              <div className="topbar-user-copy">
                <span className="topbar-label">Signed in</span>
                <strong>{userLabel}</strong>
              </div>
              <details className="user-menu">
                <summary className="user-menu-trigger" aria-label="Open user menu">
                  <span className="topbar-user-avatar" aria-hidden="true">
                    {initials}
                  </span>
                </summary>
                <div className="user-menu-panel">
                  <p className="user-menu-title">{userLabel}</p>
                  {canAccessAdminPortal ? (
                    <Link className="user-menu-link" to="/admin/login">
                      Admin Portal
                    </Link>
                  ) : null}
                  <button type="button" className="user-menu-link" onClick={() => void logout()}>
                    Sign out
                  </button>
                </div>
              </details>
            </div>
          </div>

          <div className="header-shortcuts">
            {(isAdminWorkspace ? ADMIN_SHORTCUTS : OPERATIONS_SHORTCUTS).map((item) => (
              <Link key={item.href} className="header-shortcut" to={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </header>

        <main className="page-area">
          <section className="page-header page-header-card page-enter">
            <div>
              <p className="page-header-kicker">Council Governance Workspace</p>
              {isAdminWorkspace ? <p className="workspace-badge">Restricted Admin Workspace</p> : null}
              <h1>{title}</h1>
              {subtitle ? <p>{subtitle}</p> : null}
            </div>
            {actions ? <div className="page-actions">{actions}</div> : null}
          </section>

          {children}
        </main>
      </div>
    </div>
  );
}
