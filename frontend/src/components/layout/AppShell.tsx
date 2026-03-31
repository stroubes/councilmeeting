import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSystemHealth } from '../../api/health.api';
import { useAuth } from '../../hooks/useAuth';
import { hasAdminPortalAccess } from '../../utils/adminAccess';
import Icon from '../ui/Icon';
import type { IconName } from '../ui/types';
import Breadcrumb from '../ui/Breadcrumb';

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
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const CONTENT_WORKFLOW: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', match: (p) => p === '/dashboard', icon: 'bar-chart' },
  { label: 'Meetings', href: '/meetings', match: (p) => p.startsWith('/meetings'), icon: 'calendar' },
  { label: 'Agendas', href: '/agendas', match: (p) => p.startsWith('/agendas'), icon: 'file-text' },
  { label: 'Reports', href: '/reports', match: (p) => p.startsWith('/reports'), icon: 'file-text' },
  { label: 'Resolutions', href: '/resolutions', match: (p) => p.startsWith('/resolutions'), icon: 'gavel' },
  { label: 'Minutes', href: '/minutes', match: (p) => p.startsWith('/minutes'), icon: 'clock' },
];

const LIVE_OPERATIONS: NavItem[] = [
  { label: 'Live Display', href: '/motions', match: (p) => p.startsWith('/motions'), icon: 'video' },
];

const APPROVALS: NavItem[] = [
  { label: 'My Queue', href: '/approvals/my', match: (p) => p.startsWith('/approvals/my'), icon: 'user' },
  { label: 'Director Queue', href: '/approvals/director', match: (p) => p.startsWith('/approvals/director'), icon: 'users' },
  { label: 'CAO Queue', href: '/approvals/cao', match: (p) => p.startsWith('/approvals/cao'), icon: 'shield' },
];

const PORTALS: NavItem[] = [
  { label: 'Public Portal', href: '/public', match: (p) => p.startsWith('/public'), icon: 'globe' },
  { label: 'In-Camera', href: '/in-camera', match: (p) => p.startsWith('/in-camera'), icon: 'lock' },
];

const OPERATIONS_NAV_GROUPS = [
  { group: 'Content Workflow', items: CONTENT_WORKFLOW },
  { group: 'Live Operations', items: LIVE_OPERATIONS },
  { group: 'Approvals', items: APPROVALS },
  { group: 'Portals', items: PORTALS },
];

const ADMIN_CONTENT_WORKFLOW: NavItem[] = [
  { label: 'Admin Home', href: '/admin-portal', match: (p) => p === '/admin-portal', icon: 'bar-chart' },
  { label: 'Users', href: '/admin-portal/users', match: (p) => p.startsWith('/admin-portal/users'), icon: 'user' },
  { label: 'Roles', href: '/admin-portal/roles', match: (p) => p.startsWith('/admin-portal/roles'), icon: 'shield' },
  { label: 'Workflows', href: '/admin-portal/workflows', match: (p) => p.startsWith('/admin-portal/workflows'), icon: 'settings' },
  { label: 'Meeting Types', href: '/admin-portal/meeting-types', match: (p) => p.startsWith('/admin-portal/meeting-types'), icon: 'calendar' },
  { label: 'Templates', href: '/admin-portal/templates', match: (p) => p.startsWith('/admin-portal/templates'), icon: 'file-text' },
  { label: 'Notifications', href: '/admin-portal/notifications', match: (p) => p.startsWith('/admin-portal/notifications'), icon: 'bell' },
  { label: 'Audit Logs', href: '/admin-portal/audit-logs', match: (p) => p.startsWith('/admin-portal/audit-logs'), icon: 'shield' },
  { label: 'API Settings', href: '/admin-portal/api-settings', match: (p) => p.startsWith('/admin-portal/api-settings'), icon: 'settings' },
  { label: 'Executive KPIs', href: '/admin-portal/executive-kpis', match: (p) => p.startsWith('/admin-portal/executive-kpis'), icon: 'bar-chart' },
];

const ADMIN_PORTALS: NavItem[] = [
  { label: 'Return to Workspace', href: '/dashboard', match: (p) => p === '/dashboard', icon: 'arrow-left' },
  { label: 'Admin Portal', href: '/admin/login', match: (p) => p.startsWith('/admin/login'), icon: 'lock' },
];

const ADMIN_NAV_GROUPS = [
  { group: 'Admin Workspace', items: ADMIN_CONTENT_WORKFLOW },
  { group: 'Operations', items: ADMIN_PORTALS },
];

type Shortcut = { label: string; href: string; icon: IconName };

const OPERATIONS_SHORTCUTS: Shortcut[] = [
  { label: 'New Meeting', href: '/meetings?quick=new-meeting', icon: 'plus' },
  { label: 'New Agenda', href: '/agendas?quick=new-agenda', icon: 'plus' },
  { label: 'New Report', href: '/reports?quick=new-report', icon: 'plus' },
  { label: 'Live Display', href: '/motions', icon: 'video' },
];

const ADMIN_SHORTCUTS: Shortcut[] = [
  { label: 'Users', href: '/admin-portal/users', icon: 'user' },
  { label: 'Roles', href: '/admin-portal/roles', icon: 'shield' },
  { label: 'Workflows', href: '/admin-portal/workflows', icon: 'settings' },
  { label: 'Templates', href: '/admin-portal/templates', icon: 'file-text' },
  { label: 'Audit Logs', href: '/admin-portal/audit-logs', icon: 'shield' },
];

interface BreadcrumbDef {
  label: string;
  href?: string;
  icon?: IconName;
}

function buildBreadcrumbs(pathname: string): BreadcrumbDef[] {
  const crumbs: BreadcrumbDef[] = [];

  if (pathname === '/dashboard') {
    return [{ label: 'Dashboard', icon: 'bar-chart' }];
  }

  if (pathname.startsWith('/meetings')) {
    crumbs.push({ label: 'Meetings', href: '/meetings', icon: 'calendar' });
    if (pathname.match(/^\/meetings\/[^/]+$/)) {
      crumbs.push({ label: 'Details' });
    }
    return crumbs;
  }

  if (pathname.startsWith('/agendas')) {
    crumbs.push({ label: 'Agendas', href: '/agendas', icon: 'file-text' });
    if (pathname.match(/^\/agendas\/[^/]+$/)) {
      crumbs.push({ label: 'Details' });
    }
    return crumbs;
  }

  if (pathname.startsWith('/reports')) {
    crumbs.push({ label: 'Reports', href: '/reports', icon: 'file-text' });
    return crumbs;
  }

  if (pathname.startsWith('/motions')) {
    crumbs.push({ label: 'Live Display', href: '/motions', icon: 'video' });
    return crumbs;
  }

  if (pathname.startsWith('/resolutions')) {
    crumbs.push({ label: 'Resolutions', href: '/resolutions', icon: 'gavel' });
    return crumbs;
  }

  if (pathname.startsWith('/actions')) {
    crumbs.push({ label: 'Actions', href: '/actions', icon: 'check-circle' });
    return crumbs;
  }

  if (pathname.startsWith('/minutes')) {
    crumbs.push({ label: 'Minutes', href: '/minutes', icon: 'clock' });
    return crumbs;
  }

  if (pathname.startsWith('/approvals/my')) {
    crumbs.push({ label: 'My Queue', href: '/approvals/my', icon: 'user' });
    return crumbs;
  }

  if (pathname.startsWith('/approvals/director')) {
    crumbs.push({ label: 'Director Queue', href: '/approvals/director', icon: 'users' });
    return crumbs;
  }

  if (pathname.startsWith('/approvals/cao')) {
    crumbs.push({ label: 'CAO Queue', href: '/approvals/cao', icon: 'shield' });
    return crumbs;
  }

  if (pathname.startsWith('/public')) {
    crumbs.push({ label: 'Public Portal', href: '/public', icon: 'globe' });
    if (pathname.match(/^\/public\/agendas\/[^/]+$/)) {
      crumbs.push({ label: 'Agenda Details' });
    }
    return crumbs;
  }

  if (pathname.startsWith('/in-camera')) {
    crumbs.push({ label: 'In-Camera', href: '/in-camera', icon: 'lock' });
    return crumbs;
  }

  if (pathname.startsWith('/admin-portal')) {
    crumbs.push({ label: 'Admin Portal', href: '/admin-portal', icon: 'shield' });
    if (pathname.match(/^\/admin-portal\/users$/)) {
      crumbs.push({ label: 'Users' });
    } else if (pathname.match(/^\/admin-portal\/roles$/)) {
      crumbs.push({ label: 'Roles' });
    } else if (pathname.match(/^\/admin-portal\/workflows$/)) {
      crumbs.push({ label: 'Workflows' });
    } else if (pathname.match(/^\/admin-portal\/meeting-types$/)) {
      crumbs.push({ label: 'Meeting Types' });
    } else if (pathname.match(/^\/admin-portal\/templates$/)) {
      crumbs.push({ label: 'Templates' });
    } else if (pathname.match(/^\/admin-portal\/executive-kpis$/)) {
      crumbs.push({ label: 'Executive KPIs' });
    } else if (pathname.match(/^\/admin-portal\/notifications$/)) {
      crumbs.push({ label: 'Notifications' });
    } else if (pathname.match(/^\/admin-portal\/audit-logs$/)) {
      crumbs.push({ label: 'Audit Logs' });
    } else if (pathname.match(/^\/admin-portal\/api-settings$/)) {
      crumbs.push({ label: 'API Settings' });
    }
    return crumbs;
  }

  return crumbs;
}

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
  const navGroups = isAdminWorkspace ? ADMIN_NAV_GROUPS : OPERATIONS_NAV_GROUPS;
  const shortcuts = (isAdminWorkspace ? ADMIN_SHORTCUTS : OPERATIONS_SHORTCUTS);

  const activeSectionLabel = useMemo(() => {
    const allItems = navGroups.flatMap((g) => g.items);
    const activeItem = allItems.find((item) => item.match(location.pathname));
    return activeItem?.label ?? 'Workspace';
  }, [location.pathname, navGroups]);

  const breadcrumbs = useMemo(() => buildBreadcrumbs(location.pathname), [location.pathname]);

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

    if (!value) return;

    if (value.includes('meeting')) navigate('/meetings');
    else if (value.includes('agenda')) navigate('/agendas');
    else if (value.includes('report')) navigate('/reports');
    else if (value.includes('motion') || value.includes('live')) navigate('/motions');
    else if (value.includes('resolution') || value.includes('bylaw')) navigate('/resolutions');
    else if (value.includes('action') || value.includes('follow up')) navigate('/actions');
    else if (value.includes('minute')) navigate('/minutes');
    else if (value.includes('director')) navigate('/approvals/director');
    else if (value.includes('cao')) navigate('/approvals/cao');
    else if (value.includes('approval') || value.includes('queue')) navigate('/approvals/my');
    else if (value.includes('public')) navigate('/public');
    else if (value.includes('camera')) navigate('/in-camera');
    else if (
      value.includes('admin') || value.includes('user') || value.includes('role') ||
      value.includes('meeting type') || value.includes('workflow') ||
      value.includes('template') || value.includes('kpi') || value.includes('executive') ||
      value.includes('notification') || value.includes('audit') || value.includes('api setting')
    ) navigate('/admin/login');
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
      } catch {}
    };
    void checkHealth();
    const intervalId = window.setInterval(() => { void checkHealth(); }, 30000);
    return () => { isMounted = false; window.clearInterval(intervalId); };
  }, []);

  return (
    <div className={`app-shell ${isAdminWorkspace ? 'app-shell-admin' : ''}`}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <aside className={`app-sidebar ${isNavOpen ? 'open' : ''}`}>
        <Link className="brand-block" to={isAdminWorkspace ? '/admin-portal' : '/dashboard'} onClick={closeNav}>
          <span className="brand-kicker">Municipal Governance Cloud</span>
          <strong className="brand-title">{isAdminWorkspace ? 'Admin Portal' : 'Council Meeting System'}</strong>
          <span className="brand-subtitle">
            {isAdminWorkspace ? 'Configuration + Access Governance' : 'Executive Operations Workspace'}
          </span>
        </Link>

        <nav aria-label="Main navigation">
          {navGroups.map((navGroup, groupIndex) => (
            <div key={navGroup.group} className="nav-group">
              <p className="nav-heading" aria-hidden="true">{navGroup.group}</p>
              {navGroup.items.map((item) => {
                const isActive = item.match(location.pathname);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeNav}
                  >
                    <Icon name={item.icon} size={15} aria-hidden="true" className="nav-link-icon" />
                    {item.label}
                  </Link>
                );
              })}
              {groupIndex < navGroups.length - 1 && <div className="nav-group-sep" aria-hidden="true" />}
            </div>
          ))}
        </nav>
      </aside>

      {isNavOpen ? (
        <button type="button" className="sidebar-overlay" onClick={closeNav} aria-label="Close navigation" />
      ) : null}

      <div className="app-main">
        <header className="app-header">
          <div className="topbar">
            <button type="button" className="menu-toggle" onClick={() => setIsNavOpen((v) => !v)} aria-label="Toggle navigation">
              <Icon name="menu" size={20} aria-hidden="true" />
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
                  <span className="topbar-user-avatar" aria-hidden="true">{initials}</span>
                </summary>
                <div className="user-menu-panel">
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
          </div>

          <div className="header-shortcuts">
            {shortcuts.map((item) => (
              <Link key={item.href} className="header-shortcut" to={item.href}>
                <Icon name={item.icon} size={13} aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </div>

          {systemWarning ? (
            <div className="system-warning-banner" role="alert">
              <strong>Data Persistence Warning:</strong> {systemWarning}
            </div>
          ) : null}
        </header>

        <main id="main-content" className="page-area">
          {breadcrumbs.length > 0 ? (
            <Breadcrumb items={breadcrumbs} />
          ) : null}

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
