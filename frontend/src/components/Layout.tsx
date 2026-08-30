import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/SimulatedAuthContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
  AlertTriangle,
  Sun,
  Moon,
  Briefcase,
  Calendar,
  Building2,
  UserCog
} from 'lucide-react';

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Super Admin',
  ESTABLISHMENT_OFFICER: 'Establishment Officer',
  PAYROLL_OFFICER: 'Payroll Officer',
  SUPERVISOR: 'Supervisory Officer',
  DEPARTMENT_OFFICER: 'Department Officer',
  MANAGEMENT: 'Management Dashboard',
  EMPLOYEE: 'Employee View',
};

interface LayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const { user, simulatedRole, logout, switchRole } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const location = useLocation();
  const navigate = useNavigate();

  // Set dark class on initial render and theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const navItems = [
    {
      id: 'dashboard',
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'SUPERVISOR', 'DEPARTMENT_OFFICER', 'MANAGEMENT'],
    },
    {
      id: 'employees',
      path: '/employees',
      label: 'Employees',
      icon: Users,
      roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'SUPERVISOR', 'DEPARTMENT_OFFICER', 'MANAGEMENT'],
    },
    {
      id: 'attendance',
      path: '/attendance',
      label: 'Attendance',
      icon: CalendarCheck,
      roles: ['ADMIN', 'SUPERVISOR', 'DEPARTMENT_OFFICER'],
    },
    {
      id: 'leaves',
      path: '/leaves',
      label: 'Leave & Off',
      icon: Calendar,
      roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'SUPERVISOR', 'DEPARTMENT_OFFICER', 'EMPLOYEE'],
    },
    {
      id: 'appointments',
      path: '/appointments',
      label: 'Appointments',
      icon: Briefcase,
      roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'MANAGEMENT'],
    },
    {
      id: 'payroll',
      path: '/payroll',
      label: 'Payroll',
      icon: CreditCard,
      roles: ['ADMIN', 'PAYROLL_OFFICER', 'MANAGEMENT'],
    },
    {
      id: 'payMaster',
      path: '/pay-master',
      label: 'Pay Master',
      icon: CreditCard,
      roles: ['ADMIN', 'PAYROLL_OFFICER'],
    },
    {
      id: 'offboarding',
      path: '/offboarding',
      label: 'Offboarding',
      icon: AlertTriangle,
      roles: ['ADMIN', 'ESTABLISHMENT_OFFICER'],
    },
    {
      id: 'finalSettlement',
      path: '/final-settlement',
      label: 'Final Settlement',
      icon: FileText,
      roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER'],
    },
    {
      id: 'reports',
      path: '/reports',
      label: 'Reports',
      icon: FileText,
      roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'DEPARTMENT_OFFICER', 'MANAGEMENT'],
    },
    {
      id: 'profile',
      path: '/my-profile',
      label: 'My Profile',
      icon: User,
      roles: ['EMPLOYEE'],
    },
    {
      id: 'orgMaster',
      path: '/org-master',
      label: 'Dept & Designation',
      icon: Building2,
      roles: ['ADMIN'],
    },
    {
      id: 'userManagement',
      path: '/users',
      label: 'User Management',
      icon: UserCog,
      roles: ['ADMIN'],
    },
    {
      id: 'settings',
      path: '/settings',
      label: 'Settings',
      icon: Settings,
      roles: ['ADMIN'],
    },
  ];

  const visibleNavItems = navItems.filter((item) => item.roles.includes(simulatedRole));

  // Determine active item based on current URL path
  const currentPath = location.pathname;
  const activeNavItem = visibleNavItems.find(
    (item) => currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path))
  ) || visibleNavItems[0];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>HDS</div>
          <div>
            <h1 style={styles.logoText}>AMITY</h1>
            <span style={styles.logoSub}>Payroll & Establishment</span>
          </div>
        </div>

        <nav style={styles.nav}>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNavItem?.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                }}
              >
                <Icon size={18} color={isActive ? 'var(--text-primary)' : 'var(--text-secondary)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={styles.footerSection}>
          <div style={styles.userBrief}>
            <div style={styles.avatar}>
              <User size={16} color="var(--text-primary)" />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={styles.userName}>{user?.name || 'System User'}</p>
              <p style={styles.userRole}>{ROLE_LABELS[simulatedRole]}</p>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Wrapper */}
      <div style={styles.mainWrapper}>
        <header style={styles.header}>
          <div style={styles.headerTitle}>
            <h2>{activeNavItem?.label || 'System Hub'}</h2>
          </div>

          {/* Role Switcher Widget */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={toggleTheme}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun size={14} color="var(--color-warning)" /> : <Moon size={14} color="var(--accent-primary)" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {/* Role Switcher — ADMIN only */}
            {user?.role === 'ADMIN' && (
              <div style={styles.roleSwitcherContainer}>
                <div style={styles.roleSwitcherLabel}>
                  <ShieldCheck size={14} color="var(--accent-secondary)" />
                  <span>User Access Role:</span>
                </div>
                <div style={styles.selectWrapper}>
                  <select
                    value={simulatedRole}
                    onChange={(e) => {
                      switchRole(e.target.value as UserRole);
                      navigate('/dashboard');
                    }}
                    style={styles.roleSelect}
                  >
                    {Object.entries(ROLE_LABELS).map(([role, label]) => (
                      <option key={role} value={role}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} style={styles.selectIcon} />
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="main-content animated-fade-in" style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '260px',
    backgroundColor: 'var(--bg-surface-glass)',
    backdropFilter: 'blur(20px)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logoSection: {
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid var(--border-color)',
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'var(--accent-gradient)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    color: '#fff',
    fontSize: '14px',
    boxShadow: 'var(--shadow-glow)',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '800',
    background: 'var(--accent-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  logoSub: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  nav: {
    padding: '20px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    backgroundColor: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'var(--font-heading)',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'var(--transition-smooth)',
  },
  navItemActive: {
    color: 'var(--text-primary)',
    background: 'rgba(255, 255, 255, 0.05)',
    borderLeft: '3px solid var(--accent-secondary)',
  },
  footerSection: {
    padding: '16px',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  userBrief: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-surface-hover)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border-color)',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  userRole: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '10px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--color-danger)',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'var(--transition-smooth)',
  },
  mainWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
  },
  header: {
    height: '70px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-surface-glass)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    position: 'sticky',
    top: 0,
    zIndex: 90,
  },
  headerTitle: {
    fontFamily: 'var(--font-heading)',
  },
  roleSwitcherContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'var(--bg-surface-hover)',
    border: '1px solid var(--border-color)',
    padding: '6px 12px',
    borderRadius: 'var(--radius-sm)',
  },
  roleSwitcherLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  selectWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  roleSelect: {
    appearance: 'none',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '13px',
    fontWeight: '700',
    paddingRight: '20px',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-heading)',
  },
  selectIcon: {
    position: 'absolute',
    right: 0,
    pointerEvents: 'none',
    color: 'var(--text-muted)',
  },
};
